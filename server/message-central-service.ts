// Use native fetch if available (Node 18+), fallback to node-fetch
const nodeFetch = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

export interface MessageCentralConfig {
  apiKey: string;
  customerId: string;
}

export interface MessageCentralResponse {
  success: boolean;
  verificationId?: string;
  error?: string;
  responseId?: string;
  message?: string;
}

export class MessageCentralSMSService {
  private config: MessageCentralConfig;
  private baseUrl = 'https://cpaas.messagecentral.com/verification/v3';
  private verificationIdMap = new Map<string, {
    realId: string;
    expiresAt: number;
    phoneNumber: string;
  }>();

  /**
   * Helper to mask phone numbers for secure logging
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return 'N/A';
    const clean = phoneNumber.replace(/[^0-9]/g, '');
    if (clean.length <= 4) return '***';
    return `${clean.substring(0, 2)}***${clean.substring(clean.length - 2)}`;
  }

  /**
   * Helper for secure debug logging (only in development)
   */
  private debugLog(message: string, data?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }

  /**
   * Enhanced phone number normalization with broader country support
   */
  private normalizePhoneNumber(phoneNumber: string): { countryCode: string; mobileNumber: string } {
    // Remove all non-numeric characters
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    
    // Country code mappings with their expected lengths
    const countryMappings = [
      { code: '20', length: 11, name: 'Egypt' },
      { code: '966', length: 12, name: 'Saudi Arabia' },
      { code: '971', length: 12, name: 'UAE' },
      { code: '965', length: 11, name: 'Kuwait' },
      { code: '973', length: 11, name: 'Bahrain' },
      { code: '974', length: 11, name: 'Qatar' },
      { code: '968', length: 11, name: 'Oman' },
      { code: '962', length: 12, name: 'Jordan' },
      { code: '961', length: 11, name: 'Lebanon' },
      { code: '963', length: 12, name: 'Syria' },
      { code: '964', length: 12, name: 'Iraq' },
      { code: '212', length: 12, name: 'Morocco' },
      { code: '213', length: 12, name: 'Algeria' },
      { code: '216', length: 11, name: 'Tunisia' },
      { code: '218', length: 12, name: 'Libya' },
      { code: '249', length: 12, name: 'Sudan' }
    ];
    
    // Try to match against known country codes
    for (const country of countryMappings) {
      if (cleanPhone.startsWith(country.code) && cleanPhone.length >= country.length - 1 && cleanPhone.length <= country.length + 1) {
        const mobileNumber = cleanPhone.substring(country.code.length);
        this.debugLog(`📞 Normalized ${country.name} number: ${this.maskPhoneNumber(phoneNumber)}`);
        return { countryCode: country.code, mobileNumber };
      }
    }
    
    // Fallback logic for unknown patterns
    if (cleanPhone.length >= 10) {
      // Try 2-digit country code first
      if (cleanPhone.length <= 12) {
        return { countryCode: cleanPhone.substring(0, 2), mobileNumber: cleanPhone.substring(2) };
      }
      // Try 3-digit country code for longer numbers
      if (cleanPhone.length >= 11) {
        return { countryCode: cleanPhone.substring(0, 3), mobileNumber: cleanPhone.substring(3) };
      }
    }
    
    throw new Error(`Invalid phone number format: ${this.maskPhoneNumber(phoneNumber)}`);
  }

