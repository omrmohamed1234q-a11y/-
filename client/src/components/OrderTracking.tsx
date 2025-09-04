import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Printer, Truck, CheckCircle2, Clock, ArrowRight, MapPin, Phone, Star, MessageCircle
} from 'lucide-react';

interface OrderTrackingProps {
  orderId: string;
}

interface TrackingStep {
  id: string;
  status: string;
  message: string;
  messageEn: string;
  estimatedTime?: string;
  actualTime?: string;
  completed: boolean;
}

interface TrackingData {
  steps?: TrackingStep[];
  estimatedDelivery?: string;
}

const trackingSteps = [
  {
    key: 'processing',
    title: 'معالجة الطلب',
    titleEn: 'Processing Order',
    icon: Clock,
    color: 'blue'
  },
  {
    key: 'printing',
    title: 'قيد الطباعة',
    titleEn: 'Printing',
    icon: Printer,
    color: 'purple'
  },
  {
    key: 'shipped',
    title: 'في الطريق',
    titleEn: 'On the Way',
    icon: Truck,
    color: 'orange'
  },
  {
    key: 'delivered',
    title: 'تم التسليم',
    titleEn: 'Delivered',
    icon: CheckCircle,
    color: 'green'
  }
];

export function OrderTracking({ orderId }: OrderTrackingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [animatedStep, setAnimatedStep] = useState(0);

  const { data: tracking, isLoading } = useQuery<TrackingData>({
    queryKey: ['/api/orders', orderId, 'tracking'],
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  useEffect(() => {
    if (tracking?.steps) {
      const completedSteps = tracking.steps.filter((step: TrackingStep) => step.completed);
      const newCurrentStep = completedSteps.length - 1;
      
      if (newCurrentStep !== currentStep) {
        setCurrentStep(newCurrentStep);
        
        // Animate step progression
        const timer = setTimeout(() => {
          setAnimatedStep(newCurrentStep);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [tracking, currentStep]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardTitle className="flex items-center space-x-2 space-x-reverse">
          <Package className="w-5 h-5 text-green-600" />
          <span>تتبع الطلب #{orderId}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          {trackingSteps.map((step, index) => {
            const isCompleted = index <= currentStep;
            const isActive = index === currentStep;
            const IconComponent = step.icon;
            
            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className={`flex items-center space-x-4 space-x-reverse ${
                  isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {/* Icon */}
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      backgroundColor: isCompleted 
                        ? step.color === 'green' ? '#10b981' 
                        : step.color === 'blue' ? '#3b82f6'
                        : step.color === 'purple' ? '#8b5cf6'
                        : '#f59e0b'
                        : '#e5e7eb'
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${
                        isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </h3>
                      
                      {isCompleted && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          مكتمل
                        </Badge>
                      )}
                      
                      {isActive && !isCompleted && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          قيد التنفيذ
                        </Badge>
                      )}
                    </div>
                    
                    {tracking?.steps?.find((s: TrackingStep) => s.status === step.key) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {tracking.steps.find((s: TrackingStep) => s.status === step.key)?.message}
                      </p>
                    )}
                    
                    {tracking?.steps?.find((s: TrackingStep) => s.status === step.key)?.estimatedTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        الوقت المتوقع: {new Date(tracking.steps.find((s: TrackingStep) => s.status === step.key)?.estimatedTime).toLocaleString('ar-SA')}
                      </p>
                    )}
                  </div>

                  {/* Active Animation */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute left-0 top-0 w-full h-full bg-blue-100 rounded-lg -z-10"
                    />
                  )}
                </div>

                {/* Progress Line */}
                {index < trackingSteps.length - 1 && (
                  <div className="absolute right-5 top-12 w-0.5 h-8 bg-gray-200">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ 
                        height: isCompleted ? '100%' : '0%'
                      }}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                      className="bg-green-500 w-full"
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Estimated Delivery */}
        {tracking?.estimatedDelivery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200"
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">الوقت المتوقع للتسليم</p>
                <p className="text-sm text-green-700">
                  {new Date(tracking.estimatedDelivery).toLocaleString('ar-SA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress Animation */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ 
            width: `${((currentStep + 1) / trackingSteps.length) * 100}%` 
          }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="mt-6 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
        />
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>0%</span>
          <span>{Math.round(((currentStep + 1) / trackingSteps.length) * 100)}%</span>
          <span>100%</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderTracking;