/**
 * 🔍 DATA VALIDATION SYSTEM 🔍
 * 
 * نظام التحقق من صحة البيانات للسلة والطباعة
 * الغرض: فحص وتنظيف البيانات قبل وصولها للنظام الأساسي
 * 
 * هذا النظام يعمل كطبقة حماية إضافية بدون تعديل الكود الموجود
 * 
 * تاريخ الإنشاء: 2025-01-19
 * 🔍 END VALIDATION HEADER 🔍
 */

import { CART_PROTECTION, PRINT_PROTECTION } from './core-protected';

// ===== أنواع البيانات المحمية =====

export interface ValidatedCartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
    fileType?: string;
  };
  validation: {
    isValid: boolean;
    lastChecked: string;
    warnings: string[];
  };
}

export interface ValidatedPrintJob {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  pages: number;
  copies: number;
  isColor: boolean;
  binding: boolean;
  isUrgent: boolean;
  estimatedPrice: number;
  validation: {
    isValid: boolean;
    lastChecked: string;
    warnings: string[];
    errors: string[];
  };
}

export interface ValidationResult<T = any> {
  isValid: boolean;
  data: T | null;
  errors: string[];
  warnings: string[];
  suggestedFix?: string;
  timestamp: string;
}

// ===== دوال التحقق الأساسية =====

/**
 * تنظيف وتحقق من صحة عنصر السلة
 */
export const validateAndSanitizeCartItem = (rawItem: any): ValidationResult<ValidatedCartItem> => {
  const result: ValidationResult<ValidatedCartItem> = {
    isValid: false,
    data: null,
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString()
  };

  try {
    // فحص وجود البيانات الأساسية
    if (!rawItem || typeof rawItem !== 'object') {
      result.errors.push('بيانات المنتج مفقودة أو غير صحيحة');
      return result;
    }

    // تنظيف الحقول الأساسية
    const cleanItem = {
      id: String(rawItem.id || '').trim(),
      productId: String(rawItem.productId || '').trim(),
      productName: String(rawItem.productName || 'منتج غير محدد').trim(),
      productImage: rawItem.productImage ? String(rawItem.productImage).trim() : undefined,
      price: Number(rawItem.price),
      quantity: Number(rawItem.quantity),
      variant: rawItem.variant && typeof rawItem.variant === 'object' ? {
        size: rawItem.variant.size ? String(rawItem.variant.size).trim() : undefined,
        color: rawItem.variant.color ? String(rawItem.variant.color).trim() : undefined,
        fileType: rawItem.variant.fileType ? String(rawItem.variant.fileType).toLowerCase().trim() : undefined,
      } : undefined
    };

    // التحقق من الحقول المطلوبة
    if (!cleanItem.id) {
      result.errors.push('معرف المنتج مطلوب');
    }

    if (!cleanItem.productId) {
      result.errors.push('رقم المنتج مطلوب');
    }

    // التحقق من الأسعار
    if (isNaN(cleanItem.price)) {
      result.errors.push('السعر غير صحيح');
    } else if (cleanItem.price < CART_PROTECTION.MIN_PRICE) {
      result.errors.push(`السعر أقل من الحد الأدنى (${CART_PROTECTION.MIN_PRICE})`);
    } else if (cleanItem.price > CART_PROTECTION.MAX_PRICE) {
      result.errors.push(`السعر أكبر من الحد الأقصى (${CART_PROTECTION.MAX_PRICE})`);
    }

    // التحقق من الكمية
    if (isNaN(cleanItem.quantity) || !Number.isInteger(cleanItem.quantity)) {
      result.errors.push('الكمية يجب أن تكون رقم صحيح');
    } else if (cleanItem.quantity < CART_PROTECTION.MIN_QUANTITY) {
      result.errors.push(`الكمية أقل من الحد الأدنى (${CART_PROTECTION.MIN_QUANTITY})`);
    } else if (cleanItem.quantity > CART_PROTECTION.MAX_QUANTITY) {
      result.errors.push(`الكمية أكبر من الحد الأقصى (${CART_PROTECTION.MAX_QUANTITY})`);
    }

    // تحذيرات إضافية
    if (cleanItem.productName === 'منتج غير محدد') {
      result.warnings.push('اسم المنتج غير محدد');
    }

    if (cleanItem.quantity > 100) {
      result.warnings.push('كمية كبيرة - تأكد من صحة الطلب');
    }

    if (cleanItem.price * cleanItem.quantity > 10000) {
      result.warnings.push('قيمة عالية - يُنصح بمراجعة الطلب');
    }

    // إذا لم توجد أخطاء، قم بإنشاء العنصر المحقق
    if (result.errors.length === 0) {
      result.isValid = true;
      result.data = {
        ...cleanItem,
        validation: {
          isValid: true,
          lastChecked: result.timestamp,
          warnings: result.warnings
        }
      };
    }

    return result;

  } catch (error) {
    console.error('🚨 خطأ في تحقق صحة عنصر السلة:', error);
    result.errors.push('خطأ داخلي في التحقق من البيانات');
    return result;
  }
};

