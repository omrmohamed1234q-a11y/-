/**
 * 🔒🔒🔒 CRITICAL PROTECTION MODULE 🔒🔒🔒
 * 
 * هذا الملف يحتوي على الثوابت والدوال المحمية للسلة والطباعة
 * ⚠️ تحذير: أي تعديل في هذا الملف يجب أن يمر باختبارات شاملة أولاً
 * 
 * الغرض: حماية العمليات الأساسية بدون تعديل الكود الموجود
 * تاريخ الإنشاء: $(date)
 * 🔒🔒🔒 END PROTECTION HEADER 🔒🔒🔒
 */

// ⚠️ PROTECTED CONSTANTS - لا تغير هذه القيم بدون اختبار شامل
export const CART_PROTECTION = {
  // حدود السلة الآمنة
  MAX_QUANTITY: 999,
  MIN_QUANTITY: 1,
  MAX_ITEMS_IN_CART: 50,
  
  // دقة الأسعار المالية
  PRICE_PRECISION: 2,
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99,
  
  // مفاتيح التخزين المحمية
  STORAGE_KEYS: {
    CART_STATE: 'cart_state_v2',
    CART_BACKUP: 'cart_backup_v2',
    LAST_CART_UPDATE: 'cart_last_update'
  },
  
  // رسائل الأخطاء المعيارية
  ERROR_MESSAGES: {
    INVALID_QUANTITY: 'الكمية غير صحيحة - يجب أن تكون بين 1 و 999',
    INVALID_PRICE: 'السعر غير صالح',
    INVALID_ITEM: 'بيانات المنتج غير صحيحة',
    CALCULATION_ERROR: 'خطأ في حساب المجموع',
    CART_FULL: 'السلة ممتلئة - الحد الأقصى 50 منتج',
    STORAGE_ERROR: 'خطأ في حفظ بيانات السلة'
  }
} as const;

export const PRINT_PROTECTION = {
  // أنواع الملفات المدعومة (محمية) - متوافق مع النظام الحالي
  SUPPORTED_FORMATS: [
    'pdf', 'jpg', 'jpeg', 'png'
  ] as const,
  
  // حدود الملفات الآمنة
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MIN_FILE_SIZE: 1024, // 1KB
  MAX_FILES_PER_ORDER: 20,
  
  // إعدادات الطباعة المحمية
  COPY_LIMITS: {
    MIN: 1,
    MAX: 999,
    DEFAULT: 1
  },
  
  // أسعار مرجعية للفحص والتحقق فقط - ليست مصدر الحقيقة
  REFERENCE_PRICING: {
    BASE_PAGE_PRICE: 0.50, // قيمة مرجعية للمقارنة
    COLOR_MULTIPLIER: 2.0,
    BINDING_PRICE: 5.0,
    URGENT_MULTIPLIER: 1.5,
    DELIVERY_BASE: 10.0
  },
  
  // أوضاع الطباعة المحمية
  PRINT_MODES: {
    BLACK_WHITE: 'bw',
    COLOR: 'color',
    GRAYSCALE: 'grayscale'
  },
  
  ERROR_MESSAGES: {
    INVALID_FILE_TYPE: 'نوع الملف غير مدعوم',
    FILE_TOO_LARGE: 'حجم الملف كبير جداً - الحد الأقصى 50 ميجابايت',
    FILE_TOO_SMALL: 'الملف فارغ أو تالف',
    INVALID_COPIES: 'عدد النسخ غير صحيح',
    UPLOAD_FAILED: 'فشل في رفع الملف',
    PROCESSING_ERROR: 'خطأ في معالجة الملف'
  }
} as const;

// 🔒🔒🔒 CRITICAL FUNCTIONS START 🔒🔒🔒

/**
 * حساب مجموع السلة بطريقة آمنة
 * هذه الدالة محمية ومختبرة - لا تعدل
 */