  constructor(config: MessageCentralConfig) {
    this.config = config;
    console.log('✅ Message Central SMS service initialized successfully');
    
    // Clean up expired verification IDs every 5 minutes
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      for (const [syntheticId, mapping] of this.verificationIdMap.entries()) {
        if (mapping.expiresAt < now) {
          this.verificationIdMap.delete(syntheticId);
          cleanedCount++;
        }
      }
      if (cleanedCount > 0) {
        this.debugLog(`🧹 Cleaned up ${cleanedCount} expired verification IDs`);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Send SMS verification code using Message Central API
   */
  async sendVerificationCode(phoneNumber: string): Promise<MessageCentralResponse> {
    try {
      console.log(`📱 Message Central: Sending SMS to ${this.maskPhoneNumber(phoneNumber)}`);
      
      // Use enhanced phone number normalization
      const { countryCode, mobileNumber } = this.normalizePhoneNumber(phoneNumber);
      
      this.debugLog(`🔢 Message Central: Country=${countryCode}, Mobile=${this.maskPhoneNumber(mobileNumber)}`);

      // Prepare API request
      const url = `${this.baseUrl}/send?countryCode=${countryCode}&customerId=${this.config.customerId}&flowType=SMS&mobileNumber=${mobileNumber}`;
      
      const response = await nodeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authToken': this.config.apiKey,
        },
      });

      const responseData = await response.json() as any;
      
      this.debugLog(`📊 Message Central Response:`, {
        status: response.status,
        success: response.ok,
        responseCode: responseData?.responseCode,
        hasVerificationId: !!(responseData?.data?.verificationId)
      });

      if (response.ok && responseData.responseCode === '200') {
        const realVerificationId = responseData.data?.verificationId;
        
        if (!realVerificationId) {
          this.debugLog(`❌ Message Central: No verification ID returned from API`);
          return {
            success: false,
            error: 'لم يتم إرجاع معرف التحقق من الخدمة'
          };
        }
        
        // Create synthetic ID for our system
        const syntheticId = `msgcenter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store mapping with 15 minute expiry (same as verification code expiry)
        const expiresAt = Date.now() + (15 * 60 * 1000);
        this.verificationIdMap.set(syntheticId, {
          realId: realVerificationId,
          expiresAt,
          phoneNumber
        });
        
        console.log(`✅ Message Central SMS sent successfully to ${this.maskPhoneNumber(phoneNumber)}`);
        this.debugLog(`🔑 Synthetic ID: ${syntheticId}`);
        this.debugLog(`⏰ Expires at: ${new Date(expiresAt).toISOString()}`);
        
        return {
          success: true,
          verificationId: syntheticId,
          responseId: realVerificationId,
          message: 'تم إرسال كود التحقق بنجاح'
        };
      } else {
        const errorMsg = responseData.message || responseData.error || 'فشل في إرسال الرسالة';
        this.debugLog(`❌ Message Central failed: ${errorMsg}`);
        
        return {
          success: false,
          error: errorMsg
        };
      }

    } catch (error: any) {
      console.error('❌ Message Central SMS error:', error);
      return {
        success: false,
        error: error.message || 'خطأ في الاتصال بخدمة Message Central'
      };
    }
  }

  /**
   * Verify SMS code using Message Central API
   */
  async verifyCode(verificationId: string, code: string): Promise<MessageCentralResponse> {
    try {
      this.debugLog(`🔍 Message Central: Verifying code for verification ID`);
      
      // Look up the real Message Central verification ID
      const mapping = this.verificationIdMap.get(verificationId);
      
      if (!mapping) {
        this.debugLog(`❌ Message Central: No mapping found for verification ID`);
        return {
          success: false,
          error: 'معرف التحقق غير صحيح أو منتهي الصلاحية'
        };
      }
      
      // Check if mapping has expired
      if (Date.now() > mapping.expiresAt) {
        this.debugLog(`❌ Message Central: Verification ID expired`);
        this.verificationIdMap.delete(verificationId);
        return {
          success: false,
          error: 'انتهت صلاحية كود التحقق. يرجى طلب كود جديد'
        };
      }
      
      const realVerificationId = mapping.realId;
      this.debugLog(`🔄 Message Central: Processing verification request`);
      
      const url = `${this.baseUrl}/verify`;
      
      const response = await nodeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authToken': this.config.apiKey,
        },
        body: JSON.stringify({
          customerId: this.config.customerId,
          verificationId: realVerificationId,
          code: code
        })
      });

      const responseData = await response.json() as any;
      
      this.debugLog(`📊 Message Central Verify Response:`, {
        status: response.status,
        success: response.ok,
        responseCode: responseData?.responseCode
      });

      if (response.ok && responseData.responseCode === '200') {
        console.log(`✅ Message Central verification successful`);
        
        // Clean up the successful verification ID
        this.verificationIdMap.delete(verificationId);
        this.debugLog(`🧹 Cleaned up verification ID after successful verification`);
        
        return {
          success: true,
          message: 'تم التحقق من الكود بنجاح'
        };
      } else {
        const errorMsg = responseData.message || responseData.error || 'كود التحقق غير صحيح';
        this.debugLog(`❌ Message Central verification failed: ${errorMsg}`);
        
        return {
          success: false,
          error: errorMsg
        };
      }

    } catch (error: any) {
      console.error('❌ Message Central verification error:', error);
      return {
        success: false,
        error: error.message || 'خطأ في التحقق من الكود'
      };
    }
  }

  /**
   * Check if Message Central service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.customerId);
  }

  /**
   * Get service diagnostics for debugging
   */
  getDiagnostics(): any {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      configured: this.isConfigured(),
      apiKey: this.config.apiKey ? `${this.config.apiKey.substring(0, 8)}...` : 'Not configured',
      customerId: this.config.customerId || 'Not configured',
      baseUrl: this.baseUrl,
      activeVerificationIds: this.verificationIdMap.size,
      verificationMappings: Array.from(this.verificationIdMap.entries()).map(([syntheticId, mapping]) => ({
        syntheticId: isProduction ? `${syntheticId.substring(0, 15)}...` : syntheticId,
        phoneNumber: this.maskPhoneNumber(mapping.phoneNumber),
        hasRealId: !!mapping.realId,
        expiresAt: new Date(mapping.expiresAt).toISOString(),
        isExpired: Date.now() > mapping.expiresAt
      }))
    };
  }
}

// Export singleton instance
let messageCentralSMSService: MessageCentralSMSService | null = null;

export function initializeMessageCentralSMS(): MessageCentralSMSService | null {
  try {
    const apiKey = process.env.MESSAGE_CENTRAL_API_KEY;
    const customerId = process.env.MESSAGE_CENTRAL_CUSTOMER_ID;

    if (!apiKey || !customerId) {
      console.log('⚠️ Message Central credentials not configured');
      return null;
    }

    messageCentralSMSService = new MessageCentralSMSService({
      apiKey,
      customerId
    });

    return messageCentralSMSService;
  } catch (error) {
    console.error('❌ Failed to initialize Message Central SMS:', error);
    return null;
  }
}

export { messageCentralSMSService };