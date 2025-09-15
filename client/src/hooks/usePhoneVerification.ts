import { useState, useCallback, useRef, useEffect } from 'react';

interface PhoneVerificationState {
  isLoading: boolean;
  isSending: boolean;
  isVerifying: boolean;
  error: string | null;
  verificationId: string | null;
  phoneNumber: string | null;
  countdown: number;
  canResend: boolean;
}

interface PhoneVerificationResult {
  success: boolean;
  error?: string;
  verificationId?: string;
  user?: any;
}

export const usePhoneVerification = () => {
  const [state, setState] = useState<PhoneVerificationState>({
    isLoading: false,
    isSending: false,
    isVerifying: false,
    error: null,
    verificationId: null,
    phoneNumber: null,
    countdown: 0,
    canResend: true
  });

  // Refs for lifecycle management
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resendCountRef = useRef(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Egyptian phone number validation
  const validateEgyptianPhone = useCallback((phone: string): boolean => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check Egyptian phone patterns
    // Mobile: 01X XXXX XXXX (11 digits starting with 01)
    // With country code: +20 1X XXXX XXXX
    
    if (cleanPhone.length === 11 && cleanPhone.startsWith('01')) {
      // Egyptian mobile: 01X (X can be 0,1,2,5)
      const secondDigit = cleanPhone[2];
      return ['0', '1', '2', '5'].includes(secondDigit);
    }
    
    if (cleanPhone.length === 12 && cleanPhone.startsWith('201')) {
      // With +20 prefix: 201X XXXX XXXX (E.164 format is 12 digits)
      const thirdDigit = cleanPhone[3];
      return ['0', '1', '2', '5'].includes(thirdDigit);
    }
    
    return false;
  }, []);

  // Format phone number to international format
  const formatPhoneNumber = useCallback((phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 11 && cleanPhone.startsWith('01')) {
      // Convert Egyptian mobile to international format
      return '+20' + cleanPhone;
    }
    
    if (cleanPhone.length === 12 && cleanPhone.startsWith('201')) {
      // Already in international format
      return '+' + cleanPhone;
    }
    
    return phone; // Return as-is if format is unclear
  }, []);

  // Clear error message
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Send verification code via Vonage API
  const sendVerificationCode = useCallback(async (phoneNumber: string): Promise<PhoneVerificationResult> => {
    try {
      // Clear any existing countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      // Validate phone number first
      if (!validateEgyptianPhone(phoneNumber)) {
        const error = 'رقم الهاتف غير صحيح. يجب أن يكون رقم مصري صحيح';
        setState(prev => ({ ...prev, error }));
        return { success: false, error };
      }

      // Check resend limit
      if (resendCountRef.current >= 3) {
        const error = 'تم تجاوز حد إعادة الإرسال. حاول مرة أخرى بعد 10 دقائق';
        setState(prev => ({ ...prev, error }));
        return { success: false, error };
      }

      setState(prev => ({ 
        ...prev, 
        isSending: true, 
        isLoading: true, 
        error: null 
      }));

      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Call Vonage SMS API via backend
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'فشل في إرسال الكود');
      }
      
      setState(prev => ({ 
        ...prev, 
        isSending: false,
        isLoading: false,
        verificationId: result.verificationId,
        phoneNumber: formattedPhone,
        countdown: 60,
        canResend: false
      }));

      // Start countdown with proper cleanup
      countdownIntervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.countdown <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return { ...prev, countdown: 0, canResend: true };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);

      // Increment resend count
      resendCountRef.current += 1;

      return { 
        success: true, 
        verificationId: result.verificationId 
      };

    } catch (error: any) {
      let errorMessage = 'حدث خطأ في إرسال الكود';
      
      // Enhanced error handling for common scenarios
      if (error.message.includes('HTTP 429')) {
        errorMessage = 'تم إرسال كثير من الطلبات. حاول مرة أخرى لاحقاً';
      } else if (error.message.includes('HTTP 400')) {
        errorMessage = 'رقم الهاتف غير صحيح';
      } else if (error.message.includes('HTTP 401')) {
        errorMessage = 'خطأ في إعدادات التطبيق. تواصل مع الدعم';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'تأكد من اتصال الإنترنت وحاول مرة أخرى';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({ 
        ...prev, 
        isSending: false,
        isLoading: false,
        error: errorMessage 
      }));

      return { success: false, error: errorMessage };
    }
  }, [formatPhoneNumber, validateEgyptianPhone]);

  // Verify SMS code via Vonage API
  const verifyCode = useCallback(async (code: string): Promise<PhoneVerificationResult> => {
    if (!state.verificationId) {
      const error = 'لا يوجد كود تحقق للتأكيد';
      setState(prev => ({ ...prev, error }));
      return { success: false, error };
    }

    try {
      setState(prev => ({ 
        ...prev, 
        isVerifying: true, 
        isLoading: true, 
        error: null 
      }));

      // Call Vonage verification API via backend
      const response = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationId: state.verificationId,
          code: code
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'الكود غير صحيح');
      }

      setState(prev => ({ 
        ...prev, 
        isVerifying: false,
        isLoading: false
      }));

      return { 
        success: true, 
        user: {
          phoneNumber: state.phoneNumber,
          verified: true,
          verificationId: state.verificationId
        }
      };

    } catch (error: any) {
      let errorMessage = 'الكود غير صحيح';
      
      // Enhanced error handling for verification
      if (error.message.includes('HTTP 400')) {
        errorMessage = 'الكود غير صحيح. تأكد من الأرقام';
      } else if (error.message.includes('HTTP 410')) {
        errorMessage = 'انتهت صلاحية الكود. أطلب كود جديد';
      } else if (error.message.includes('HTTP 429')) {
        errorMessage = 'محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'تأكد من اتصال الإنترنت وحاول مرة أخرى';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({ 
        ...prev, 
        isVerifying: false,
        isLoading: false,
        error: errorMessage 
      }));

      return { success: false, error: errorMessage };
    }
  }, [state.verificationId]);

  // Resend code
  const resendCode = useCallback(async (): Promise<PhoneVerificationResult> => {
    if (!state.phoneNumber || !state.canResend) {
      return { success: false, error: 'لا يمكن إعادة الإرسال الآن' };
    }

    return await sendVerificationCode(state.phoneNumber);
  }, [state.phoneNumber, state.canResend, sendVerificationCode]);

  // Reset verification state
  const resetVerification = useCallback(() => {
    // Clean up resources first
    cleanup();
    
    // Reset resend count
    resendCountRef.current = 0;
    
    // Reset state
    setState({
      isLoading: false,
      isSending: false,
      isVerifying: false,
      error: null,
      verificationId: null,
      phoneNumber: null,
      countdown: 0,
      canResend: true
    });
  }, [cleanup]);

  return {
    // State
    isLoading: state.isLoading,
    isSending: state.isSending,
    isVerifying: state.isVerifying,
    error: state.error,
    verificationId: state.verificationId,
    phoneNumber: state.phoneNumber,
    countdown: state.countdown,
    canResend: state.canResend,
    
    // Actions
    sendVerificationCode,
    verifyCode,
    resendCode,
    resetVerification,
    clearError,
    formatPhoneNumber
  };
};

export default usePhoneVerification;