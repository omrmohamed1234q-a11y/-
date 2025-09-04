import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';

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
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(): WebSocketHook {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false
  });

  // إنشاء اتصال WebSocket
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

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: undefined
        }));

        // مصادقة المستخدم إذا كان متاحاً
        if (user) {
          const authMessage: WebSocketMessage = {
            type: 'authenticate',
            data: {
              userId: user.id,
              userType: 'customer', // يمكن تحديدها حسب نوع المستخدم
              token: user.accessToken || 'temp-token'
            }
          };
          ws.send(JSON.stringify(authMessage));
        }

        // بدء ping للحفاظ على الاتصال
        startPing();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);

          switch (message.type) {
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

            case 'notification':
              // بث الإشعارات
              window.dispatchEvent(new CustomEvent('realtimeNotification', {
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

        // إعادة الاتصال التلقائي إذا لم يكن الإغلاق مقصوداً
        if (event.code !== 1000) { // 1000 = normal closure
          scheduleReconnect();
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

  // جدولة إعادة الاتصال
  const scheduleReconnect = useCallback(() => {
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
        latitude,
        longitude,
        orderId,
        timestamp: Date.now()
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

  // تأثيرات الاتصال والتنظيف
  useEffect(() => {
    connect();

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