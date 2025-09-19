/**
 * 🛡️ ERROR BOUNDARY PROTECTION SYSTEM 🛡️
 * 
 * نظام حماية من الأخطاء للسلة والطباعة
 * الغرض: منع تعطل التطبيق عند حدوث أخطاء في الأجزاء الحساسة
 * 
 * هذا المكون يلتف حول المكونات الحساسة ويوفر واجهة بديلة عند الأخطاء
 * 
 * تاريخ الإنشاء: 2025-01-19
 * 🛡️ END PROTECTION HEADER 🛡️
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  ShoppingCart, 
  Printer, 
  Home, 
  FileText,
  Bug
} from 'lucide-react';

// ===== أنواع البيانات =====

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  lastErrorTime: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  level?: 'critical' | 'important' | 'normal';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  enableReporting?: boolean;
  customActions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }>;
}

// ===== Error Boundary الرئيسي =====

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // تسجيل الخطأ مع التفاصيل
    this.logError(error, errorInfo);

    // استدعاء دالة الخطأ المخصصة
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      componentName: this.props.componentName || 'Unknown',
      level: this.props.level || 'normal',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      retryCount: this.state.retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('🚨 ERROR BOUNDARY CAUGHT ERROR:', errorReport);

    // إرسال التقرير للخادم (اختياري)
    if (this.props.enableReporting) {
      this.sendErrorReport(errorReport);
    }
  };

  private sendErrorReport = (errorReport: any) => {
    try {
      // يمكن إضافة إرسال للخادم هنا
      // fetch('/api/error-reports', { method: 'POST', body: JSON.stringify(errorReport) });
      console.log('🔍 Error report ready for transmission:', errorReport);
    } catch (err) {
      console.error('Failed to send error report:', err);
    }
  };

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    // إضافة تأخير بسيط قبل المحاولة مرة أخرى
    this.retryTimeout = setTimeout(() => {
      console.log(`🔄 Retrying component (attempt ${this.state.retryCount + 1})`);
    }, 500);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      lastErrorTime: 0
    });
  };

  private getErrorSeverityColor = () => {
    switch (this.props.level) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'important': return 'border-orange-500 bg-orange-50';
      default: return 'border-yellow-500 bg-yellow-50';
    }
  };

  private getErrorIcon = () => {
    const componentName = this.props.componentName?.toLowerCase() || '';
    
    if (componentName.includes('cart')) return ShoppingCart;
    if (componentName.includes('print')) return Printer;
    if (componentName.includes('file')) return FileText;
    
    return AlertTriangle;
  };

  render() {
    if (this.state.hasError) {
      // استخدام الـ fallback المخصص إذا كان متوفر
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // واجهة الخطأ الافتراضية
      const ErrorIcon = this.getErrorIcon();
      const enableRetry = this.props.enableRetry !== false;
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = enableRetry && this.state.retryCount < maxRetries;

      return (
        <Card className={`w-full max-w-2xl mx-auto my-4 ${this.getErrorSeverityColor()}`}>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100">
                <ErrorIcon className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">
                  عذراً، حدث خطأ غير متوقع
                </CardTitle>
                <Badge variant="outline" className="mt-2">
                  {this.props.componentName || 'مكون غير محدد'}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* معلومات الخطأ */}
            <Alert>
              <Bug className="h-4 w-4" />
              <AlertTitle>تفاصيل الخطأ</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{this.state.error?.name}</p>
                  <p className="mt-1">{this.state.error?.message}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    معرف الخطأ: {this.state.errorId}
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* إحصائيات المحاولات */}
            {this.state.retryCount > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  تم المحاولة {this.state.retryCount} من {maxRetries} مرات
                </p>
              </div>
            )}

            {/* أزرار التحكم */}
            <div className="flex flex-wrap gap-3 justify-center">
              {/* زر المحاولة مرة أخرى */}
              {canRetry && (
                <Button 
                  onClick={this.handleRetry}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-retry-error"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  محاولة مرة أخرى ({maxRetries - this.state.retryCount} محاولات متبقية)
                </Button>
              )}

              {/* زر إعادة التعيين */}
              <Button 
                variant="outline"
                onClick={this.handleReset}
                data-testid="button-reset-error"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة تعيين
              </Button>

              {/* زر العودة للرئيسية */}
              <Button 
                variant="ghost"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/';
                  }
                }}
                data-testid="button-home-error"
              >
                <Home className="w-4 h-4 mr-2" />
                العودة للرئيسية
              </Button>

              {/* أزرار مخصصة */}
              {this.props.customActions?.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  onClick={action.action}
                  data-testid={`button-custom-${index}`}
                >
                  {action.label}
                </Button>
              ))}
            </div>

            {/* معلومات تقنية للمطورين (في بيئة التطوير فقط) */}
            {import.meta.env.DEV && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  معلومات تقنية للمطورين
                </summary>
                <div className="mt-3 p-4 bg-gray-100 rounded-lg text-xs font-mono">
                  <div className="space-y-2">
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {this.state.error?.stack}
                      </pre>
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </div>
                  </div>
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// ===== مكونات Error Boundary متخصصة =====

/**
 * Error Boundary مخصص للسلة
 */
export const CartErrorBoundary = ({ children, ...props }: Omit<ErrorBoundaryProps, 'componentName'>) => (
  <ErrorBoundary
    componentName="Cart Component"
    level="critical"
    enableRetry={true}
    maxRetries={2}
    enableReporting={true}
    customActions={[
      {
        label: 'مسح السلة',
        action: () => {
          localStorage.removeItem('cart_state');
          localStorage.removeItem('cart_backup');
          localStorage.removeItem('cart_state_v2');
          localStorage.removeItem('cart_backup_v2');
          window.location.reload();
        },
        variant: 'destructive'
      },
      {
        label: 'الانتقال للطباعة',
        action: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/print';
          }
        },
        variant: 'outline'
      }
    ]}
    {...props}
  >
    {children}
  </ErrorBoundary>
);