export const calculateSafeCartTotal = (items: any[]): number => {
  try {
    if (!Array.isArray(items)) {
      console.error('🚨 CRITICAL: calculateSafeCartTotal received non-array:', typeof items);
      return 0;
    }

    let total = 0;
    
    for (const item of items) {
      // التحقق من صحة البيانات
      if (!isValidCartItem(item)) {
        console.warn('⚠️ Invalid cart item skipped:', item);
        continue;
      }
      
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      
      // التحقق من الأرقام
      if (isNaN(price) || isNaN(quantity)) {
        console.error('🚨 CRITICAL: Invalid numbers in cart item:', { price: item.price, quantity: item.quantity });
        continue;
      }
      
      const itemTotal = price * quantity;
      
      // فحص النتيجة
      if (isNaN(itemTotal) || itemTotal < 0) {
        console.error('🚨 CRITICAL: Invalid calculation result:', itemTotal);
        continue;
      }
      
      total += itemTotal;
    }
    
    // تقريب لضمان الدقة المالية باستخدام PRICE_PRECISION
    const multiplier = Math.pow(10, CART_PROTECTION.PRICE_PRECISION);
    return Math.round(total * multiplier) / multiplier;
    
  } catch (error) {
    console.error('🚨 CRITICAL ERROR in calculateSafeCartTotal:', error);
    throw new Error(CART_PROTECTION.ERROR_MESSAGES.CALCULATION_ERROR);
  }
};

/**
 * التحقق من صحة عنصر السلة
 */
export const isValidCartItem = (item: any): boolean => {
  if (!item || typeof item !== 'object') {
    return false;
  }
  
  // التحقق من الحقول المطلوبة
  const requiredFields = ['id', 'productId', 'price', 'quantity'];
  for (const field of requiredFields) {
    if (!(field in item)) {
      return false;
    }
  }
  
  // التحقق من أنواع البيانات
  if (typeof item.id !== 'string' || item.id.trim() === '') {
    return false;
  }
  
  if (typeof item.productId !== 'string' || item.productId.trim() === '') {
    return false;
  }
  
  const price = Number(item.price);
  const quantity = Number(item.quantity);
  
  // التحقق من صحة الأرقام
  if (isNaN(price) || price < CART_PROTECTION.MIN_PRICE || price > CART_PROTECTION.MAX_PRICE) {
    return false;
  }
  
  if (isNaN(quantity) || !Number.isInteger(quantity) || 
      quantity < CART_PROTECTION.MIN_QUANTITY || quantity > CART_PROTECTION.MAX_QUANTITY) {
    return false;
  }
  
  return true;
};

/**
 * التحقق من صحة ملف الطباعة
 */
export const isValidPrintFile = (file: File): { isValid: boolean; error?: string } => {
  try {
    // فحص وجود الملف
    if (!file) {
      return { isValid: false, error: 'لا يوجد ملف' };
    }
    
    // فحص حجم الملف
    if (file.size > PRINT_PROTECTION.MAX_FILE_SIZE) {
      return { isValid: false, error: PRINT_PROTECTION.ERROR_MESSAGES.FILE_TOO_LARGE };
    }
    
    if (file.size < PRINT_PROTECTION.MIN_FILE_SIZE) {
      return { isValid: false, error: PRINT_PROTECTION.ERROR_MESSAGES.FILE_TOO_SMALL };
    }
    
    // فحص نوع الملف
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !PRINT_PROTECTION.SUPPORTED_FORMATS.includes(fileExtension as any)) {
      return { isValid: false, error: PRINT_PROTECTION.ERROR_MESSAGES.INVALID_FILE_TYPE };
    }
    
    return { isValid: true };
    
  } catch (error) {
    console.error('🚨 Error validating print file:', error);
    return { isValid: false, error: 'خطأ في فحص الملف' };
  }
};

/**
 * حساب سعر الطباعة بطريقة آمنة (مرجعي فقط)
 * تحذير: هذه دالة مرجعية للفحص - استخدم نظام التسعير الأساسي للحسابات الفعلية
 */
