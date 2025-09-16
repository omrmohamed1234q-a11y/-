import twilio, { Twilio } from 'twilio';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber?: string; // اختياري - يمكن استخدام رقم مجاني من Twilio
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  verificationId?: string;
  error?: string;
}

export interface VerificationStorage {
  code: string;
  phoneNumber: string;
  expiresAt: number;
  attempts: number;
}

export class TwilioSMSService {
  private client: Twilio | null = null;
  private isConfigured: boolean = false;
  private fromNumber?: string;
  
  // الكود المؤقت - في الإنتاج استخدم Redis أو قاعدة البيانات
  private verificationCodes = new Map<string, VerificationStorage>();
  
  constructor(config?: TwilioConfig) {
    this.initializeClient(config);
    this.startCleanupInterval();
  }

  private initializeClient(config?: TwilioConfig) {
    try {
      const accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN;
      this.fromNumber = config?.phoneNumber || process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken) {
        console.warn('⚠️ Twilio credentials not configured. SMS service will be disabled.');
        this.isConfigured = false;
        return;
      }

      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
      
      console.log('✅ Twilio SMS service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Twilio service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * تحقق من إعداد الخدمة
   */
  isEnabled(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * إرسال كود التحقق عبر SMS
   */
  async sendVerificationCode(phoneNumber: string): Promise<SMSResult> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: 'Twilio service not configured'
      };
    }

    try {
      // إنشاء كود التحقق
      const code = this.generateVerificationCode();
      const verificationId = this.generateVerificationId();
      
      // حفظ الكود مؤقتاً (10 دقائق)
      this.verificationCodes.set(verificationId, {
        code,
        phoneNumber,
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 دقائق
        attempts: 0
      });

      // تحديد نص الرسالة
      const messageBody = `كود التحقق الخاص بك في اطبعلي: ${code}\nهذا الكود صالح لمدة 10 دقائق`;

      // إرسال الرسالة عبر Twilio
      const message = await this.client!.messages.create({
        body: messageBody,
        from: this.fromNumber || undefined, // إذا لم يكن محدد، Twilio سيختار رقم مجاني
        to: phoneNumber
      });

      console.log(`✅ SMS sent successfully to ${phoneNumber} (Message ID: ${message.sid})`);

      return {
        success: true,
        messageId: message.sid,
        verificationId: verificationId
      };

    } catch (error: any) {
      console.error('❌ Failed to send SMS via Twilio:', error);
      
      let errorMessage = 'Failed to send SMS';
      if (error.code === 21614) {
        errorMessage = 'Invalid phone number format';
      } else if (error.code === 21408) {
        errorMessage = 'Permission denied to send SMS to this number';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * التحقق من كود SMS المدخل
   */
  async verifyCode(verificationId: string, enteredCode: string): Promise<SMSResult> {
    const verification = this.verificationCodes.get(verificationId);
    
    if (!verification) {
      return {
        success: false,
        error: 'Verification session not found or expired'
      };
    }

    // تحقق من انتهاء الوقت
    if (Date.now() > verification.expiresAt) {
      this.verificationCodes.delete(verificationId);
      return {
        success: false,
        error: 'Verification code expired'
      };
    }

    // تحقق من عدد المحاولات
    verification.attempts++;
    if (verification.attempts > 5) {
      this.verificationCodes.delete(verificationId);
      return {
        success: false,
        error: 'Too many verification attempts'
      };
    }

    // تحقق من الكود
    if (verification.code !== enteredCode) {
      return {
        success: false,
        error: 'Invalid verification code'
      };
    }

    // نجح التحقق - احذف الكود
    this.verificationCodes.delete(verificationId);
    
    console.log(`✅ Phone verification successful for ${verification.phoneNumber}`);
    
    return {
      success: true,
      messageId: verificationId
    };
  }

  /**
   * إنشاء كود التحقق (6 أرقام)
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * إنشاء معرف جلسة التحقق
   */
  private generateVerificationId(): string {
    return `twilio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * تنظيف الأكواد المنتهية الصلاحية كل 5 دقائق
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [id, verification] of this.verificationCodes.entries()) {
        if (verification.expiresAt < now) {
          this.verificationCodes.delete(id);
        }
      }
    }, 5 * 60 * 1000); // كل 5 دقائق
  }

  /**
   * إحصائيات الخدمة
   */
  getServiceStats(): any {
    return {
      isEnabled: this.isEnabled(),
      hasFromNumber: !!this.fromNumber,
      activeSessions: this.verificationCodes.size,
      provider: 'Twilio'
    };
  }

  /**
   * تنظيف جميع الجلسات (للاختبار)
   */
  clearAllSessions(): void {
    this.verificationCodes.clear();
    console.log('🧹 All Twilio verification sessions cleared');
  }
}

// إنشاء instance مشترك
export const twilioSMSService = new TwilioSMSService();