/**
 * Error Boundary مخصص للطباعة
 */
export const PrintErrorBoundary = ({ children, ...props }: Omit<ErrorBoundaryProps, 'componentName'>) => (
  <ErrorBoundary
    componentName="Print Component"
    level="critical"
    enableRetry={true}
    maxRetries={3}
    enableReporting={true}
    customActions={[
      {
        label: 'مسح الملفات المرفوعة',
        action: () => {
          localStorage.removeItem('uploaded_files');
          localStorage.removeItem('print_settings');
          window.location.reload();
        },
        variant: 'destructive'
      },
      {
        label: 'جرب ملف آخر',
        action: () => window.location.reload(),
        variant: 'outline'
      }
    ]}
    {...props}
  >
    {children}
  </ErrorBoundary>
);

/**
 * Error Boundary مخصص للمدفوعات
 */
export const PaymentErrorBoundary = ({ children, ...props }: Omit<ErrorBoundaryProps, 'componentName'>) => (
  <ErrorBoundary
    componentName="Payment Component"
    level="critical"
    enableRetry={false} // عدم المحاولة مرة أخرى في المدفوعات
    enableReporting={true}
    customActions={[
      {
        label: 'العودة للسلة',
        action: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/cart';
          }
        },
        variant: 'default'
      },
      {
        label: 'تواصل مع الدعم',
        action: () => {
          if (typeof window !== 'undefined') {
            window.open('tel:+20123456789');
          }
        },
        variant: 'outline'
      }
    ]}
    {...props}
  >
    {children}
  </ErrorBoundary>
);

/**
 * Error Boundary عام للمكونات العادية
 */
export const GeneralErrorBoundary = ({ children, ...props }: Omit<ErrorBoundaryProps, 'componentName'>) => (
  <ErrorBoundary
    componentName="General Component"
    level="normal"
    enableRetry={true}
    maxRetries={1}
    enableReporting={false}
    {...props}
  >
    {children}
  </ErrorBoundary>
);

// ===== Hook للاستخدام مع الدوال =====

/**
 * Hook لتشغيل دالة بحماية من الأخطاء
 */
export const useSafeOperation = () => {
  const executeWithErrorHandling = async <T>(
    operation: () => Promise<T> | T,
    fallback?: T,
    onError?: (error: Error) => void
  ): Promise<T | undefined> => {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      console.error('🚨 Safe operation failed:', error);
      
      if (onError) {
        onError(error as Error);
      }
      
      return fallback;
    }
  };

  return { executeWithErrorHandling };
};

// ===== دوال مساعدة للأخطاء =====

/**
 * تسجيل خطأ يدوي للمراقبة
 */
export const reportError = (error: Error, context?: string) => {
  const errorReport = {
    timestamp: new Date().toISOString(),
    context: context || 'Manual Report',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  console.error('🔍 MANUAL ERROR REPORT:', errorReport);
  
  // يمكن إضافة إرسال للخادم هنا
};

/**
 * فحص صحة مكون React
 */
export const validateComponent = (component: any): boolean => {
  try {
    return (
      component &&
      (typeof component === 'function' || typeof component === 'object') &&
      component.$$typeof !== undefined
    );
  } catch {
    return false;
  }
};