export const calculateReferencePrintPrice = (pages: number, isColor: boolean = false, binding: boolean = false, isUrgent: boolean = false): number => {
  try {
    if (!Number.isInteger(pages) || pages <= 0) {
      throw new Error('عدد الصفحات غير صحيح');
    }
    
    let basePrice = pages * PRINT_PROTECTION.REFERENCE_PRICING.BASE_PAGE_PRICE;
    
    // إضافة سعر الألوان
    if (isColor) {
      basePrice *= PRINT_PROTECTION.REFERENCE_PRICING.COLOR_MULTIPLIER;
    }
    
    // إضافة سعر التجليد
    if (binding) {
      basePrice += PRINT_PROTECTION.REFERENCE_PRICING.BINDING_PRICE;
    }
    
    // إضافة سعر الاستعجال
    if (isUrgent) {
      basePrice *= PRINT_PROTECTION.REFERENCE_PRICING.URGENT_MULTIPLIER;
    }
    
    // تقريب لضمان الدقة المالية باستخدام PRICE_PRECISION
    const multiplier = Math.pow(10, CART_PROTECTION.PRICE_PRECISION);
    return Math.round(basePrice * multiplier) / multiplier;
    
  } catch (error) {
    console.error('🚨 Error calculating reference print price:', error);
    throw new Error('خطأ في حساب سعر الطباعة المرجعي');
  }
};

/**
 * التحقق من صحة عدد النسخ
 */
export const validateCopyCount = (copies: any): { isValid: boolean; value: number; error?: string } => {
  const copyCount = Number(copies);
  
  if (isNaN(copyCount) || !Number.isInteger(copyCount)) {
    return { isValid: false, value: 1, error: 'عدد النسخ يجب أن يكون رقم صحيح' };
  }
  
  if (copyCount < PRINT_PROTECTION.COPY_LIMITS.MIN) {
    return { isValid: false, value: 1, error: `الحد الأدنى للنسخ هو ${PRINT_PROTECTION.COPY_LIMITS.MIN}` };
  }
  
  if (copyCount > PRINT_PROTECTION.COPY_LIMITS.MAX) {
    return { isValid: false, value: 1, error: `الحد الأقصى للنسخ هو ${PRINT_PROTECTION.COPY_LIMITS.MAX}` };
  }
  
  return { isValid: true, value: copyCount };
};

// 🔒🔒🔒 CRITICAL FUNCTIONS END 🔒🔒🔒

/**
 * دالة مساعدة لتسجيل الأخطاء الأمنية
 */
export const logSecurityEvent = (event: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`🔒 [${timestamp}] SECURITY EVENT: ${event}`, data);
  
  // يمكن إضافة إرسال للخادم لاحقاً
  // sendToSecurityLog({ timestamp, event, data });
};

/**
 * فحص سلامة التطبيق بشكل عام (استدعاء يدوي فقط)
 */
export const performSafetyCheck = () => {
  const results = {
    timestamp: new Date().toISOString(),
    cartConstants: !!CART_PROTECTION,
    printConstants: !!PRINT_PROTECTION,
    criticalFunctions: {
      calculateSafeCartTotal: typeof calculateSafeCartTotal === 'function',
      isValidCartItem: typeof isValidCartItem === 'function',
      isValidPrintFile: typeof isValidPrintFile === 'function',
      calculateReferencePrintPrice: typeof calculateReferencePrintPrice === 'function'
    },
    allFunctionsPresent: true // سيتم تحديثها أدناه
  };
  
  // فحص حقيقي للدوال
  results.allFunctionsPresent = Object.values(results.criticalFunctions).every(fn => fn === true);
  
  logSecurityEvent('SAFETY_CHECK_COMPLETED', results);
  return results;
};

// ملاحظة: لا يوجد تشغيل تلقائي - استدعاء يدوي فقط عند الحاجة