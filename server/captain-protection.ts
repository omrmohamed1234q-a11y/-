// نظام حماية الكباتن المتقدم - مثل أنظمة السلة والطباعة
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// === VALIDATION SCHEMAS ===

// Schema للكابتن login
export const captainLoginSchema = z.object({
  username: z.string()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(50, 'اسم المستخدم طويل جداً')
    .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يحتوي على أحرف غير مسموحة')
    .trim(),
  password: z.string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .max(100, 'كلمة المرور طويلة جداً')
    .trim(),
  driverCode: z.string()
    .optional()
    .refine(val => !val || /^[A-Z0-9]{3,10}$/.test(val), 'رمز السائق غير صحيح')
});

// Schema لتحديث موقع الكابتن
export const updateLocationSchema = z.object({
  lat: z.number()
    .min(-90, 'خط العرض غير صحيح')
    .max(90, 'خط العرض غير صحيح'),
  lng: z.number()
    .min(-180, 'خط الطول غير صحيح')
    .max(180, 'خط الطول غير صحيح'),
  heading: z.number()
    .min(0)
    .max(360)
    .optional(),
  speed: z.number()
    .min(0)
    .max(200)
    .optional(),
  accuracy: z.number()
    .min(0)
    .optional()
});

// Schema لتحديث حالة الطلب
export const updateOrderStatusSchema = z.object({
  orderId: z.string()
    .min(1, 'معرف الطلب مطلوب')
    .max(100, 'معرف الطلب طويل جداً'),
  status: z.enum(['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'حالة الطلب غير صحيحة' })
  }),
  notes: z.string()
    .max(500, 'الملاحظات طويلة جداً')
    .optional(),
  location: updateLocationSchema.optional()
});

// Schema لإضافة ملاحظة للطلب
export const addOrderNoteSchema = z.object({
  orderId: z.string().min(1, 'معرف الطلب مطلوب'),
  note: z.string()
    .min(1, 'النص مطلوب')
    .max(1000, 'النص طويل جداً')
    .trim()
});

// === RATE LIMITING ===

// Rate limiting للكابتن login - صارم جداً
export const captainLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات فقط كل 15 دقيقة
  message: {
    success: false,
    error: 'تم تجاوز عدد محاولات تسجيل الدخول المسموحة. حاول مرة أخرى بعد 15 دقيقة',
    retryAfter: '15 minutes',
    type: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // تجاهل الـ rate limit في بيئة التطوير للاختبار
    return process.env.NODE_ENV === 'development' && req.body?.dev_bypass === 'true';
  }
});

// Rate limiting للـ APIs العامة للكابتن
export const captainApiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 دقائق
  max: 100, // 100 طلب كل 5 دقائق
  message: {
    success: false,
    error: 'تم تجاوز حد الطلبات المسموحة. حاول مرة أخرى لاحقاً',
    retryAfter: '5 minutes',
    type: 'API_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Speed limiting لتحديث الموقع
export const locationUpdateLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // دقيقة واحدة
  delayAfter: 20, // بعد 20 طلب
  delayMs: (used) => (used - 20) * 100, // زيادة التأخير
  maxDelayMs: 5000 // أقصى تأخير 5 ثوان
});

// === MIDDLEWARE للحماية ===

// التحقق من صحة JWT token للكابتن
export const verifyCaptainToken = async (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const captainSession = req.headers['x-captain-session'];
    
    let token = null;
    
    // البحث عن التوكن في أماكن مختلفة
    if (captainSession) {
      token = captainSession;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'رمز التوثيق مطلوب',
        errorCode: 'MISSING_TOKEN'
      });
    }
    
    // التحقق من صحة التوكن
    const secretKey = process.env.JWT_SECRET;
    
    if (!secretKey) {
      console.error('❌ JWT_SECRET environment variable is missing');
      return res.status(500).json({
        success: false,
        error: 'خطأ في إعدادات الخادم',
        errorCode: 'SERVER_CONFIG_ERROR'
      });
    }
    
    try {
      const decoded = jwt.verify(token, secretKey);
      
      // التحقق من أن التوكن خاص بالكابتن
      if (decoded.role !== 'captain') {
        return res.status(403).json({
          success: false,
          error: 'غير مخول للوصول لهذا النظام',
          errorCode: 'INVALID_ROLE'
        });
      }
      
      // إضافة بيانات الكابتن للـ request
      req.captain = {
        id: decoded.captainId,
        username: decoded.username,
        email: decoded.email,
        fullName: decoded.fullName,
        driverCode: decoded.driverCode,
        tokenIssuedAt: decoded.iat,
        tokenExpires: decoded.exp
      };
      
      next();
      
    } catch (jwtError: any) {
      let errorMessage = 'رمز التوثيق غير صحيح';
      let errorCode = 'INVALID_TOKEN';
      
      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'انتهت صلاحية رمز التوثيق. يرجى تسجيل الدخول مرة أخرى';
        errorCode = 'TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'رمز التوثيق تالف';
        errorCode = 'TOKEN_MALFORMED';
      }
      
      return res.status(401).json({
        success: false,
        error: errorMessage,
        errorCode
      });
    }
    
  } catch (error: any) {
    console.error('❌ Captain token verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'خطأ في التحقق من التوثيق',
      errorCode: 'AUTH_VERIFICATION_ERROR'
    });
  }
};

