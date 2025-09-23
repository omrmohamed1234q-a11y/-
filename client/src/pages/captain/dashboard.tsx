/*
  🔒 PROTECTED CAPTAIN DASHBOARD - DO NOT MODIFY 🔒
  ===============================================
  
  ⚠️ CRITICAL SYSTEM WARNING ⚠️
  This file contains the captain order management system which is 100% functional.
  
  🚨 DO NOT EDIT WITHOUT EXPLICIT APPROVAL 🚨
  - Two-phase order acceptance system working perfectly
  - 3-order limit per captain implemented and tested
  - Cache invalidation working properly
  - GPS/mapping integration preserved
  
  Contact system admin before making ANY changes to this file.
  Last protected: September 21, 2025
*/

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useWebSocket, useWebSocketEvent } from '@/hooks/use-websocket';
import { useGPS } from '@/hooks/use-gps';
import GoogleMap from '@/components/GoogleMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Truck,
  MapPin,
  Navigation,
  Phone,
  Clock,
  Package,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  FileText,
  Route,
  User,
  LogOut,
  RefreshCw,
  Play,
  Pause,
  Timer,
  Calendar,
  Receipt,
  Map as MapIcon,
  Zap,
  Activity,
  TrendingUp,
  BarChart3,
  Target,
  Clock8,
  Coins,
  Navigation2,
  Gauge
} from 'lucide-react';

interface CaptainOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCoordinates?: {
    lat: number;
    lng: number;
  };
  totalAmount: number;
  paymentMethod: string;
  items: OrderItem[];
  timeline: OrderTimelineEvent[];
  estimatedDelivery: string;
  specialInstructions?: string;
  priority: 'normal' | 'urgent' | 'express';
  // نظام إدارة التضارب الجديد
  lockInfo?: {
    isLocked: boolean;
    lockedBy?: string;
    lockedUntil?: number;
    remainingTime?: number;
  };
  conflictInfo?: {
    attemptsCount: number;
    competingCaptains: string[];
    lastAttemptAt?: number;
  };
  invoice?: {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
  };
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderTimelineEvent {
  timestamp: string;
  status: string;
  description: string;
  location?: string;
  notes?: string;
}

interface CaptainProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: 'motorcycle' | 'car' | 'bicycle';
  vehicleNumber: string;
  totalDeliveries: number;
}

interface CaptainStats {
  dailyEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  ordersToday: number;
  ordersWeek: number;
  ordersMonth: number;
  totalDistance: number;
  onlineTime: number;
  completionRate: number;
}

interface RouteInfo {
  orderId: string;
  routeData: any;
  encodedPolyline: string;
  estimatedDistance: number;
  estimatedDuration: number;
  routeSteps: any[];
}

