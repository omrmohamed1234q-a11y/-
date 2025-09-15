import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { Loader2, Phone, Shield, RotateCcw, X } from 'lucide-react';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationSuccess: (phoneNumber: string, user: any) => void;
  phoneNumber: string;
  title?: string;
  description?: string;
}

const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerificationSuccess,
  phoneNumber,
  title = "تأكيد رقم الهاتف",
  description = "أدخل الكود المرسل على رقمك"
}) => {
  const [step, setStep] = useState<'sending' | 'verify'>('sending');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  const {
    isLoading,
    isSending,
    isVerifying,
    error,
    countdown,
    canResend,
    sendVerificationCode,
    verifyCode,
    resendCode,
    resetVerification,
    clearError,
    formatPhoneNumber
  } = usePhoneVerification();

  // Auto-send SMS when modal opens
  useEffect(() => {
    if (isOpen && phoneNumber && !isAutoSending) {
      setIsAutoSending(true);
      handleSendCode();
    }
  }, [isOpen, phoneNumber]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('sending');
      setCode(['', '', '', '', '', '']);
      setIsAutoSending(false);
      resetVerification();
    }
  }, [isOpen, resetVerification]);

  // Focus on first input when switching to verify step
  useEffect(() => {
    if (step === 'verify' && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle code input change
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last digit
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      handleVerifyCode(pastedData);
    }
  };

  // Send verification code
  const handleSendCode = async () => {
    clearError();
    
    const result = await sendVerificationCode(phoneNumber);
    
    if (result.success) {
      setStep('verify');
      toast({
        title: "تم إرسال الكود",
        description: `تم إرسال كود التحقق على ${formatPhoneNumber(phoneNumber)}`,
      });
    } else {
      toast({
        title: "خطأ في الإرسال",
        description: result.error || "حدث خطأ في إرسال الكود",
        variant: "destructive"
      });
    }
  };

  // Verify code
  const handleVerifyCode = async (codeToVerify?: string) => {
    const verificationCode = codeToVerify || code.join('');
    
    if (verificationCode.length !== 6) {
      toast({
        title: "كود غير مكتمل",
        description: "يرجى إدخال الكود كاملاً (6 أرقام)",
        variant: "destructive"
      });
      return;
    }

    clearError();
    
    const result = await verifyCode(verificationCode);
    
    if (result.success) {
      toast({
        title: "تم تأكيد الرقم",
        description: "تم تأكيد رقم هاتفك بنجاح",
      });
      onVerificationSuccess(formatPhoneNumber(phoneNumber), result.user);
      onClose();
    } else {
      toast({
        title: "كود خاطئ",
        description: result.error || "الكود المدخل غير صحيح",
        variant: "destructive"
      });
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  // Resend code
  const handleResendCode = async () => {
    clearError();
    setCode(['', '', '', '', '', '']);
    
    const result = await resendCode();
    
    if (result.success) {
      toast({
        title: "تم إعادة الإرسال",
        description: "تم إرسال كود جديد على رقمك",
      });
    } else {
      toast({
        title: "خطأ في إعادة الإرسال",
        description: result.error || "حدث خطأ في إعادة إرسال الكود",
        variant: "destructive"
      });
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <Shield className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Phone number display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
              <Phone className="h-4 w-4" />
              <span className="text-sm">سيتم الإرسال على</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatPhoneNumber(phoneNumber)}
            </div>
          </div>

          {step === 'sending' ? (
            /* Sending step */
            <div className="text-center space-y-4">
              {error ? (
                /* Error state with skip option */
                <div className="space-y-4">
                  <div className="text-red-600 text-sm mb-4">
                    {error}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSendCode}
                      disabled={isSending}
                      className="w-full"
                      data-testid="button-retry-sending"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري المحاولة...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4 ml-2" />
                          المحاولة مرة أخرى
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        onVerificationSuccess(phoneNumber, { phoneVerified: false, skipVerification: true });
                      }}
                      className="w-full text-orange-600 hover:text-orange-700"
                      data-testid="button-skip-verification-sending"
                    >
                      تخطي التحقق والمتابعة
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    يمكنك المتابعة بدون تحقق وتفعيله لاحقاً
                  </p>
                </div>
              ) : (
                /* Loading state */
                <div>
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">جاري إرسال كود التحقق...</p>
                    <p className="text-sm text-gray-500 mt-1">
                      قد يستغرق هذا بضع ثوانٍ
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Verification step */
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-4">{description}</p>
                
                {/* Code input boxes */}
                <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <Input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(index, e.target.value)}
                      onKeyDown={e => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-semibold border-2 focus:border-blue-600"
                      disabled={isVerifying}
                      data-testid={`input-code-${index}`}
                    />
                  ))}
                </div>

                {/* Error message */}
                {error && (
                  <div className="text-red-600 text-sm mb-4">
                    {error}
                  </div>
                )}

                {/* Countdown and resend */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-gray-500 text-sm">
                      إعادة الإرسال خلال {formatCountdown(countdown)}
                    </p>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResendCode}
                      disabled={!canResend || isSending}
                      className="text-blue-600 hover:text-blue-700"
                      data-testid="button-resend"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4 ml-2" />
                          إعادة إرسال الكود
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Manual verify button */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleVerifyCode()}
                  disabled={isVerifying || code.some(digit => !digit)}
                  className="flex-1"
                  data-testid="button-verify"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري التحقق...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 ml-2" />
                      تأكيد الكود
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  data-testid="button-cancel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Skip verification option */}
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Skip verification and continue with the phone number
                    onVerificationSuccess(phoneNumber, { phoneVerified: false, skipVerification: true });
                  }}
                  className="text-orange-600 hover:text-orange-700 text-xs"
                  data-testid="button-skip-verification"
                >
                  تخطي التحقق والمتابعة
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  (يمكن تفعيل التحقق لاحقاً)
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-center text-gray-500 bg-gray-50 p-3 rounded-lg">
            💡 إذا لم يصل الكود، تأكد من أن رقم الهاتف صحيح وأن لديك إشارة جيدة
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneVerificationModal;