import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useWebSocket, useWebSocketEvent } from '@/hooks/use-websocket';
import { Wifi, WifiOff, Send, Package, MapPin, Bell } from 'lucide-react';

export default function WebSocketTest() {
  const { state, sendMessage, subscribeToOrderUpdates, reconnect } = useWebSocket();
  const [testOrderId, setTestOrderId] = useState('ORDER-123456');
  const [messages, setMessages] = useState<any[]>([]);

  // الاستماع لجميع أنواع الرسائل
  useWebSocketEvent('orderStatusUpdate', (data) => {
    setMessages(prev => [...prev, { 
      type: 'Order Status Update', 
      data, 
      timestamp: new Date() 
    }]);
  });

  useWebSocketEvent('driverLocationUpdate', (data) => {
    setMessages(prev => [...prev, { 
      type: 'Driver Location Update', 
      data, 
      timestamp: new Date() 
    }]);
  });

  useWebSocketEvent('realtimeNotification', (data) => {
    setMessages(prev => [...prev, { 
      type: 'Notification', 
      data, 
      timestamp: new Date() 
    }]);
  });

  const handleSendTestMessage = () => {
    sendMessage({
      type: 'test_message',
      data: {
        message: 'اختبار رسالة من الواجهة الأمامية',
        timestamp: Date.now()
      }
    });
  };

  const handleSubscribeToOrder = () => {
    if (testOrderId.trim()) {
      subscribeToOrderUpdates(testOrderId.trim());
      setMessages(prev => [...prev, { 
        type: 'Subscription', 
        data: { orderId: testOrderId.trim() }, 
        timestamp: new Date() 
      }]);
    }
  };

  const simulateOrderUpdate = () => {
    // محاكاة تحديث حالة الطلب
    const orderUpdate = {
      id: testOrderId,
      status: 'shipped',
      statusText: 'في الطريق',
      driverName: 'أحمد محمد',
      driverPhone: '+20123456789',
      estimatedDelivery: '2 ساعة'
    };

    // بث الحدث محلياً للاختبار
    window.dispatchEvent(new CustomEvent('orderStatusUpdate', {
      detail: orderUpdate
    }));
  };

  const simulateDriverLocation = () => {
    // محاكاة تحديث موقع الكابتن
    const locationUpdate = {
      latitude: 30.0444 + (Math.random() - 0.5) * 0.01,
      longitude: 31.2357 + (Math.random() - 0.5) * 0.01,
      timestamp: Date.now(),
      driverId: 'driver-123'
    };

    window.dispatchEvent(new CustomEvent('driverLocationUpdate', {
      detail: locationUpdate
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {state.isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            WebSocket Testing Dashboard
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* حالة الاتصال */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">حالة الاتصال:</span>
                <Badge variant={state.isConnected ? "default" : "destructive"}>
                  {state.isConnected ? 'متصل' : state.isConnecting ? 'جاري الاتصال...' : 'غير متصل'}
                </Badge>
              </div>
              {state.connectionId && (
                <p className="text-xs text-gray-600">Connection ID: {state.connectionId}</p>
              )}
              {state.lastPing && (
                <p className="text-xs text-gray-600">
                  آخر ping: {new Date(state.lastPing).toLocaleTimeString('ar-EG')}
                </p>
              )}
            </div>
            
            {!state.isConnected && (
              <Button onClick={reconnect} size="sm">
                إعادة الاتصال
              </Button>
            )}
          </div>

          {/* اختبار الرسائل */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  إرسال رسالة اختبار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSendTestMessage}
                  disabled={!state.isConnected}
                  className="w-full"
                >
                  إرسال رسالة اختبار
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  الاشتراك في طلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="رقم الطلب"
                  value={testOrderId}
                  onChange={(e) => setTestOrderId(e.target.value)}
                />
                <Button 
                  onClick={handleSubscribeToOrder}
                  disabled={!state.isConnected || !testOrderId.trim()}
                  className="w-full"
                >
                  الاشتراك في التحديثات
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* محاكاة الأحداث */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">محاكاة الأحداث</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={simulateOrderUpdate}
                  variant="outline"
                  size="sm"
                >
                  <Package className="h-3 w-3 mr-2" />
                  محاكاة تحديث الطلب
                </Button>
                
                <Button 
                  onClick={simulateDriverLocation}
                  variant="outline"
                  size="sm"
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  محاكاة موقع الكابتن
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* سجل الرسائل */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            سجل الرسائل المستلمة ({messages.length})
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                لا توجد رسائل بعد. جرب إرسال رسالة اختبار أو محاكاة حدث.
              </p>
            ) : (
              messages
                .slice()
                .reverse()
                .map((message, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 p-3 rounded border-l-4 border-blue-500"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="outline" className="text-xs">
                        {message.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString('ar-EG')}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(message.data, null, 2)}
                    </pre>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}