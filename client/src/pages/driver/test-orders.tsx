import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DriverTestOrders() {
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب البيانات بشكل مبسط
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching driver data...');
      
      // جلب الإشعارات
      const notificationsResponse = await fetch('/api/driver/notifications');
      const notificationsData = await notificationsResponse.json();
      console.log('📱 Notifications:', notificationsData);
      setNotifications(notificationsData || []);
      
      // جلب الطلبات
      const ordersResponse = await fetch('/api/driver/orders');
      const ordersData = await ordersResponse.json();
      console.log('📦 Orders:', ordersData);
      setOrders(ordersData || []);
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchData();
    
    // تحديث كل 3 ثوان
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // قبول الطلب
  const acceptOrder = async (orderId) => {
    try {
      console.log('✅ Accepting order:', orderId);
      const response = await fetch(`/api/driver/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      console.log('Accept result:', result);
      
      if (result.success) {
        alert('✅ تم قبول الطلب بنجاح!');
        fetchData(); // إعادة تحميل البيانات
      } else {
        alert('❌ فشل قبول الطلب: ' + result.error);
      }
    } catch (err) {
      console.error('❌ Error accepting order:', err);
      alert('❌ خطأ في قبول الطلب');
    }
  };

  // رفض الطلب
  const rejectOrder = async (orderId) => {
    try {
      console.log('❌ Rejecting order:', orderId);
      const response = await fetch(`/api/driver/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      console.log('Reject result:', result);
      
      if (result.success) {
        alert('❌ تم رفض الطلب');
        fetchData(); // إعادة تحميل البيانات
      } else {
        alert('❌ فشل رفض الطلب: ' + result.error);
      }
    } catch (err) {
      console.error('❌ Error rejecting order:', err);
      alert('❌ خطأ في رفض الطلب');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 p-6 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 p-6 flex items-center justify-center" dir="rtl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-bold text-red-600 mb-4">خطأ في تحميل البيانات</h2>
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchData} className="bg-red-600 hover:bg-red-700 text-white">
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* الترويسة */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-red-600 bg-clip-text text-transparent mb-4">
            اختبار نظام السائقين
          </h1>
          <Button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white">
            تحديث البيانات
          </Button>
        </div>

        {/* الإشعارات الجديدة */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">الإشعارات الجديدة ({notifications.length})</h2>
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">لا توجد إشعارات جديدة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{notification.title}</span>
                      <Badge variant="destructive">جديد</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{notification.message}</p>
                    {notification.orderId && (
                      <div className="flex gap-4">
                        <Button 
                          onClick={() => acceptOrder(notification.orderId)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          قبول الطلب
                        </Button>
                        <Button 
                          onClick={() => rejectOrder(notification.orderId)}
                          variant="destructive"
                        >
                          رفض الطلب
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* الطلبات المقبولة */}
        <div>
          <h2 className="text-2xl font-bold mb-4">طلباتي المقبولة ({orders.length})</h2>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">لا توجد طلبات مقبولة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <CardTitle>طلب رقم {order.orderNumber || order.id}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>الحالة:</strong> {order.status}</p>
                    <p><strong>التاريخ:</strong> {new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* معلومات للمطورين */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-2">معلومات فنية:</h3>
          <p>عدد الإشعارات: {notifications.length}</p>
          <p>عدد الطلبات: {orders.length}</p>
          <p>آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}</p>
        </div>
      </div>
    </div>
  );
}