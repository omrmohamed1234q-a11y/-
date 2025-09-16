/**
 * Message Central SMS Service
 * بديل اقتصادي لـ Twilio مع دعم عالمي وأسعار منخفضة
 * التكلفة: $0.005 للرسالة مقابل $0.075 في Twilio
 */

import { z } from 'zod';

// Message Central configuration
const MESSAGE_CENTRAL_CONFIG = {
  BASE_URL: 'https://cpaas.messagecentral.com/verification/v3',
  customerId: process.env.MESSAGE_CENTRAL_CUSTOMER_ID,
  apiKey: process.env.MESSAGE_CENTRAL_API_KEY,
  senderId: process.env.MESSAGE_CENTRAL_SENDER_ID || 'VERIFY'
};

// Verification storage (in-memory for now)
const verificationStore = new Map<string, {
  code: string;
  phone: string;
  expiresAt: number;
  attempts: number;
}>();

interface MessageCentralResponse {
  responseCode: number;
  message: string;
  data?: {
    verificationId: string;
    to: string;
    status: string;
  };
}

export class MessageCentralSMSService {
  private validateConfig(): boolean {
    const { customerId, apiKey } = MESSAGE_CENTRAL_CONFIG;
    
    if (!customerId || !apiKey) {
      console.warn('⚠️ Message Central API credentials not configured');
      console.warn('Required: MESSAGE_CENTRAL_CUSTOMER_ID, MESSAGE_CENTRAL_API_KEY');
      return false;
    }
    
    return true;
  }

  /**
   * إرسال رمز التحقق عبر Message Central
   */
  async sendVerificationCode(phoneNumber: string): Promise<{
    success: boolean;
    verificationId?: string;
    error?: string;
  }> {
    try {
      if (!this.validateConfig()) {
        throw new Error('Message Central credentials not configured');
      }

      // تنظيف رقم الهاتف
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      
      // إنشاء رمز التحقق (6 أرقام)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationId = `mc_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      // حفظ رمز التحقق مع انتهاء صلاحية 10 دقائق
      verificationStore.set(verificationId, {
        code,
        phone: cleanPhone,
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
        attempts: 0
      });

      const requestBody = {
        customerId: MESSAGE_CENTRAL_CONFIG.customerId,
        senderId: MESSAGE_CENTRAL_CONFIG.senderId,
        type: 'SMS',
        to: cleanPhone,
        message: `رمز التحقق الخاص بك: ${code}\nصالح لمدة 10 دقائق - اطبعلي`,
        reference: verificationId
      };

      console.log(`📱 Message Central: Sending SMS to ${cleanPhone.replace(/\d(?=\d{4})/g, '*')}`);
      
      const response = await fetch(`${MESSAGE_CENTRAL_CONFIG.BASE_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MESSAGE_CENTRAL_CONFIG.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      const result: MessageCentralResponse = await response.json();
      
      if (response.ok && result.responseCode === 200) {
        console.log(`✅ Message Central SMS sent successfully: ${verificationId}`);
        return {
          success: true,
          verificationId
        };
      } else {
        throw new Error(result.message || 'Failed to send SMS via Message Central');
      }
      
    } catch (error: any) {
      console.error('❌ Message Central SMS failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * التحقق من رمز التحقق
   */
  async verifyCode(verificationId: string, code: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const verification = verificationStore.get(verificationId);
      
      if (!verification) {
        return {
          success: false,
          error: 'رمز التحقق غير صالح أو منتهي الصلاحية'
        };
      }

      // التحقق من انتهاء الصلاحية
      if (Date.now() > verification.expiresAt) {
        verificationStore.delete(verificationId);
        return {
          success: false,
          error: 'رمز التحقق منتهي الصلاحية'
        };
      }

      // التحقق من عدد المحاولات
      verification.attempts++;
      if (verification.attempts > 5) {
        verificationStore.delete(verificationId);
        return {
          success: false,
          error: 'تم تجاوز عدد المحاولات المسموح'
        };
      }

      // التحقق من الرمز
      if (verification.code === code) {
        verificationStore.delete(verificationId);
        console.log(`✅ Message Central verification successful for ${verification.phone.replace(/\d(?=\d{4})/g, '*')}`);
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'رمز التحقق غير صحيح'
        };
      }
      
    } catch (error: any) {
      console.error('❌ Message Central verification failed:', error.message);
      return {
        success: false,
        error: 'خطأ في التحقق من الرمز'
      };
    }
  }

  /**
   * تنظيف رموز التحقق المنتهية الصلاحية
   */
  cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [id, verification] of verificationStore.entries()) {
      if (now > verification.expiresAt) {
        verificationStore.delete(id);
      }
    }
  }
}

// إنشاء instance واحد
export const messageCentralService = new MessageCentralSMSService();

// تنظيف دوري للرموز المنتهية الصلاحية
setInterval(() => {
  messageCentralService.cleanupExpiredCodes();
}, 5 * 60 * 1000); // كل 5 دقائق
