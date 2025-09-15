import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  auth, 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  signInWithCredential,
  RecaptchaVerifier,
  signOut
} from '@/lib/firebase';

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
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resendCountRef = useRef(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Clear reCAPTCHA
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {
        // Already cleared or not rendered
      }
      recaptchaVerifierRef.current = null;
    }

    // Remove reCAPTCHA container
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.remove();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Clear errors
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Validate Egyptian phone number format
  const validateEgyptianPhone = useCallback((phoneNumber: string): boolean => {
    // Egyptian phone format: +201[0-2,5]xxxxxxxx (total 13 digits with +20)
    const egyptianPhoneRegex = /^(\+?20|0)?1[0-2,5]\d{8}$/;
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Check for 0020 prefix (handle international format)
    if (digits.startsWith('0020')) {
      return egyptianPhoneRegex.test(digits.slice(2)); // Remove 00, keep 20
    }
    
    return egyptianPhoneRegex.test(digits);
  }, []);

  // Format phone number for international format
  const formatPhoneNumber = useCallback((phoneNumber: string): string => {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Handle 0020 international prefix
    if (digits.startsWith('0020')) {
      return `+${digits.slice(2)}`; // Remove 00, keep 20
    }
    
    // If it starts with 0, replace with +20 (Egypt)
    if (digits.startsWith('0')) {
      return `+20${digits.slice(1)}`;
    }
    
    // If it starts with 20, add +
    if (digits.startsWith('20')) {
      return `+${digits}`;
    }
    
    // If it doesn't start with +, assume Egypt
    if (!phoneNumber.startsWith('+')) {
      return `+20${digits}`;
    }
    
    return phoneNumber;
  }, []);

  // Send SMS verification code
  const sendVerificationCode = useCallback(async (phoneNumber: string): Promise<PhoneVerificationResult> => {
    try {
      // Clear any existing interval first
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
      
      // Reuse or create reCAPTCHA verifier
      if (!recaptchaVerifierRef.current) {
        // Create a hidden div for reCAPTCHA if it doesn't exist
        let recaptchaContainer = document.getElementById('recaptcha-container');
        if (!recaptchaContainer) {
          recaptchaContainer = document.createElement('div');
          recaptchaContainer.id = 'recaptcha-container';
          recaptchaContainer.style.display = 'none';
          document.body.appendChild(recaptchaContainer);
        }

        try {
          // Create reCAPTCHA verifier (bypassed in development)
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            theme: 'light',
            'hl': 'ar', // Arabic language
            callback: () => {
              console.log('✅ reCAPTCHA verification completed');
            },
            'expired-callback': () => {
              console.log('⏰ reCAPTCHA expired - clearing verifier');
              if (recaptchaVerifierRef.current) {
                try {
                  recaptchaVerifierRef.current.clear();
                  recaptchaVerifierRef.current = null;
                } catch (e) {
                  // Already cleared
                }
              }
            }
          });

        } catch (error) {
          console.log('❌ reCAPTCHA setup error:', error);
          throw new Error('حدث خطأ في تهيئة نظام التحقق الأمني');
        }
      }

      // Send SMS
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      
      setState(prev => ({ 
        ...prev, 
        isSending: false,
        isLoading: false,
        verificationId: confirmationResult.verificationId,
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
        verificationId: confirmationResult.verificationId 
      };

    } catch (error: any) {
      let errorMessage = 'حدث خطأ في إرسال الكود';
      
      // Enhanced error handling
      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'تم إرسال كثير من الطلبات. حاول مرة أخرى لاحقاً';
          break;
        case 'auth/invalid-phone-number':
          errorMessage = 'رقم الهاتف غير صحيح';
          break;
        case 'auth/quota-exceeded':
          errorMessage = 'تم تجاوز الحد المسموح اليوم. حاول غداً';
          break;
        case 'auth/missing-recaptcha-token':
          errorMessage = 'حدث خطأ في التحقق الأمني. حاول مرة أخرى';
          break;
        case 'auth/invalid-app-credential':
          errorMessage = 'خطأ في إعدادات التطبيق. تواصل مع الدعم';
          break;
        case 'auth/captcha-check-failed':
          errorMessage = 'فشل التحقق الأمني. حاول مرة أخرى';
          break;
        default:
          errorMessage = 'حدث خطأ في إرسال الكود. تأكد من اتصال الإنترنت';
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

  // Verify SMS code
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

      // Create credential and sign in temporarily
      const credential = PhoneAuthProvider.credential(state.verificationId, code);
      const userCredential = await signInWithCredential(auth, credential);

      // Immediately sign out to avoid dual session with Supabase
      await signOut(auth);

      setState(prev => ({ 
        ...prev, 
        isVerifying: false,
        isLoading: false
      }));

      return { 
        success: true, 
        user: {
          phoneNumber: userCredential.user.phoneNumber,
          uid: userCredential.user.uid
        }
      };

    } catch (error: any) {
      let errorMessage = 'الكود غير صحيح';
      
      // Enhanced error handling for verification
      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage = 'الكود غير صحيح. تأكد من الأرقام';
          break;
        case 'auth/code-expired':
          errorMessage = 'انتهت صلاحية الكود. أطلب كود جديد';
          break;
        case 'auth/session-cookie-expired':
          errorMessage = 'انتهت جلسة التحقق. أطلب كود جديد';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى';
          break;
        default:
          errorMessage = 'حدث خطأ في التحقق. تأكد من الكود وحاول مرة أخرى';
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