// التحقق من حالة الكابتن (متاح أم لا)
export const verifyCaptainStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    // هذا middleware يفترض أن verifyCaptainToken تم تشغيله أولاً
    if (!req.captain) {
      return res.status(401).json({
        success: false,
        error: 'بيانات الكابتن غير موجودة',
        errorCode: 'CAPTAIN_DATA_MISSING'
      });
    }
    
    // يمكن إضافة فحوصات إضافية هنا:
    // - التحقق من أن الكابتن متاح للعمل
    // - التحقق من أن الحساب غير محظور
    // - التحقق من المنطقة الجغرافية المسموحة
    
    next();
    
  } catch (error: any) {
    console.error('❌ Captain status verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'خطأ في التحقق من حالة الكابتن',
      errorCode: 'STATUS_VERIFICATION_ERROR'
    });
  }
};

// === تنظيف وتعقيم المدخلات ===

export const sanitizeInput = (req: any, res: Response, next: NextFunction) => {
  try {
    // تنظيف النصوص من المحتوى الخطير
    const sanitizeString = (str: string): string => {
      if (typeof str !== 'string') return str;
      
      return str
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // إزالة الـ scripts
        .replace(/javascript:/gi, '') // إزالة javascript: URLs
        .replace(/on\w+\s*=/gi, '') // إزالة event handlers
        .replace(/[<>]/g, ''); // إزالة < و >
    };
    
    // تنظيف body
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeString(req.body[key]);
        }
      }
    }
    
    // تنظيف query parameters
    if (req.query && typeof req.query === 'object') {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeString(req.query[key] as string);
        }
      }
    }
    
    next();
    
  } catch (error: any) {
    console.error('❌ Input sanitization error:', error);
    // لا نريد أن نفشل الطلب بسبب تنظيف المدخلات
    next();
  }
};

// === LOGGING للأحداث المهمة ===

export const logCaptainActivity = (action: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // تسجيل بداية العملية
    console.log(`🚛 [${new Date().toISOString()}] Captain ${action}:`, {
      captainId: req.captain?.id || 'unknown',
      username: req.captain?.username || 'unknown',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      body: req.method === 'POST' ? sanitizeLogData(req.body) : undefined
    });
    
    // Override response.json لتسجيل النتيجة
    const originalJson = res.json;
    res.json = function(body: any) {
      const duration = Date.now() - startTime;
      const success = body?.success !== false;
      
      console.log(`🚛 [${new Date().toISOString()}] Captain ${action} ${success ? 'SUCCESS' : 'FAILED'}:`, {
        captainId: req.captain?.id || 'unknown',
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        success,
        error: success ? undefined : body?.error
      });
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};

// تنظيف البيانات للـ logging (إخفاء كلمات المرور وما شابه)
function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***HIDDEN***';
    }
  }
  
  return sanitized;
}

// === ERROR HANDLING ===

export const handleCaptainErrors = (error: any, req: any, res: Response, next: NextFunction) => {
  console.error('❌ Captain system error:', {
    error: error.message,
    stack: error.stack,
    captainId: req.captain?.id,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // تحديد نوع الخطأ وإرسال رد مناسب
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'بيانات غير صحيحة',
      details: error.message,
      errorCode: 'VALIDATION_ERROR'
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'غير مخول للوصول',
      errorCode: 'UNAUTHORIZED'
    });
  }
  
  // خطأ عام
  res.status(500).json({
    success: false,
    error: 'حدث خطأ في النظام. يرجى المحاولة لاحقاً',
    errorCode: 'INTERNAL_SERVER_ERROR'
  });
};

// === UTILITY FUNCTIONS ===

// تحقق من صحة معرف الطلب
export const validateOrderId = (orderId: string): boolean => {
  return typeof orderId === 'string' && 
         orderId.length > 0 && 
         orderId.length <= 100 &&
         /^[a-zA-Z0-9_-]+$/.test(orderId);
};

// تحقق من صحة الإحداثيات الجغرافية
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return typeof lat === 'number' && 
         typeof lng === 'number' &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180;
};

// إنشاء response موحد للنجاح
export const createSuccessResponse = (data: any, message?: string) => {
  return {
    success: true,
    data,
    message: message || 'تمت العملية بنجاح',
    timestamp: new Date().toISOString()
  };
};

// إنشاء response موحد للفشل
export const createErrorResponse = (error: string, errorCode?: string, details?: any) => {
  return {
    success: false,
    error,
    errorCode: errorCode || 'UNKNOWN_ERROR',
    details,
    timestamp: new Date().toISOString()
  };
};