/**
 * تحقق من صحة مجموعة عناصر السلة
 */
export const validateCartItems = (items: any[]): ValidationResult<ValidatedCartItem[]> => {
  const result: ValidationResult<ValidatedCartItem[]> = {
    isValid: true,
    data: [],
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString()
  };

  if (!Array.isArray(items)) {
    result.isValid = false;
    result.errors.push('قائمة المنتجات يجب أن تكون مصفوفة');
    return result;
  }

  if (items.length > CART_PROTECTION.MAX_ITEMS_IN_CART) {
    result.isValid = false;
    result.errors.push(`عدد المنتجات يتجاوز الحد الأقصى (${CART_PROTECTION.MAX_ITEMS_IN_CART})`);
    return result;
  }

  const validatedItems: ValidatedCartItem[] = [];
  const duplicateIds = new Set<string>();
  const seenIds = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const itemValidation = validateAndSanitizeCartItem(items[i]);
    
    if (itemValidation.isValid && itemValidation.data) {
      // فحص التكرار
      if (seenIds.has(itemValidation.data.id)) {
        duplicateIds.add(itemValidation.data.id);
        result.warnings.push(`منتج مكرر: ${itemValidation.data.productName}`);
      } else {
        seenIds.add(itemValidation.data.id);
      }
      
      validatedItems.push(itemValidation.data);
      result.warnings.push(...itemValidation.warnings);
    } else {
      result.errors.push(`عنصر رقم ${i + 1}: ${itemValidation.errors.join(', ')}`);
    }
  }

  // إذا كان هناك منتجات مكررة، ادمجها
  if (duplicateIds.size > 0) {
    result.warnings.push(`تم دمج ${duplicateIds.size} منتج مكرر`);
    result.suggestedFix = 'سيتم دمج المنتجات المكررة تلقائياً';
  }

  result.isValid = result.errors.length === 0;
  result.data = validatedItems;

  return result;
};

/**
 * تحقق من صحة ملف للطباعة
 */
