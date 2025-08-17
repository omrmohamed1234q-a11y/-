import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Printer, Truck, CheckCircle, 
  Clock, MapPin, User, Phone
} from 'lucide-react';

interface OrderFlowProps {
  orderId: string;
  currentStatus: 'processing' | 'printing' | 'shipped' | 'delivered';
  estimatedDelivery?: string;
  customerInfo?: {
    name: string;
    phone: string;
    address: string;
  };
}

export function OrderFlowAnimation({ 
  orderId, 
  currentStatus, 
  estimatedDelivery,
  customerInfo 
}: OrderFlowProps) {
  const [animationStage, setAnimationStage] = useState(0);

  const steps = [
    {
      id: 'processing',
      title: 'معالجة الطلب',
      description: 'تحضير الملفات والتأكد من الجودة',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      id: 'printing',
      title: 'جاري الطباعة',
      description: 'طباعة عالية الجودة قيد التنفيذ',
      icon: Printer,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      id: 'shipped',
      title: 'في الطريق',
      description: 'تم الشحن وجاري التوصيل',
      icon: Truck,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      id: 'delivered',
      title: 'تم التسليم',
      description: 'وصل الطلب بنجاح',
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStatus);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStage(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentStepIndex = getCurrentStepIndex();

  return (
    <Card className="w-full max-w-4xl mx-auto border-0 shadow-xl overflow-hidden" dir="rtl">
      <CardContent className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            تتبع الطلب #{orderId}
          </h2>
          {estimatedDelivery && (
            <div className="flex items-center justify-center space-x-2 space-x-reverse text-gray-600">
              <Clock className="w-4 h-4" />
              <span>التسليم المتوقع: {estimatedDelivery}</span>
            </div>
          )}
        </div>

        {/* Customer Info */}
        {customerInfo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">معلومات العميل</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2 space-x-reverse">
                <User className="w-4 h-4 text-gray-500" />
                <span>{customerInfo.name}</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{customerInfo.phone}</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{customerInfo.address}</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 right-6 left-6 h-1 bg-gray-200 rounded-full">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ 
                width: `${((currentStepIndex + 1) / steps.length) * 100}%` 
              }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const StepIcon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="text-center">
                    {/* Icon Container */}
                    <motion.div
                      className={`
                        relative w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center
                        ${isCompleted ? step.bgColor : 'bg-gray-100'}
                        ${isCurrent ? 'ring-4 ring-offset-2 ring-blue-200' : ''}
                      `}
                      animate={isCurrent ? {
                        scale: [1, 1.1, 1],
                        rotate: step.id === 'printing' ? [0, 5, -5, 0] : 0
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: isCurrent ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    >
                      <StepIcon 
                        className={`
                          w-6 h-6 
                          ${isCompleted ? step.textColor : 'text-gray-400'}
                        `} 
                      />
                      
                      {/* Animated elements for current step */}
                      <AnimatePresence>
                        {isCurrent && (
                          <>
                            {step.id === 'printing' && (
                              <motion.div
                                className="absolute -top-2 -right-2 w-3 h-3 bg-orange-400 rounded-full"
                                animate={{ 
                                  scale: [0, 1, 0],
                                  opacity: [0, 1, 0] 
                                }}
                                transition={{ 
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                            )}
                            
                            {step.id === 'shipped' && (
                              <>
                                <motion.div
                                  className="absolute -top-1 right-8 text-xs"
                                  animate={{ x: [0, 10, 0] }}
                                  transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                >
                                  💨
                                </motion.div>
                              </>
                            )}
                            
                            {step.id === 'delivered' && (
                              <motion.div
                                className="absolute -top-2 -right-2 text-lg"
                                animate={{ 
                                  rotate: [0, 360],
                                  scale: [1, 1.2, 1]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                ✨
                              </motion.div>
                            )}
                          </>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Status Badge */}
                    {isCurrent && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-2"
                      >
                        <Badge 
                          variant="secondary" 
                          className={`${step.bgColor} ${step.textColor} border-none`}
                        >
                          جاري التنفيذ
                        </Badge>
                      </motion.div>
                    )}
                    
                    {isCompleted && !isCurrent && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-2"
                      >
                        <Badge 
                          variant="secondary" 
                          className="bg-green-50 text-green-600 border-none"
                        >
                          مكتمل
                        </Badge>
                      </motion.div>
                    )}

                    {/* Step Title & Description */}
                    <h3 className={`
                      font-semibold mb-1
                      ${isCompleted ? 'text-gray-900' : 'text-gray-400'}
                    `}>
                      {step.title}
                    </h3>
                    <p className={`
                      text-sm
                      ${isCompleted ? 'text-gray-600' : 'text-gray-400'}
                    `}>
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          {currentStatus === 'delivered' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-lg font-semibold text-green-600">
                🎉 تم تسليم طلبك بنجاح!
              </div>
              <div className="text-gray-600">
                نشكرك لاستخدام خدمة اطبعلي
              </div>
            </motion.div>
          ) : (
            <div className="text-gray-600">
              سيتم إشعارك عند انتقال الطلب للمرحلة التالية
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderFlowAnimation;