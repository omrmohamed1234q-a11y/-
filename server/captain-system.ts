// نظام الكباتن المتكامل - مثل أمازون
import { Express } from 'express';
import { WebSocket } from 'ws';

// تعريف أنواع البيانات
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
  currentLocation?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
    timestamp: string;
  };
  status: 'online' | 'offline' | 'busy' | 'on_delivery';
  rating: number;
  totalDeliveries: number;
  isAvailable: boolean;
}

// خريطة الكباتن المتصلين
const connectedCaptains = new Map<string, WebSocket>();
const captainOrders = new Map<string, CaptainOrder[]>(); // captainId -> orders
const orderAssignments = new Map<string, string>(); // orderId -> captainId

export function setupCaptainSystem(app: Express, storage: any, wsClients: Map<string, WebSocket>) {
  
  console.log('🚛 تهيئة نظام الكباتن المتكامل...');

  // === API للكباتن ===

  // تسجيل دخول الكبتن
  app.post('/api/captain/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'اسم المستخدم وكلمة المرور مطلوبان'
        });
      }

      // البحث عن الكبتن في قاعدة البيانات
      const captains = await storage.getAllDrivers();
      const captain = captains.find((c: any) => 
        c.username === username || c.email === username
      );

      if (!captain || captain.password !== password) {
        return res.status(401).json({
          success: false,
          error: 'بيانات تسجيل الدخول غير صحيحة'
        });
      }

      // إنتاج رمز الجلسة
      const sessionToken = `captain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ كبتن ${captain.name} سجل دخول بنجاح`);

      res.json({
        success: true,
        captain: {
          id: captain.id,
          name: captain.name,
          phone: captain.phone,
          email: captain.email,
          vehicleType: captain.vehicleType,
          vehicleNumber: captain.vehicleNumber,
          rating: captain.rating || 4.5,
          totalDeliveries: captain.totalDeliveries || 0
        },
        sessionToken
      });

    } catch (error) {
      console.error('❌ خطأ في تسجيل دخول الكبتن:', error);
      res.status(500).json({
        success: false,
        error: 'خطأ في الخادم'
      });
    }
  });

  // جلب الطلبات المتاحة للكبتن
  app.get('/api/captain/:captainId/available-orders', async (req, res) => {
    try {
      const { captainId } = req.params;
      
      // جلب جميع الطلبات الجاهزة للتوصيل
      const allOrders = await storage.getAllOrders();
      const availableOrders = allOrders.filter((order: any) => 
        order.status === 'ready' || order.status === 'assigned_to_driver'
      );

      // تحويل الطلبات إلى تنسيق الكبتن
      const captainOrders: CaptainOrder[] = availableOrders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber || order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        deliveryCoordinates: order.deliveryCoordinates,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod || 'cash',
        items: order.items || [],
        timeline: order.timeline || [],
        estimatedDelivery: order.estimatedDelivery,
        specialInstructions: order.specialInstructions,
        priority: order.priority || 'normal',
        invoice: generateInvoiceData(order)
      }));

      res.json({
        success: true,
        orders: captainOrders,
        count: captainOrders.length
      });

    } catch (error) {
      console.error('❌ خطأ في جلب الطلبات المتاحة:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في جلب الطلبات'
      });
    }
  });

  // قبول طلب من قبل الكبتن
  app.post('/api/captain/:captainId/accept-order/:orderId', async (req, res) => {
    try {
      const { captainId, orderId } = req.params;
      
      // التحقق من وجود الطلب
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'الطلب غير موجود'
        });
      }

      // التحقق من حالة الطلب
      if (order.status !== 'ready' && order.status !== 'assigned_to_driver') {
        return res.status(400).json({
          success: false,
          error: 'الطلب غير متاح للقبول'
        });
      }

      // جلب بيانات الكبتن
      const captain = await storage.getDriver(captainId);
      if (!captain) {
        return res.status(404).json({
          success: false,
          error: 'الكبتن غير موجود'
        });
      }

      // تحديث الطلب وتعيين الكبتن
      await storage.assignOrderToDriver(orderId, captainId);
      await storage.updateOrderStatus(orderId, 'picked_up');

      // تسجيل في التاريخ الزمني
      const timelineEvent = {
        timestamp: new Date().toISOString(),
        status: 'picked_up',
        description: `تم قبول الطلب من الكبتن ${captain.name}`,
        location: 'مركز التوزيع'
      };

      await storage.addOrderTimelineEvent(orderId, timelineEvent);

      // تحديث خريطة التعيينات
      orderAssignments.set(orderId, captainId);

      // إشعار الإدارة
      await storage.createNotification({
        userId: 'admin',
        title: '✅ تم قبول الطلب',
        message: `الكبتن ${captain.name} قبل طلب رقم ${order.orderNumber}`,
        type: 'order_accepted',
        priority: 'normal',
        isRead: false
      });

      // إشعار العميل
      await storage.createNotification({
        userId: order.userId,
        title: '🚛 الكبتن في الطريق',
        message: `الكبتن ${captain.name} قبل طلبك وهو في الطريق إليك`,
        type: 'order_update',
        priority: 'normal',
        isRead: false
      });

      console.log(`🎉 الكبتن ${captain.name} قبل الطلب ${orderId}`);

      res.json({
        success: true,
        message: 'تم قبول الطلب بنجاح',
        order: {
          ...order,
          assignedCaptain: {
            id: captain.id,
            name: captain.name,
            phone: captain.phone,
            vehicleType: captain.vehicleType
          }
        }
      });

    } catch (error) {
      console.error('❌ خطأ في قبول الطلب:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في قبول الطلب'
      });
    }
  });

  // تحديث موقع الكبتن
  app.post('/api/captain/:captainId/location', async (req, res) => {
    try {
      const { captainId } = req.params;
      const { lat, lng, heading, speed, accuracy } = req.body;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: 'إحداثيات الموقع مطلوبة'
        });
      }

      const locationData = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        heading: heading ? parseFloat(heading) : undefined,
        speed: speed ? parseFloat(speed) : undefined,
        accuracy: accuracy ? parseFloat(accuracy) : undefined,
        timestamp: new Date().toISOString()
      };

      // تحديث موقع الكبتن في قاعدة البيانات
      await storage.updateDriverLocation(captainId, locationData);

      // إشعار العملاء المتابعين لهذا الكبتن
      const captainOrders = await storage.getOrdersByCaptain(captainId);
      for (const order of captainOrders) {
        if (order.status === 'picked_up' || order.status === 'in_transit') {
          // إشعار العميل بالموقع الجديد عبر WebSocket
          const customerWs = wsClients.get(order.userId);
          if (customerWs && customerWs.readyState === WebSocket.OPEN) {
            customerWs.send(JSON.stringify({
              type: 'captain_location_update',
              orderId: order.id,
              location: locationData,
              captainName: (await storage.getDriver(captainId))?.name
            }));
          }
        }
      }

      res.json({
        success: true,
        message: 'تم تحديث الموقع بنجاح'
      });

    } catch (error) {
      console.error('❌ خطأ في تحديث موقع الكبتن:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في تحديث الموقع'
      });
    }
  });

  // تحديث حالة الطلب من الكبتن
  app.post('/api/captain/:captainId/order/:orderId/status', async (req, res) => {
    try {
      const { captainId, orderId } = req.params;
      const { status, notes, location } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'حالة الطلب مطلوبة'
        });
      }

      // التحقق من ملكية الطلب
      const assignedCaptain = orderAssignments.get(orderId);
      if (assignedCaptain !== captainId) {
        return res.status(403).json({
          success: false,
          error: 'غير مخول لتحديث هذا الطلب'
        });
      }

      const captain = await storage.getDriver(captainId);
      const order = await storage.getOrder(orderId);

      // تحديث حالة الطلب
      await storage.updateOrderStatus(orderId, status);

      // إضافة حدث في التاريخ الزمني
      const timelineEvent = {
        timestamp: new Date().toISOString(),
        status,
        description: getStatusDescription(status),
        location: location || 'غير محدد',
        notes: notes || undefined
      };

      await storage.addOrderTimelineEvent(orderId, timelineEvent);

      // إشعارات مختلفة حسب الحالة
      let notificationTitle = '';
      let notificationMessage = '';

      switch (status) {
        case 'in_transit':
          notificationTitle = '🚛 الكبتن في الطريق';
          notificationMessage = `الكبتن ${captain.name} في الطريق إليك`;
          break;
        case 'arrived':
          notificationTitle = '📍 الكبتن وصل';
          notificationMessage = `الكبتن ${captain.name} وصل إلى موقعك`;
          break;
        case 'delivered':
          notificationTitle = '✅ تم التسليم';
          notificationMessage = `تم تسليم طلبك بنجاح`;
          // إزالة من خريطة التعيينات
          orderAssignments.delete(orderId);
          break;
      }

      // إشعار العميل
      if (notificationTitle) {
        await storage.createNotification({
          userId: order.userId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'order_update',
          priority: status === 'delivered' ? 'high' : 'normal',
          isRead: false
        });

        // إشعار مباشر عبر WebSocket
        const customerWs = wsClients.get(order.userId);
        if (customerWs && customerWs.readyState === WebSocket.OPEN) {
          customerWs.send(JSON.stringify({
            type: 'order_status_update',
            orderId,
            status,
            message: notificationMessage,
            captain: {
              name: captain.name,
              phone: captain.phone
            },
            timeline: timelineEvent
          }));
        }
      }

      console.log(`📱 تحديث حالة الطلب ${orderId} إلى ${status} بواسطة ${captain.name}`);

      res.json({
        success: true,
        message: 'تم تحديث حالة الطلب بنجاح',
        order: {
          id: orderId,
          status,
          timeline: timelineEvent
        }
      });

    } catch (error) {
      console.error('❌ خطأ في تحديث حالة الطلب:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في تحديث حالة الطلب'
      });
    }
  });

  // === API للإدارة ===

  // إرسال طلب للكباتن المتاحين (تحديث للنظام الموجود)
  app.post('/api/admin/orders/:orderId/assign-to-captains', async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'الطلب غير موجود'
        });
      }

      // جلب الكباتن المتاحين
      const allCaptains = await storage.getAllDrivers();
      const availableCaptains = allCaptains.filter((captain: any) => 
        captain.status === 'online' && captain.isAvailable === true
      );

      if (availableCaptains.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'لا يوجد كباتن متاحين حالياً'
        });
      }

      // تحديث حالة الطلب
      await storage.updateOrderStatus(orderId, 'assigned_to_driver');

      // إرسال إشعارات للكباتن المتاحين
      const notifications = availableCaptains.map(async (captain: any) => {
        await storage.createNotification({
          userId: captain.id,
          title: '🚚 طلب توصيل جديد',
          message: `طلب جديد متاح للتوصيل رقم ${order.orderNumber}`,
          type: 'new_order',
          priority: 'urgent',
          isRead: false,
          orderId,
          expiresAt: new Date(Date.now() + 300000) // 5 دقائق
        });

        // إشعار مباشر عبر WebSocket للكباتن المتصلين
        const captainWs = connectedCaptains.get(captain.id);
        if (captainWs && captainWs.readyState === WebSocket.OPEN) {
          captainWs.send(JSON.stringify({
            type: 'new_order_available',
            order: {
              id: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              deliveryAddress: order.deliveryAddress,
              totalAmount: order.totalAmount,
              priority: order.priority || 'normal'
            }
          }));
        }
      });

      await Promise.all(notifications);

      console.log(`📢 تم إرسال الطلب ${orderId} لـ ${availableCaptains.length} كباتن`);

      res.json({
        success: true,
        message: `تم إرسال الطلب لـ ${availableCaptains.length} كباتن`,
        availableCaptains: availableCaptains.length
      });

    } catch (error) {
      console.error('❌ خطأ في إرسال الطلب للكباتن:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إرسال الطلب للكباتن'
      });
    }
  });

  console.log('✅ تم تهيئة نظام الكباتن المتكامل بنجاح');
}

// وظائف مساعدة
function generateInvoiceData(order: any) {
  return {
    invoiceNumber: `INV-${order.orderNumber || order.id}`,
    issueDate: order.createdAt || new Date().toISOString(),
    dueDate: order.estimatedDelivery || new Date().toISOString(),
    items: (order.items || []).map((item: any) => ({
      description: item.name || item.description,
      quantity: item.quantity || 1,
      unitPrice: item.price || 0,
      total: (item.quantity || 1) * (item.price || 0)
    })),
    subtotal: order.subtotal || order.totalAmount,
    tax: order.tax || 0,
    total: order.totalAmount
  };
}

function getStatusDescription(status: string): string {
  const statusMap: { [key: string]: string } = {
    'picked_up': 'تم استلام الطلب من المركز',
    'in_transit': 'الكبتن في الطريق للتسليم',
    'arrived': 'الكبتن وصل إلى موقع التسليم',
    'delivered': 'تم تسليم الطلب بنجاح',
    'failed': 'فشل في التسليم',
    'returned': 'تم إرجاع الطلب'
  };
  
  return statusMap[status] || 'تحديث حالة الطلب';
}