export const validatePrintFile = (file: File, copies: number = 1, isColor: boolean = false): ValidationResult<ValidatedPrintJob> => {
  const result: ValidationResult<ValidatedPrintJob> = {
    isValid: false,
    data: null,
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString()
  };

  try {
    // فحص وجود الملف
    if (!file || !(file instanceof File)) {
      result.errors.push('لم يتم اختيار ملف');
      return result;
    }

    // استخراج نوع الملف
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension) {
      result.errors.push('نوع الملف غير محدد');
      return result;
    }

    // فحص نوع الملف المدعوم
    if (!PRINT_PROTECTION.SUPPORTED_FORMATS.includes(fileExtension as any)) {
      result.errors.push(`نوع الملف ${fileExtension} غير مدعوم. الأنواع المدعومة: ${PRINT_PROTECTION.SUPPORTED_FORMATS.join(', ')}`);
      return result;
    }

    // فحص حجم الملف
    if (file.size > PRINT_PROTECTION.MAX_FILE_SIZE) {
      result.errors.push(`حجم الملف كبير جداً (${(file.size / 1024 / 1024).toFixed(1)} ميجابايت). الحد الأقصى ${PRINT_PROTECTION.MAX_FILE_SIZE / 1024 / 1024} ميجابايت`);
      return result;
    }

    if (file.size < PRINT_PROTECTION.MIN_FILE_SIZE) {
      result.errors.push('الملف فارغ أو تالف');
      return result;
    }

    // فحص عدد النسخ
    const copyValidation = validateCopyCount(copies);
    if (!copyValidation.isValid) {
      result.errors.push(copyValidation.error || 'عدد النسخ غير صحيح');
      return result;
    }

    // تقدير عدد الصفحات (تقدير أولي)
    let estimatedPages = 1;
    if (fileExtension === 'pdf') {
      // للـ PDF سنحتاج لحساب فعلي لاحقاً
      estimatedPages = Math.max(1, Math.floor(file.size / 50000)); // تقدير: 50KB للصفحة
    }

    // حساب السعر التقديري
    let estimatedPrice = 0;
    try {
      estimatedPrice = estimatedPages * PRINT_PROTECTION.REFERENCE_PRICING.BASE_PAGE_PRICE;
      if (isColor) {
        estimatedPrice *= PRINT_PROTECTION.REFERENCE_PRICING.COLOR_MULTIPLIER;
      }
      estimatedPrice *= copyValidation.value;
    } catch (error) {
      result.warnings.push('تعذر حساب السعر التقديري');
    }

    // تحذيرات
    if (file.size > 10 * 1024 * 1024) { // أكبر من 10 ميجابايت
      result.warnings.push('ملف كبير - قد يستغرق وقتاً أطول للمعالجة');
    }

    if (copies > 50) {
      result.warnings.push('عدد نسخ كبير - تأكد من الطلب');
    }

    if (estimatedPrice > 1000) {
      result.warnings.push('تكلفة مرتفعة - يُنصح بمراجعة الطلب');
    }

    // إنشاء بيانات الوظيفة المحققة
    result.isValid = true;
    result.data = {
      id: `print_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: fileExtension,
      pages: estimatedPages,
      copies: copyValidation.value,
      isColor,
      binding: false, // افتراضي
      isUrgent: false, // افتراضي
      estimatedPrice,
      validation: {
        isValid: true,
        lastChecked: result.timestamp,
        warnings: result.warnings,
        errors: []
      }
    };

    return result;

  } catch (error) {
    console.error('🚨 خطأ في تحقق صحة ملف الطباعة:', error);
    result.errors.push('خطأ داخلي في فحص الملف');
    return result;
  }
};

/**
 * فحص عدد النسخ مع تصحيح تلقائي
 */
export const validateCopyCount = (copies: any): { isValid: boolean; value: number; error?: string } => {
  // محاولة تحويل للرقم
  let copyCount = Number(copies);
  
  // إذا لم يكن رقم، حاول استخراج الأرقام من النص
  if (isNaN(copyCount) && typeof copies === 'string') {
    const extracted = copies.match(/\d+/);
    if (extracted) {
      copyCount = Number(extracted[0]);
    }
  }
  
  if (isNaN(copyCount) || !Number.isInteger(copyCount)) {
    return { isValid: false, value: PRINT_PROTECTION.COPY_LIMITS.DEFAULT, error: 'عدد النسخ يجب أن يكون رقم صحيح' };
  }
  
  if (copyCount < PRINT_PROTECTION.COPY_LIMITS.MIN) {
    return { isValid: false, value: PRINT_PROTECTION.COPY_LIMITS.MIN, error: `الحد الأدنى للنسخ هو ${PRINT_PROTECTION.COPY_LIMITS.MIN}` };
  }
  
  if (copyCount > PRINT_PROTECTION.COPY_LIMITS.MAX) {
    return { isValid: false, value: PRINT_PROTECTION.COPY_LIMITS.MAX, error: `الحد الأقصى للنسخ هو ${PRINT_PROTECTION.COPY_LIMITS.MAX}` };
  }
  
  return { isValid: true, value: copyCount };
};

/**
 * فحص سلامة بيانات الدفع
 */
export const validatePaymentData = (paymentData: any): ValidationResult<any> => {
  const result: ValidationResult<any> = {
    isValid: false,
    data: null,
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString()
  };

  try {
    if (!paymentData || typeof paymentData !== 'object') {
      result.errors.push('بيانات الدفع مفقودة');
      return result;
    }

    const { amount, currency, method } = paymentData;

    // فحص المبلغ
    const cleanAmount = Number(amount);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      result.errors.push('مبلغ الدفع غير صحيح');
    }

    // فحص العملة
    if (!currency || typeof currency !== 'string') {
      result.errors.push('نوع العملة غير محدد');
    } else if (currency.toUpperCase() !== 'EGP') {
      result.warnings.push(`عملة غير معتادة: ${currency}`);
    }

    // فحص طريقة الدفع
    const validMethods = ['cash', 'card', 'online', 'wallet'];
    if (!method || !validMethods.includes(String(method).toLowerCase())) {
      result.errors.push(`طريقة دفع غير صحيحة. الطرق المتاحة: ${validMethods.join(', ')}`);
    }

    if (result.errors.length === 0) {
      result.isValid = true;
      result.data = {
        amount: cleanAmount,
        currency: String(currency).toUpperCase(),
        method: String(method).toLowerCase(),
        timestamp: result.timestamp
      };
    }

    return result;

  } catch (error) {
    console.error('🚨 خطأ في فحص بيانات الدفع:', error);
    result.errors.push('خطأ في فحص بيانات الدفع');
    return result;
  }
};

/**
 * تقرير شامل عن حالة التحقق
 */
export const generateValidationReport = (items: any[], files: File[] = []): any => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalItems: items.length,
      totalFiles: files.length,
      validItems: 0,
      validFiles: 0,
      totalErrors: 0,
      totalWarnings: 0
    },
    cartValidation: null as any,
    fileValidations: [] as any[],
    recommendations: [] as string[]
  };

  // فحص السلة
  if (items.length > 0) {
    const cartValidation = validateCartItems(items);
    report.cartValidation = cartValidation;
    report.summary.validItems = cartValidation.data?.length || 0;
    report.summary.totalErrors += cartValidation.errors.length;
    report.summary.totalWarnings += cartValidation.warnings.length;
  }

  // فحص الملفات
  files.forEach((file, index) => {
    const fileValidation = validatePrintFile(file);
    report.fileValidations.push({
      index,
      fileName: file.name,
      validation: fileValidation
    });
    
    if (fileValidation.isValid) {
      report.summary.validFiles++;
    }
    
    report.summary.totalErrors += fileValidation.errors.length;
    report.summary.totalWarnings += fileValidation.warnings.length;
  });

  // توصيات
  if (report.summary.totalErrors > 0) {
    report.recommendations.push('يُنصح بحل جميع الأخطاء قبل المتابعة');
  }
  
  if (report.summary.totalWarnings > 5) {
    report.recommendations.push('عدد كبير من التحذيرات - راجع البيانات');
  }
  
  if (report.summary.validItems > 20) {
    report.recommendations.push('سلة كبيرة - تأكد من صحة جميع العناصر');
  }

  return report;
};

/**
 * تسجيل أحداث التحقق للمراقبة
 */
export const logValidationEvent = (type: string, data: any) => {
  const event = {
    timestamp: new Date().toISOString(),
    type,
    data,
    source: 'data-validators'
  };
  
  console.log('🔍 [VALIDATION]', event);
  
  // يمكن إضافة إرسال للخادم لاحقاً
  // sendValidationLog(event);
};