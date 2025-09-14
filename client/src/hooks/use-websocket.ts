import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { supabase } from '@/lib/supabase';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
  message?: string;
  connectionId?: string;
  userId?: string;
  userType?: string;
  orderId?: string;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionId?: string;
  error?: string;
  lastPing?: number;
}

interface WebSocketHook {
  state: WebSocketState;
  sendMessage: (message: WebSocketMessage) => void;
  subscribeToOrderUpdates: (orderId: string) => void;
  updateDriverLocation: (latitude: number, longitude: number, orderId?: string) => void;
  broadcastOrderStatusUpdate: (orderId: string, status: string, statusText: string, additionalData?: any) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(): WebSocketHook {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Handle notification message  
  // Request notification permission on first use
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission:', permission);
      } catch (error) {
        console.log('⚠️ Failed to request notification permission:', error);
      }
    }
  }, []);

  const handleNotificationMessage = useCallback((notification: any) => {
    if (!notification) return;

    console.log('🔔 Real-time notification received:', notification);

    // Invalidate notification queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });

    // Show toast notification if priority is high or urgent
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      toast({
        title: notification.title,
        description: notification.message,
        duration: notification.priority === 'urgent' ? 10000 : 5000,
      });
    }

    // Trigger browser notification if permissions granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });
    }
  }, [queryClient, toast]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false
  });

  // Get authentication token for WebSocket connection
  const getAuthToken = useCallback(async () => {
    // Check localStorage first (for admin users)
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      return storedToken;
    }
    
    // Fall back to Supabase session for regular users
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.warn('⚠️ Failed to get auth token:', error);
      return null;
    }
  }, []);

  // إنشاء اتصال WebSocket - RE-ENABLED after fixing auth issues
  const connect = useCallback(() => {

    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: undefined }));
    console.log('🔗 Connecting to WebSocket...');

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('✅ WebSocket connected successfully');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: undefined
        }));

        // Request notification permission
        requestNotificationPermission();

        // مصادقة المستخدم إذا كان متاحاً مع JWT token
        if (user) {
          const token = await getAuthToken();
          
          // Only authenticate if we have a valid JWT token
          if (token && token !== 'temp-token') {
            const authMessage: WebSocketMessage = {
              type: 'authenticate',
              data: {
                userId: user.id,
                userType: 'customer',
                token: token
              }
            };
            ws.send(JSON.stringify(authMessage));
          } else {
            console.log('⚠️ No valid JWT token available for WebSocket authentication');
            // Close connection if no valid token
            setState(prev => ({
              ...prev,
              error: 'مطلوب تسجيل دخول صالح للاتصال'
            }));
            ws.close(4001, 'Authentication required');
          }
        }

        // بدء ping للحفاظ على الاتصال
        startPing();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);

          switch (message.type) {
            case 'notification':
              handleNotificationMessage(message.data);
              break;
              
            case 'welcome':
              setState(prev => ({
                ...prev,
                connectionId: message.connectionId
              }));
              break;

            case 'authenticated':
              console.log('✅ WebSocket authentication successful');
              break;

            case 'pong':
              setState(prev => ({
                ...prev,
                lastPing: Date.now()
              }));
              break;

            case 'order_status_update':
              // بث تحديث حالة الطلب للمكونات المهتمة
              window.dispatchEvent(new CustomEvent('orderStatusUpdate', {
                detail: message.data
              }));
              break;

            case 'driver_location_update':
              // بث تحديث موقع الكابتن
              window.dispatchEvent(new CustomEvent('driverLocationUpdate', {
                detail: message.data
              }));
              break;


            default:
              console.log(`❓ Unknown message type: ${message.type}`);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`❌ WebSocket connection closed:`, event.code, event.reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));

        stopPing();

        // FIXED: Stop authentication loop - don't reconnect on auth failures
        const isNormalClosure = event.code === 1000;
        const isAuthFailure = event.code === 4001 || event.code === 4000;
        const isInvalidToken = event.reason === 'Authentication required';
        
        // Only reconnect if it's not a normal closure and not an auth failure
        if (!isNormalClosure && !isAuthFailure && !isInvalidToken) {
          console.log('🔄 Network error detected - scheduling reconnect');
          scheduleReconnect();
        } else if (isAuthFailure || isInvalidToken) {
          console.warn('🚫 AUTHENTICATION FAILED - Connection stopped permanently');
          console.warn('🚫 Please login again to restore WebSocket connection');
          
          // Clear any pending reconnection attempts
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          
          setState(prev => ({
            ...prev,
            error: 'Authentication required - please login again'
          }));
        } else {
          console.log('🔌 WebSocket connection closed normally - no reconnection needed');
        }
      };

      ws.onerror = (error) => {
        console.error('💥 WebSocket error:', error);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: 'خطأ في الاتصال'
        }));
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: 'فشل في إنشاء الاتصال'
      }));
    }
  }, [user]);

  // إيقاف ping
  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // بدء ping للحفاظ على الاتصال
  const startPing = useCallback(() => {
    stopPing();
    
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // ping كل 30 ثانية
  }, [stopPing]);

  // جدولة إعادة الاتصال - ENHANCED with call stack debugging
  const scheduleReconnect = useCallback(() => {
    // DEBUG: Log call stack to find who's calling this
    console.error('🔍 scheduleReconnect() called from:', new Error().stack);
    
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    const delay = Math.min(5000 * Math.pow(2, 0), 30000); // بدء من 5 ثوان
    console.log(`🔄 Scheduling WebSocket reconnection in ${delay}ms`);

    reconnectTimerRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  // إرسال رسالة
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 WebSocket message sent:', message);
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message:', message);
    }
  }, []);

  // الاشتراك في تحديثات طلب معين
  const subscribeToOrderUpdates = useCallback((orderId: string) => {
    sendMessage({
      type: 'subscribe_order_updates',
      data: { orderId }
    });
  }, [sendMessage]);

  // تحديث موقع الكابتن
  const updateDriverLocation = useCallback((latitude: number, longitude: number, orderId?: string) => {
    sendMessage({
      type: 'driver_location_update',
      data: {
        lat: latitude,
        lng: longitude,
        orderId,
        timestamp: Date.now(),
        speed: 0,
        heading: 0
      }
    });
  }, [sendMessage]);

  // بث تحديث حالة الطلب
  const broadcastOrderStatusUpdate = useCallback((orderId: string, status: string, statusText: string, additionalData?: any) => {
    sendMessage({
      type: 'order_status_update',
      data: {
        orderId,
        status,
        statusText,
        timestamp: Date.now(),
        ...additionalData
      }
    });
  }, [sendMessage]);

  // قطع الاتصال
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    stopPing();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setState({
      isConnected: false,
      isConnecting: false
    });
  }, [stopPing]);

  // إعادة الاتصال يدوياً
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  // تأثيرات الاتصال والتنظيف - RE-ENABLED after fixing auth issues
  useEffect(() => {
    console.log('🔗 useWebSocket connection re-enabled - Authentication issues resolved');
    
    // Auto-connect when component mounts and user is authenticated
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // تنظيف عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      stopPing();
    };
  }, [stopPing]);

  return {
    state,
    sendMessage,
    subscribeToOrderUpdates,
    updateDriverLocation,
    broadcastOrderStatusUpdate,
    disconnect,
    reconnect
  };
}

// Hook للاستماع للأحداث المخصصة
export function useWebSocketEvent<T = any>(eventName: string, handler: (data: T) => void) {
  useEffect(() => {
    const eventHandler = (event: CustomEvent<T>) => {
      handler(event.detail);
    };

    window.addEventListener(eventName as any, eventHandler);

    return () => {
      window.removeEventListener(eventName as any, eventHandler);
    };
  }, [eventName, handler]);
}