export default function CaptainDashboard() {
  const [captainData, setCaptainData] = useState<CaptainProfile | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CaptainOrder | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeOrders, setActiveOrders] = useState<CaptainOrder[]>([]);
  // نظام إدارة التضارب الجديد
  const [orderAttempts, setOrderAttempts] = useState<Map<string, { status: 'attempting' | 'locked' | 'confirmed' | 'failed', timestamp: number, lockTimeRemaining?: number }>>(new Map());
  const [conflictNotifications, setConflictNotifications] = useState<Map<string, { message: string; type: string; timestamp: number }>>(new Map());
  const [stats, setStats] = useState<CaptainStats>({
    dailyEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    ordersToday: 0,
    ordersWeek: 0,
    ordersMonth: 0,
    totalDistance: 0,
    onlineTime: 0,
    completionRate: 95
  });
  const [currentRoute, setCurrentRoute] = useState<RouteInfo | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // WebSocket للتحديثات المباشرة
  const { state: wsState, updateDriverLocation, subscribeToOrderUpdates } = useWebSocket();

  // GPS للموقع الجغرافي
  const {
    currentLocation,
    isTracking,
    accuracy,
    startTracking,
    stopTracking,
    getDistanceToDestination,
    openNavigation
  } = useGPS({
    trackingInterval: 15000, // كل 15 ثانية
    onLocationUpdate: (location) => {
      // إرسال الموقع عبر WebSocket إذا كان الكبتن متصل
      if (captainData?.id && wsState.isConnected && isOnline) {
        updateDriverLocation(location.lat, location.lng);
      }
    }
  });

  // تحقق من تسجيل الدخول
  useEffect(() => {
    const authData = localStorage.getItem('captainAuth');
    
    if (!authData) {
      setLocation('/captain/secure-login');
      return;
    }
    
    try {
      const parsed = JSON.parse(authData);
      const captain = {
        id: parsed.user.id,
        name: parsed.user.fullName,
        phone: parsed.user.phone,
        email: parsed.user.email,
        vehicleType: parsed.user.vehicleType || 'motorcycle',
        vehicleNumber: parsed.user.driverCode,
        totalDeliveries: 156
      };
      setCaptainData(captain);
      
      // Load initial stats
      loadCaptainStats(captain.id);
    } catch (error) {
      console.error('خطأ في قراءة بيانات الكبتن:', error);
      setLocation('/captain/secure-login');
    }
  }, [setLocation]);

  // بدء/إيقاف تتبع الموقع حسب حالة الكبتن
  useEffect(() => {
    if (captainData?.id && isOnline && wsState.isConnected) {
      if (!isTracking) {
        startTracking();
      }
    } else {
      if (isTracking) {
        stopTracking();
      }
    }
  }, [captainData?.id, isOnline, wsState.isConnected, isTracking, startTracking, stopTracking]);

  // الاستماع للطلبات الجديدة عبر WebSocket
  useWebSocketEvent('new_order_available', (orderData: any) => {
    toast({
      title: '🚚 طلب جديد متاح!',
      description: `طلب رقم ${orderData.orderNumber} بقيمة ${orderData.totalAmount} جنيه`,
      duration: 0, // بدون انتهاء تلقائي
      action: (
        <Button 
          size="sm"
          onClick={() => {
            // فتح تفاصيل الطلب
            queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
          }}
        >
          عرض
        </Button>
      )
    });

    // تحديث قائمة الطلبات
    queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
  });

  // الاستماع لتحديثات حالة الطلبات
  useWebSocketEvent('order_status_update', (updateData: any) => {
    console.log('📱 تحديث حالة الطلب:', updateData);
    queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
  });

  // === إشعارات نظام منع التضارب الجديد ===
  
  // إشعار عند قفل طلب من كبتن منافس (أسماء مصححة)
  useWebSocketEvent('order_locked', (data: any) => {
    const { orderId, lockedBy, timeRemaining } = data;
    setConflictNotifications(prev => {
      const newNotifications = new Map(prev);
      newNotifications.set(orderId, {
        message: `تم حجز الطلب من كبتن آخر: ${lockedBy}`,
        type: 'warning',
        timestamp: Date.now()
      });
      return newNotifications;
    });
    
    toast({
      title: '⚠️ طلب محجوز',
      description: `تم حجز الطلب من ${lockedBy} - يمكنك المحاولة لاحقاً`,
      variant: 'destructive'
    });
  });
  
  // إشعار عند تعيين طلب لكبتن منافس (أسماء مصححة)
  useWebSocketEvent('order_assigned', (data: any) => {
    const { orderId, assignedTo, captainId } = data;
    setConflictNotifications(prev => {
      const newNotifications = new Map(prev);
      newNotifications.set(orderId, {
        message: `تم تعيين الطلب للكبتن: ${assignedTo}`,
        type: 'info',
        timestamp: Date.now()
      });
      return newNotifications;
    });
    
    // إزالة محاولة القبول المحلية
    setOrderAttempts(prev => {
      const newAttempts = new Map(prev);
      newAttempts.delete(orderId);
      return newAttempts;
    });
    
    toast({
      title: '📋 تم تعيين الطلب',
      description: `تم تعيين الطلب للكبتن ${assignedTo}`,
      variant: 'default'
    });
    
    // تحديث قائمة الطلبات
    queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
  });
  
  // إشعار عند إتاحة طلب بعد الإلغاء (أسماء مصححة)
  useWebSocketEvent('order_available', (data: any) => {
    const { orderId } = data;
    setConflictNotifications(prev => {
      const newNotifications = new Map(prev);
      newNotifications.set(orderId, {
        message: 'الطلب متاح مرة أخرى للقبول',
        type: 'success',
        timestamp: Date.now()
      });
      return newNotifications;
    });
    
    toast({
      title: '✅ طلب متاح',
      description: 'طلب متاح مرة أخرى للقبول',
      variant: 'default'
    });
    
    // تحديث قائمة الطلبات
    queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
  });

  // جلب الطلبات المتاحة
  const { data: availableOrders = [], isLoading: ordersLoading } = useQuery<CaptainOrder[]>({
    queryKey: ['/api/captain/available-orders', captainData?.id],
    queryFn: async () => {
      const captainSession = localStorage.getItem('captain_session') || captainData?.id;
      const headers: Record<string, string> = {};
      
      if (captainSession) {
        headers['x-captain-session'] = captainSession;
        headers['Authorization'] = `Bearer ${captainSession}`;
      }
      
      const response = await fetch(`/api/captain/${captainData?.id}/available-orders`, {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // التأكد من إرجاع array
      if (data.success && data.orders) {
        return data.orders;
      }
      
      return [];
    },
    enabled: !!captainData?.id,
    refetchInterval: 10000 // تحديث كل 10 ثواني
  });

  // جلب الطلبات الحالية للكبتن (المقبولة/قيد التنفيذ)
  const { data: currentOrders = [], isLoading: currentOrdersLoading } = useQuery<CaptainOrder[]>({
    queryKey: ['/api/captain/current-orders', captainData?.id],
    queryFn: async () => {
      const captainSession = localStorage.getItem('captain_session') || captainData?.id;
      const headers: Record<string, string> = {};
      
      if (captainSession) {
        headers['x-captain-session'] = captainSession;
        headers['Authorization'] = `Bearer ${captainSession}`;
      }
      
      const response = await fetch(`/api/captain/${captainData?.id}/current-orders`, {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // التأكد من إرجاع array
      if (data.success && data.orders) {
        return data.orders;
      }
      
      return [];
    },
    enabled: !!captainData?.id,
    refetchInterval: 15000 // تحديث كل 15 ثانية
  });

  // إنهاء الطلب (تم التوصيل)
  const completeOrderMutation = useMutation({
    mutationFn: async ({ orderId, notes, deliveryLocation }: { 
      orderId: string; 
      notes?: string; 
      deliveryLocation?: string 
    }) => {
      return await apiRequest('POST', `/api/captain/${captainData?.id}/complete-order/${orderId}`, {
        notes,
        deliveryLocation
      });
    },
    onSuccess: (data, { orderId }) => {
      toast({
        title: '✅ تم إنهاء الطلب',
        description: 'تم تسليم الطلب بنجاح! 🎉'
      });
      
      // تحديث قوائم الطلبات
      queryClient.invalidateQueries({ queryKey: ['/api/captain/current-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في إنهاء الطلب',
        description: error.error || 'فشل في إنهاء الطلب',
        variant: 'destructive'
      });
    }
  });

  // === النظام الجديد للقبول المنظم ===
  
  // مرحلة 1: محاولة قبول الطلب (حجز مؤقت)
  const attemptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // تسجيل المحاولة محلياً (مصحح)
      setOrderAttempts(prev => {
        const newAttempts = new Map(prev);
        newAttempts.set(orderId, {
          status: 'attempting',
          timestamp: Date.now()
        });
        return newAttempts;
      });
      
      return await apiRequest('POST', `/api/captain/${captainData?.id}/attempt-order/${orderId}`, {});
    },
    onSuccess: (data, orderId) => {
      // تحديث حالة المحاولة - نجحت وتم الحجز (مصحح)
      setOrderAttempts(prev => {
        const newAttempts = new Map(prev);
        newAttempts.set(orderId, {
          status: 'locked',
          timestamp: Date.now(),
          lockTimeRemaining: data.lockTimeRemaining
        });
        return newAttempts;
      });
      
      toast({
        title: '🔒 تم حجز الطلب مؤقتاً',
        description: `لديك ${Math.round(data.lockTimeRemaining / 1000)} ثانية لتأكيد القبول`,
        duration: 0,
        action: (
          <Button 
            size="sm"
            onClick={() => confirmOrderMutation.mutate(orderId)}
            className="bg-green-600 hover:bg-green-700"
          >
            تأكيد القبول
          </Button>
        )
      });
      
      // إزالة إشعار التضارب إذا كان موجود (مصحح)
      setConflictNotifications(prev => {
        const newNotifications = new Map(prev);
        newNotifications.delete(orderId);
        return newNotifications;
      });
    },
    onError: (error: any, orderId) => {
      // تحديث حالة المحاولة - فشلت (مصحح)
      setOrderAttempts(prev => {
        const newAttempts = new Map(prev);
        newAttempts.set(orderId, {
          status: 'failed',
          timestamp: Date.now()
        });
        return newAttempts;
      });
      
      // إزالة المحاولة بعد 3 ثواني
      setTimeout(() => {
        setOrderAttempts(prev => {
          const newAttempts = new Map(prev);
          newAttempts.delete(orderId);
          return newAttempts;
        });
      }, 3000);
      
      let errorMessage = error.error || 'فشل في محاولة قبول الطلب';
      let toastVariant: 'destructive' | 'default' = 'destructive';
      
      // رسائل خطأ محددة حسب نوع الخطأ
      if (error.code === 'CONFLICT_PREVENTION') {
        errorMessage = `يجب الانتظار ${Math.round(error.waitTime / 1000)} ثانية قبل المحاولة مرة أخرى`;
        toastVariant = 'default';
      }
      
      toast({
        title: '❌ فشل في حجز الطلب',
        description: errorMessage,
        variant: toastVariant
      });
    }
  });
  
  // مرحلة 2: تأكيد قبول الطلب (نهائي)
  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest('POST', `/api/captain/${captainData?.id}/confirm-order/${orderId}`, {});
    },
    onSuccess: (data, orderId) => {
      // تحديث حالة المحاولة - تم التأكيد (مصحح)
      setOrderAttempts(prev => {
        const newAttempts = new Map(prev);
        newAttempts.set(orderId, {
          status: 'confirmed',
          timestamp: Date.now()
        });
        return newAttempts;
      });
      
      // إزالة المحاولة بعد عرض النجاح
      setTimeout(() => {
        setOrderAttempts(prev => {
          const newAttempts = new Map(prev);
          newAttempts.delete(orderId);
          return newAttempts;
        });
      }, 2000);
      
      toast({
        title: '🎉 تم قبول الطلب نهائياً!',
        description: 'تم قبول الطلب بنجاح، ابدأ رحلة التوصيل'
      });
      // تحديث كلا قائمتي الطلبات
      queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/captain/current-orders'] });
    },
    onError: (error: any, orderId) => {
      // تحديث حالة المحاولة - فشل التأكيد (مصحح)
      setOrderAttempts(prev => {
        const newAttempts = new Map(prev);
        newAttempts.set(orderId, {
          status: 'failed',
          timestamp: Date.now()
        });
        return newAttempts;
      });
      
      // إزالة المحاولة
      setTimeout(() => {
        setOrderAttempts(prev => {
          const newAttempts = new Map(prev);
          newAttempts.delete(orderId);
          return newAttempts;
        });
      }, 3000);
      
      toast({
        title: '❌ فشل في تأكيد القبول',
        description: error.error || 'انتهت مهلة الحجز أو تم إلغاؤه',
        variant: 'destructive'
      });
    }
  });
  
  // إلغاء محاولة قبول الطلب
  const cancelOrderAttemptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest('POST', `/api/captain/${captainData?.id}/cancel-order/${orderId}`, {});
    },
    onSuccess: (data, orderId) => {
      // إزالة المحاولة
      setOrderAttempts(prev => {
        const newAttempts = new Map(prev);
        newAttempts.delete(orderId);
        return newAttempts;
      });
      
      toast({
        title: '↩️ تم إلغاء المحاولة',
        description: 'تم إلغاء محاولة قبول الطلب بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في الإلغاء',
        description: error.error || 'فشل في إلغاء المحاولة',
        variant: 'destructive'
      });
    }
  });
  
  // النظام القديم للتوافق (يستخدم النظام الجديد داخلياً)
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // استخدام النظام القديم للتوافق مع الكود الموجود
      return await apiRequest('POST', `/api/captain/${captainData?.id}/accept-order/${orderId}`, {});
    },
    onSuccess: () => {
      toast({
        title: '✅ تم قبول الطلب',
        description: 'تم قبول الطلب بنجاح (النظام القديم)، ابدأ رحلة التوصيل'
      });
      // تحديث كلا قائمتي الطلبات
      queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/captain/current-orders'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في قبول الطلب',
        description: error.error || 'فشل في قبول الطلب',
        variant: 'destructive'
      });
    }
  });

  // تحديث حالة الطلب
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notes, location }: { 
      orderId: string; 
      status: string; 
      notes?: string; 
      location?: string 
    }) => {
      return await apiRequest('POST', `/api/captain/${captainData?.id}/order/${orderId}/status`, {
        status,
        notes,
        location
      });
    },
    onSuccess: () => {
      toast({
        title: '✅ تم تحديث الحالة',
        description: 'تم تحديث حالة الطلب بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في التحديث',
        description: error.error || 'فشل في تحديث الحالة',
        variant: 'destructive'
      });
    }
  });

  // تحميل إحصائيات الكابتن المتقدمة
  const loadCaptainStats = async (captainId: string) => {
    try {
      const response = await fetch(`/api/captain/${captainId}/stats`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(prev => ({
            ...prev,
            ...data.stats
          }));
        }
      }
    } catch (error) {
      console.warn('⚠️ فشل في تحميل الإحصائيات:', error);
      // استخدام القيم الافتراضية
    }
  };

  // حساب مسار باستخدام Google Directions API
  const calculateRoute = async (orderId: string, destinationLat: number, destinationLng: number) => {
    if (!captainData?.id) {
      toast({
        title: '❌ خطأ',
        description: 'معرف الكابتن غير متاح',
        variant: 'destructive'
      });
      return;
    }
    
    // استخدام موقع افتراضي إذا لم يكن GPS متاح (منطقة مختلفة في القاهرة)
    const fallbackLocation = {
      lat: 30.064742, // القاهرة الجديدة - موقع افتراضي مختلف
      lng: 31.249509
    };
    
    const originLocation = currentLocation || fallbackLocation;
    
    if (!currentLocation) {
      toast({
        title: '⚠️ تنبيه',
        description: 'يتم استخدام موقع افتراضي - تأكد من تفعيل GPS للحصول على مسار دقيق',
        variant: 'default'
      });
    }

    try {
      // استخدام captain authentication headers
      const captainSession = localStorage.getItem('captain_session') || captainData?.id;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (captainSession) {
        headers['x-captain-session'] = captainSession;
        headers['Authorization'] = `Bearer ${captainSession}`;
      }

      const response = await fetch('/api/orders/calculate-route', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          orderId: orderId,
          origin: {
            lat: originLocation.lat,
            lng: originLocation.lng
          },
          destination: {
            lat: destinationLat,
            lng: destinationLng
          },
          waypoints: [] // إضافة waypoints field فاضي
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'فشل في حساب المسار');
      }

      if (data.success && data.route) {
        const routeInfo: RouteInfo = {
          orderId,
          routeData: data.route.routeData,
          encodedPolyline: data.route.encodedPolyline,
          estimatedDistance: data.route.estimatedDistance,
          estimatedDuration: data.route.estimatedDuration,
          routeSteps: data.route.routeSteps
        };
        
        setCurrentRoute(routeInfo);
        setShowMap(true);
        setSelectedTab('map');
        
        toast({
          title: '✅ تم حساب المسار',
          description: `المسافة: ${Math.round(routeInfo.estimatedDistance/1000)}كم، الزمن: ${Math.round(routeInfo.estimatedDuration/60)}دقيقة`
        });
      }
    } catch (error: any) {
      console.error('خطأ في حساب المسار:', error);
      toast({
        title: '❌ خطأ في حساب المسار',
        description: error.message || 'فشل في حساب المسار',
        variant: 'destructive'
      });
    }
  };

  // فتح خرائط Google للملاحة
  const openGoogleNavigation = (lat: number, lng: number) => {
    if (currentLocation) {
      const url = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  // تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem('captainAuth');
    toast({
      title: '👋 تم تسجيل الخروج',
      description: 'نراك قريباً'
    });
    setLocation('/captain/secure-login');
  };

  // تبديل حالة متصل/غير متصل
  const toggleOnlineStatus = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    
    if (newStatus) {
      startTracking();
    } else {
      stopTracking();
    }

    toast({
      title: newStatus ? '▶️ أنت الآن متصل' : '⏸️ أنت الآن غير متصل',
      description: newStatus ? 'ستستقبل طلبات جديدة ويتم تتبع موقعك' : 'لن تستقبل طلبات جديدة'
    });
  };

  if (!captainData) {
    return <div className="flex items-center justify-center h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* شريط علوي متطور */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isOnline ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/30' : 
                           'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}>
                  <Truck className="w-7 h-7 text-white" />
                </div>
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900 mb-1">مرحباً {captainData.name}</h1>
                <div className="flex items-center gap-3 text-sm">
                  <Badge 
                    variant={isOnline ? "default" : "secondary"} 
                    className={`text-xs font-medium px-3 py-1 ${
                      isOnline ? 'bg-green-100 text-green-800 border-green-200' : 
                               'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isOnline ? '🟢 متصل ونشط' : '🔴 غير متصل'}
                  </Badge>
                  <div className="flex items-center gap-1 text-gray-600">
                    {captainData.vehicleType === 'motorcycle' ? <span>🏍️</span> : <span>🚗</span>}
                    <span className="font-medium">{captainData.vehicleNumber}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* مؤشرات الحالة */}
              <div className="hidden md:flex items-center gap-3">
                <Badge 
                  variant={wsState.isConnected ? "default" : "destructive"}
                  className="text-xs px-2 py-1"
                >
                  {wsState.isConnected ? '🔗 متصل' : '❌ منقطع'}
                </Badge>
                
                <Badge 
                  variant={isTracking ? "default" : "secondary"}
                  className="text-xs px-2 py-1"
                >
                  {isTracking ? '📍 GPS نشط' : '📍 GPS معطل'}
                </Badge>
              </div>
              
              <Button
                variant={isOnline ? "outline" : "default"}
                size="sm"
                onClick={toggleOnlineStatus}
                className={`px-4 py-2 font-medium transition-all duration-300 ${
                  isOnline ? 'hover:bg-red-50 hover:border-red-200 hover:text-red-600' : 
                           'bg-green-600 hover:bg-green-700 text-white'
                }`}
                data-testid="button-toggle-status"
              >
                {isOnline ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    إيقاف العمل
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    بدء العمل
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* لوحة التحكم بالتابز */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-8 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-white">
              <BarChart3 className="w-4 h-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2 data-[state=active]:bg-white">
              <MapIcon className="w-4 h-4" />
              الخريطة
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 data-[state=active]:bg-white">
              <TrendingUp className="w-4 h-4" />
              الإحصائيات
            </TabsTrigger>
          </TabsList>

          {/* لوحة التحكم الرئيسية */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* إحصائيات سريعة محسنة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.ordersToday}</div>
                  <div className="text-sm text-gray-600 font-medium">طلبات اليوم</div>
                  <div className="text-xs text-blue-600 mt-2">📦 من أصل {stats.ordersWeek} هذا الأسبوع</div>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100/50">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Coins className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.dailyEarnings}</div>
                  <div className="text-sm text-gray-600 font-medium">أرباح اليوم (جنيه)</div>
                  <div className="text-xs text-green-600 mt-2">💰 +{Math.round((stats.dailyEarnings / stats.weeklyEarnings) * 100) || 0}% من الأسبوع</div>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Navigation2 className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {availableOrders.length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">طلبات متاحة</div>
                  <div className={`text-xs mt-2 ${
                    currentLocation ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {currentLocation ? (
                      <>📍 GPS متصل ({Math.round(accuracy || 0)}م)</>
                    ) : (
                      <>❌ GPS غير متصل</>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* الطلبات المتاحة محسنة */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                الطلبات المتاحة ({availableOrders.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] })}
                disabled={ordersLoading}
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">جاري تحميل الطلبات...</p>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد طلبات متاحة حالياً</p>
                <p className="text-sm text-gray-400 mt-2">ستظهر الطلبات هنا عند توفرها</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">طلب #{order.orderNumber}</h3>
                          <Badge 
                            variant={order.priority === 'urgent' ? 'destructive' : 
                                   order.priority === 'express' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {order.priority === 'urgent' ? '⚡ عاجل' : 
                             order.priority === 'express' ? '🚀 سريع' : '📦 عادي'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {order.customerName}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {order.customerPhone}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{order.deliveryAddress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            {order.totalAmount} جنيه
                          </div>
                        </div>

                        {order.specialInstructions && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-yellow-800">تعليمات خاصة:</p>
                                <p className="text-sm text-yellow-700">{order.specialInstructions}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(order.estimatedDelivery).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.estimatedDelivery).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          data-testid={`button-view-details-${order.id}`}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          التفاصيل
                        </Button>
                        
                        {order.deliveryCoordinates && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => calculateRoute(order.id, order.deliveryCoordinates!.lat, order.deliveryCoordinates!.lng)}
                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                            data-testid={`button-route-${order.id}`}
                          >
                            <Route className="w-4 h-4 mr-1" />
                            المسار
                          </Button>
                        )}
                        
                        {/* نظام القبول المتقدم الجديد */}
                        {(() => {
                          const attemptState = orderAttempts.get(order.id);
                          const conflictNotification = conflictNotifications.get(order.id);
                          
                          // إذا كان هناك محاولة نشطة
                          if (attemptState) {
                            if (attemptState.status === 'attempting') {
                              return (
                                <Button
                                  size="sm"
                                  disabled
                                  className="bg-yellow-600 opacity-75"
                                  data-testid={`button-attempting-${order.id}`}
                                >
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                  جاري المحاولة...
                                </Button>
                              );
                            }
                            
                            if (attemptState.status === 'locked') {
                              return (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => confirmOrderMutation.mutate(order.id)}
                                    disabled={confirmOrderMutation.isPending}
                                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 animate-pulse"
                                    data-testid={`button-confirm-${order.id}`}
                                  >
                                    {confirmOrderMutation.isPending ? (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                    )}
                                    تأكيد القبول
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => cancelOrderAttemptMutation.mutate(order.id)}
                                    disabled={cancelOrderAttemptMutation.isPending}
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                    data-testid={`button-cancel-attempt-${order.id}`}
                                  >
                                    ❌ إلغاء
                                  </Button>
                                </div>
                              );
                            }
                            
                            if (attemptState.status === 'confirmed') {
                              return (
                                <Button
                                  size="sm"
                                  disabled
                                  className="bg-green-600 opacity-75"
                                  data-testid={`button-confirmed-${order.id}`}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  تم القبول ✅
                                </Button>
                              );
                            }
                            
                            if (attemptState.status === 'failed') {
                              return (
                                <Button
                                  size="sm"
                                  disabled
                                  className="bg-red-600 opacity-75"
                                  data-testid={`button-failed-${order.id}`}
                                >
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  فشلت المحاولة
                                </Button>
                              );
                            }
                          }
                          
                          // الحالة الافتراضية - زر المحاولة
                          return (
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                onClick={() => attemptOrderMutation.mutate(order.id)}
                                disabled={attemptOrderMutation.isPending}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300"
                                data-testid={`button-attempt-order-${order.id}`}
                              >
                                {attemptOrderMutation.isPending ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                ) : (
                                  <Timer className="w-4 h-4 mr-1" />
                                )}
                                محاولة قبول
                              </Button>
                              
                              {/* إشعار التضارب إن وجد */}
                              {conflictNotification && (
                                <div className={`text-xs px-2 py-1 rounded text-center ${
                                  conflictNotification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                  conflictNotification.type === 'success' ? 'bg-green-100 text-green-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {conflictNotification.message}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        
                        {/* زر القبول المباشر (النظام القديم للطوارئ) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acceptOrderMutation.mutate(order.id)}
                          disabled={acceptOrderMutation.isPending}
                          className="border-green-200 text-green-700 hover:bg-green-50 text-xs"
                          data-testid={`button-legacy-accept-${order.id}`}
                          title="النظام القديم للطوارئ"
                        >
                          {acceptOrderMutation.isPending ? (
                            <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin mr-1" />
                          ) : (
                            <Zap className="w-3 h-3 mr-1" />
                          )}
                          فوري
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
            </Card>

            {/* طلباتي الحالية */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-100/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-green-600" />
                    طلباتي الحالية ({currentOrders.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/captain/current-orders'] })}
                    disabled={currentOrdersLoading}
                    data-testid="button-refresh-current"
                  >
                    <RefreshCw className={`w-4 h-4 ${currentOrdersLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {currentOrdersLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">جاري تحميل طلباتك الحالية...</p>
                  </div>
                ) : currentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">لا توجد طلبات حالية</p>
                    <p className="text-sm text-gray-400 mt-2">ستظهر هنا الطلبات التي قبلتها</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border-2 border-green-200 rounded-lg p-4 bg-white/80 backdrop-blur-sm hover:bg-green-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">طلب #{order.orderNumber}</h3>
                              <Badge className="bg-green-600 text-white text-xs">
                                🚛 قيد التنفيذ
                              </Badge>
                              <Badge 
                                variant={order.priority === 'urgent' ? 'destructive' : 
                                       order.priority === 'express' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {order.priority === 'urgent' ? '⚡ عاجل' : 
                                 order.priority === 'express' ? '🚀 سريع' : '📦 عادي'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {order.customerName}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {order.customerPhone}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{order.deliveryAddress}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                {order.totalAmount} جنيه
                              </div>
                            </div>

                            {order.specialInstructions && (
                              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-yellow-800">تعليمات خاصة:</p>
                                    <p className="text-sm text-yellow-700">{order.specialInstructions}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-green-200">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(order.estimatedDelivery).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(order.estimatedDelivery).toLocaleDateString('ar-EG')}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              data-testid={`button-view-current-details-${order.id}`}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              التفاصيل
                            </Button>
                            
                            {order.deliveryCoordinates && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => calculateRoute(order.id, order.deliveryCoordinates!.lat, order.deliveryCoordinates!.lng)}
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                data-testid={`button-current-route-${order.id}`}
                              >
                                <Route className="w-4 h-4 mr-1" />
                                المسار
                              </Button>
                            )}
                            
                            {/* أزرار التحكم في التوصيل - حسب حالة الطلب */}
                            {order.status === 'ready' || order.status === 'preparing' ? (
                              /* زر "بدا توصيل الطلب" للطلبات المجهزة */
                              <Button
                                size="sm"
                                onClick={() => {
                                  // تحديث حالة الطلب إلى "جاري التوصيل"
                                  apiRequest('PATCH', `/api/orders/${order.id}/status`, {
                                    status: 'out_for_delivery',
                                    statusText: 'جاري التوصيل - تم بدء رحلة التوصيل',
                                    captainId: captainData?.id
                                  }).then(() => {
                                    toast({
                                      title: '🚚 تم بدء التوصيل!',
                                      description: 'تم بدء رحلة التوصيل بنجاح - يمكنك الآن تتبع موقعك'
                                    });
                                    
                                    // تحديث الطلبات
                                    queryClient.invalidateQueries({ queryKey: ['/api/captain/current-orders'] });
                                    
                                    // بدء تتبع GPS إذا لم يكن مفعل
                                    if (!isTracking) {
                                      startTracking();
                                    }
                                  }).catch((error) => {
                                    toast({
                                      title: '❌ خطأ في بدء التوصيل',
                                      description: error.message || 'فشل في بدء رحلة التوصيل',
                                      variant: 'destructive'
                                    });
                                  });
                                }}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300"
                                data-testid={`button-start-delivery-${order.id}`}
                              >
                                <Truck className="w-4 h-4 mr-1" />
                                🚚 بدا توصيل الطلب
                              </Button>
                            ) : order.status === 'out_for_delivery' ? (
                              /* زر "تم التوصيل" للطلبات الجاري توصيلها */
                              <Button
                                size="sm"
                                onClick={() => completeOrderMutation.mutate({ 
                                  orderId: order.id,
                                  notes: 'تم التسليم بنجاح',
                                  deliveryLocation: order.deliveryAddress
                                })}
                                disabled={completeOrderMutation.isPending}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-300"
                                data-testid={`button-complete-order-${order.id}`}
                              >
                                {completeOrderMutation.isPending ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                )}
                                تم التوصيل ✅
                              </Button>
                            ) : (
                              /* للطلبات المكتملة أو المخالفة */
                              <Badge className="bg-gray-500 text-white">
                                {order.status === 'delivered' ? '✅ مكتمل' : order.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* تاب الخريطة */}
          <TabsContent value="map" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  خريطة التوصيل التفاعلية
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentLocation ? (
                  <div className="space-y-6">

                    {/* Original GoogleMap component */}
                    <div className="h-96 bg-gray-100 rounded-lg relative overflow-hidden">
                      {currentLocation ? (
                        <GoogleMap
                          customerLocation={currentLocation}
                          driverLocation={{
                            lat: currentLocation.lat,
                            lng: currentLocation.lng,
                            timestamp: Date.now(),
                            driverId: captainData?.id || 'captain-001',
                            driverName: captainData?.name || 'الكابتن',
                            speed: 0,
                            heading: 0
                          }}
                          orderDestination={currentRoute ? {
                            lat: availableOrders.find(o => o.id === currentRoute.orderId)?.deliveryCoordinates?.lat || 0,
                            lng: availableOrders.find(o => o.id === currentRoute.orderId)?.deliveryCoordinates?.lng || 0
                          } : undefined}
                          routeData={{
                            routes: currentRoute?.routeData ? [currentRoute.routeData] : [],
                            encodedPolyline: currentRoute?.encodedPolyline,
                            estimatedDistance: currentRoute?.estimatedDistance,
                            estimatedDuration: currentRoute?.estimatedDuration
                          }}
                          showRoute={!!currentRoute}
                          isDriverMode={true}
                          height="384px"
                          zoom={13}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">خريطة Google Maps</p>
                            <p className="text-sm text-gray-500 mt-2">يتم تحديد الموقع...</p>
                          </div>
                        </div>
                      )}
                      
                    </div>
                    
                    {/* المعلومات أسفل الخريطة */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* معلومات الموقع الحالي */}
                      {currentLocation && (
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-800 text-sm mb-2 flex items-center gap-1">
                              📍 معلومات الموقع الحالي
                            </h4>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-600 text-xs">📐 خط الطول:</span>
                                <p className="text-blue-700 font-mono text-xs bg-blue-50 px-2 py-1 rounded">{currentLocation.lng.toFixed(6)}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-600 text-xs">📐 خط العرض:</span>
                                <p className="text-blue-700 font-mono text-xs bg-blue-50 px-2 py-1 rounded">{currentLocation.lat.toFixed(6)}</p>
                              </div>
                            </div>
                            
                            {accuracy && (
                              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <span className="font-medium text-gray-600 text-xs">🎯 دقة GPS:</span>
                                <p className="text-green-700 text-xs bg-green-50 px-2 py-1 rounded font-medium">±{Math.round(accuracy)}م</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* معلومات المسار */}
                      {currentRoute && (
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Route className="w-4 h-4" />
                            معلومات المسار
                          </h4>
                          <div className="space-y-2 text-sm mb-3">
                            <div className="flex items-center gap-2">
                              <Navigation className="w-4 h-4 text-blue-500" />
                              <span>{Math.round(currentRoute.estimatedDistance/1000)} كم</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Timer className="w-4 h-4 text-green-500" />
                              <span>{Math.round(currentRoute.estimatedDuration/60)} دقيقة</span>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              const order = availableOrders.find(o => o.id === currentRoute.orderId);
                              if (order?.deliveryCoordinates) {
                                openGoogleNavigation(order.deliveryCoordinates.lat, order.deliveryCoordinates.lng);
                              }
                            }}
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            فتح في Google Maps
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {!isTracking && (
                      <div className="text-center py-4">
                        <Button
                          onClick={startTracking}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          بدء تتبع الموقع
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">غير متصل بالموقع</p>
                    <p className="text-sm text-gray-500 mt-2">تحتاج إلى تفعيل GPS لعرض الخريطة</p>
                    <Button
                      onClick={startTracking}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      تفعيل GPS
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* تاب الإحصائيات */}
          <TabsContent value="stats" className="space-y-6">
            {/* إحصائيات الأرباح */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Coins className="w-5 h-5 text-green-600" />
                    الأرباح
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">اليوم</span>
                      <span className="font-bold text-lg text-green-700">{stats.dailyEarnings} جنيه</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">هآا الأسبوع</span>
                      <span className="font-bold text-green-700">{stats.weeklyEarnings} جنيه</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">هذا الشهر</span>
                      <span className="font-bold text-green-700">{stats.monthlyEarnings} جنيه</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">متوسط الربح للطلب</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.ordersToday > 0 ? Math.round(stats.dailyEarnings / stats.ordersToday) : 0} جنيه
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                    الطلبات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">اليوم</span>
                      <span className="font-bold text-lg text-blue-700">{stats.ordersToday}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">هذا الأسبوع</span>
                      <span className="font-bold text-blue-700">{stats.ordersWeek}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">هذا الشهر</span>
                      <span className="font-bold text-blue-700">{stats.ordersMonth}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">معدل الإنجاز</p>
                    <div className="flex items-center gap-2">
                      <Progress value={stats.completionRate} className="flex-1" />
                      <span className="text-sm font-medium">{stats.completionRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Gauge className="w-5 h-5 text-purple-600" />
                    الأداء
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">المسافة اليوم</span>
                      <span className="font-bold text-purple-700">{Math.round(stats.totalDistance)} كم</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">زمن العمل</span>
                      <span className="font-bold text-purple-700">{Math.round(stats.onlineTime/60)} ساعة</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* تفاصيل الطلب (مودال محسن) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">تفاصيل الطلب #{selectedOrder.orderNumber}</h2>
              <Button
                variant="ghost"
                onClick={() => setSelectedOrder(null)}
                data-testid="button-close-details"
              >
                ✕
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* معلومات العميل */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  معلومات العميل
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">الاسم:</span>
                    <span>{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">الهاتف:</span>
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">العنوان:</span>
                    <span className="text-right">{selectedOrder.deliveryAddress}</span>
                  </div>
                </div>
              </div>

              {/* الفاتورة */}
              {selectedOrder.invoice && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    الفاتورة
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span>رقم الفاتورة:</span>
                        <span className="font-mono">{selectedOrder.invoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>تاريخ الإصدار:</span>
                        <span>{new Date(selectedOrder.invoice.issueDate).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedOrder.invoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.description} × {item.quantity}</span>
                          <span>{item.total} جنيه</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>المجموع:</span>
                        <span>{selectedOrder.invoice.total} جنيه</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* أزرار العمل المتطورة */}
              <div className="space-y-4">
                {/* عرض حالة الطلب ومعلومات التضارب */}
                {(() => {
                  const attemptState = orderAttempts.get(selectedOrder.id);
                  const conflictNotification = conflictNotifications.get(selectedOrder.id);
                  
                  if (attemptState || conflictNotification) {
                    return (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          حالة الطلب
                        </h4>
                        
                        {attemptState && (
                          <div className={`mb-3 p-3 rounded-lg flex items-center gap-2 ${
                            attemptState.status === 'attempting' ? 'bg-yellow-100 text-yellow-800' :
                            attemptState.status === 'locked' ? 'bg-blue-100 text-blue-800' :
                            attemptState.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {attemptState.status === 'attempting' && (
                              <>
                                <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                                <span>جاري محاولة حجز الطلب...</span>
                              </>
                            )}
                            {attemptState.status === 'locked' && (
                              <>
                                <Timer className="w-4 h-4" />
                                <span>تم حجز الطلب مؤقتاً - يجب تأكيد القبول</span>
                              </>
                            )}
                            {attemptState.status === 'confirmed' && (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>تم تأكيد قبول الطلب بنجاح!</span>
                              </>
                            )}
                            {attemptState.status === 'failed' && (
                              <>
                                <AlertCircle className="w-4 h-4" />
                                <span>فشلت محاولة قبول الطلب</span>
                              </>
                            )}
                          </div>
                        )}
                        
                        {conflictNotification && (
                          <div className={`p-3 rounded-lg flex items-center gap-2 ${
                            conflictNotification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            conflictNotification.type === 'success' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            <AlertCircle className="w-4 h-4" />
                            <span>{conflictNotification.message}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                
                {/* أزرار العمل */}
                <div className="flex gap-3">
                  {(() => {
                    const attemptState = orderAttempts.get(selectedOrder.id);
                    
                    // عرض أزرار حسب حالة الطلب
                    if (attemptState?.status === 'locked') {
                      return (
                        <>
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 animate-pulse"
                            onClick={() => {
                              confirmOrderMutation.mutate(selectedOrder.id);
                              setSelectedOrder(null);
                            }}
                            disabled={confirmOrderMutation.isPending}
                            data-testid="button-confirm-order-modal"
                          >
                            {confirmOrderMutation.isPending ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                            )}
                            تأكيد القبول نهائياً
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => {
                              cancelOrderAttemptMutation.mutate(selectedOrder.id);
                              setSelectedOrder(null);
                            }}
                            disabled={cancelOrderAttemptMutation.isPending}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            data-testid="button-cancel-attempt-modal"
                          >
                            ❌ إلغاء المحاولة
                          </Button>
                        </>
                      );
                    }
                    
                    if (attemptState?.status === 'confirmed') {
                      return (
                        <Button
                          className="flex-1 bg-green-600 opacity-75"
                          disabled
                          data-testid="button-confirmed-modal"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          تم قبول الطلب ✅
                        </Button>
                      );
                    }
                    
                    if (attemptState?.status === 'attempting') {
                      return (
                        <Button
                          className="flex-1 bg-yellow-600 opacity-75"
                          disabled
                          data-testid="button-attempting-modal"
                        >
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          جاري المحاولة...
                        </Button>
                      );
                    }
                    
                    // الحالة الافتراضية - عرض أزرار القبول
                    return (
                      <>
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            attemptOrderMutation.mutate(selectedOrder.id);
                            // عدم إغلاق المودال لعرض حالة التقدم
                          }}
                          disabled={attemptOrderMutation.isPending}
                          data-testid="button-attempt-order-modal"
                        >
                          {attemptOrderMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <Timer className="w-4 h-4 mr-2" />
                          )}
                          محاولة قبول الطلب
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            acceptOrderMutation.mutate(selectedOrder.id);
                            setSelectedOrder(null);
                          }}
                          disabled={acceptOrderMutation.isPending}
                          className="border-green-200 text-green-700 hover:bg-green-50"
                          data-testid="button-legacy-accept-modal"
                          title="النظام القديم - قبول فوري"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          قبول فوري
                        </Button>
                      </>
                    );
                  })()}
                </div>
                
                {/* زر المسار */}
                {selectedOrder.deliveryCoordinates && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const { lat, lng } = selectedOrder.deliveryCoordinates!;
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                    }}
                    data-testid="button-open-maps"
                  >
                    <MapIcon className="w-4 h-4 mr-2" />
                    خرائط
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}