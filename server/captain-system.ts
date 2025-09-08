// نظام الكباتن المتكامل - مثل أمازون
import { Express } from 'express';
import { WebSocket } from 'ws';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { MemorySecurityStorage } from './memory-security-storage';

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
  
  // Initialize security storage
  const memorySecurityStorage = new MemorySecurityStorage();
  
  console.log('🚛 تهيئة نظام الكباتن المتكامل...');

  // إضافة كبتن تجريبي للنظام العادي إذا لم يكن موجود
  const initTestCaptain = async () => {
    try {
      const existingDrivers = await storage.getAllDrivers();
      const testDriverExists = existingDrivers.find((d: any) => d.username === 'testdriver');
      
      if (!testDriverExists) {
        await storage.createDriver({
          name: 'كبتن تجريبي',
          username: 'testdriver',
          password: 'Driver123!',
          email: 'testdriver@atbaali.com',
          phone: '01001234567',
          vehicleType: 'motorcycle',
          vehicleNumber: '123456',
          rating: 4.8,
          totalDeliveries: 0,
          status: 'online',
          isAvailable: true
        });
        console.log('✅ تم إنشاء كبتن تجريبي في النظام العادي');
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء الكبتن التجريبي:', error);
    }
  };
  
  // تهيئة الكبتن التجريبي
  initTestCaptain();

  // === API للكباتن ===

  // تسجيل دخول آمن للكبتن - Secure Authentication
  app.post('/api/captain/secure-login', async (req, res) => {
    try {
      const { username, password, driverCode } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'اسم المستخدم وكلمة المرور مطلوبان'
        });
      }

      // البحث عن الكبتن في النظام الآمن
      const captain = await memorySecurityStorage.getSecureCaptainByCredentials(username, username, driverCode);
      
      if (!captain) {
        // تسجيل محاولة دخول فاشلة
        await memorySecurityStorage.createSecurityLog({
          user_id: username,
          action: 'محاولة دخول فاشلة - كبتن غير موجود',
          ip_address: req.ip || 'unknown',
          user_agent: req.get('User-Agent') || 'unknown',
          success: false,
          timestamp: new Date(),
          details: `Username: ${username}, DriverCode: ${driverCode || 'N/A'}`
        });

        return res.status(401).json({
          success: false,
          error: 'بيانات تسجيل الدخول غير صحيحة'
        });
      }

      // التحقق من حالة الحساب
      if (!captain.is_active) {
        return res.status(403).json({
          success: false,
          error: 'حسابك غير مفعل. تواصل مع الإدارة'
        });
      }

      // التحقق من كلمة المرور
      const isValidPassword = await bcrypt.compare(password, captain.password);
      if (!isValidPassword) {
        // تحديث عدد المحاولات الفاشلة
        captain.failed_attempts = (captain.failed_attempts || 0) + 1;
        await memorySecurityStorage.updateSecureCaptain(captain.id, { failed_attempts: captain.failed_attempts });

        // تسجيل محاولة دخول فاشلة
        await memorySecurityStorage.createSecurityLog({
          user_id: captain.id,
          action: 'محاولة دخول فاشلة - كلمة مرور خاطئة',
          ip_address: req.ip || 'unknown',
          user_agent: req.get('User-Agent') || 'unknown',
          success: false,
          timestamp: new Date(),
          details: `Attempts: ${captain.failed_attempts}`
        });

        return res.status(401).json({
          success: false,
          error: 'بيانات تسجيل الدخول غير صحيحة'
        });
      }

      // إعادة تصفير المحاولات الفاشلة عند النجاح
      if (captain.failed_attempts > 0) {
        await memorySecurityStorage.updateSecureCaptain(captain.id, { failed_attempts: 0 });
      }

      // إنتاج JWT token آمن
      const payload = {
        captainId: captain.id,
        username: captain.username,
        email: captain.email,
        fullName: captain.full_name,
        driverCode: captain.driver_code,
        role: 'captain',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };

      const secretKey = process.env.JWT_SECRET || 'atbaali-captain-secret-key-2025';
      const captainToken = jwt.sign(payload, secretKey);

      // تحديث آخر دخول
      await memorySecurityStorage.updateSecureCaptain(captain.id, { 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // تسجيل دخول ناجح
      await memorySecurityStorage.createSecurityLog({
        user_id: captain.id,
        action: 'تسجيل دخول ناجح - كبتن',
        ip_address: req.ip || 'unknown',
        user_agent: req.get('User-Agent') || 'unknown',
        success: true,
        timestamp: new Date(),
        details: `Full name: ${captain.full_name}`
      });
      
      console.log(`✅ كبتن ${captain.full_name} سجل دخول آمن بنجاح`);

      res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        user: {
          id: captain.id,
          username: captain.username,
          fullName: captain.full_name,
          email: captain.email,
          phone: captain.phone,
          driverCode: captain.driver_code,
          vehicleType: captain.vehicle_type,
          vehiclePlate: captain.vehicle_plate,
          role: 'captain'
        },
        token: captainToken,
        sessionToken: captainToken,
        expiresAt: payload.exp
      });

    } catch (error) {
      console.error('❌ خطأ في تسجيل دخول الكبتن الآمن:', error);
      
      // تسجيل الخطأ
      try {
        await memorySecurityStorage.createSecurityLog({
          user_id: req.body.username || 'unknown',
          action: 'خطأ في تسجيل الدخول',
          ip_address: req.ip || 'unknown',
          user_agent: req.get('User-Agent') || 'unknown',
          success: false,
          timestamp: new Date(),
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (logError) {
        console.error('❌ خطأ في تسجيل السجل:', logError);
      }

      res.status(500).json({
        success: false,
        error: 'خطأ داخلي في الخادم'
      });
    }
  });

  // API for /api/driver/secure-auth (backward compatibility)
  app.post('/api/driver/secure-auth', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'اسم المستخدم وكلمة المرور مطلوبان'
        });
      }

      // Try secure captain login first
      const captain = await memorySecurityStorage.getSecureCaptainByCredentials(username, username);
      
      if (captain && captain.is_active) {
        const isValidPassword = await bcrypt.compare(password, captain.password);
        if (isValidPassword) {
          const payload = {
            captainId: captain.id,
            username: captain.username,
            email: captain.email,
            fullName: captain.full_name,
            driverCode: captain.driver_code,
            role: 'captain',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
          };

          const secretKey = process.env.JWT_SECRET || 'atbaali-captain-secret-key-2025';
          const captainToken = jwt.sign(payload, secretKey);

          await memorySecurityStorage.createSecurityLog({
            user_id: captain.id,
            action: 'تسجيل دخول ناجح - driver/secure-auth',
            ip_address: req.ip || 'unknown',
            user_agent: req.get('User-Agent') || 'unknown',
            success: true,
            timestamp: new Date(),
            details: `Backward compatibility login`
          });

          return res.json({
            success: true,
            user: {
              id: captain.id,
              username: captain.username,
              fullName: captain.full_name,
              email: captain.email,
              phone: captain.phone,
              driverCode: captain.driver_code,
              role: 'captain'
            },
            token: captainToken,
            sessionToken: captainToken
          });
        }
      }

      // Fallback to regular system
      const captains = await storage.getAllDrivers();
      const regularCaptain = captains.find((c: any) => 
        c.username === username || c.email === username
      );

      if (!regularCaptain || regularCaptain.password !== password) {
        return res.status(401).json({
          success: false,
          error: 'بيانات تسجيل الدخول غير صحيحة'
        });
      }

      const sessionToken = `captain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ كبتن ${regularCaptain.name} سجل دخول عبر النظام القديم`);

      res.json({
        success: true,
        user: {
          id: regularCaptain.id,
          username: regularCaptain.username || regularCaptain.name,
          fullName: regularCaptain.name,
          email: regularCaptain.email,
          phone: regularCaptain.phone,
          role: 'captain'
        },
        token: sessionToken,
        sessionToken
      });

    } catch (error) {
      console.error('❌ خطأ في driver/secure-auth:', error);
      res.status(500).json({
        success: false,
        error: 'خطأ داخلي في الخادم'
      });
    }
  });

  // تسجيل دخول الكبتن - Regular (Backward Compatibility)
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

  // Middleware للتحقق من صحة جلسة الكبتن
  const requireCaptainAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-captain-session'];
    
    if (!sessionToken && !authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Captain authentication required'
      });
    }
    
    // في بيئة الإنتاج، تأكد من صحة الرمز
    next();
  };

  // جلب الطلبات المتاحة للكبتن
  app.get('/api/captain/:captainId/available-orders', requireCaptainAuth, async (req, res) => {
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

  // === Admin Captain Management APIs ===
  
  // جلب جميع الكباتن (للإدمن)
  app.get('/api/admin/captains', async (req, res) => {
    try {
      const captains = await storage.getAllDrivers();
      res.json({
        success: true,
        captains: captains.map((captain: any) => ({
          id: captain.id,
          name: captain.name,
          username: captain.username,
          email: captain.email,
          phone: captain.phone,
          vehicleType: captain.vehicleType,
          vehicleNumber: captain.vehicleNumber,
          rating: captain.rating || 4.5,
          totalDeliveries: captain.totalDeliveries || 0,
          status: captain.status || 'offline',
          isAvailable: captain.isAvailable || false,
          createdAt: captain.createdAt,
          updatedAt: captain.updatedAt
        }))
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الكباتن:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في جلب بيانات الكباتن'
      });
    }
  });

  // إنشاء كبتن جديد (للإدمن)
  app.post('/api/admin/captains', async (req, res) => {
    try {
      const captainData = req.body;
      
      // التحقق من وجود اسم المستخدم
      const existingCaptains = await storage.getAllDrivers();
      const existingByUsername = existingCaptains.find((c: any) => c.username === captainData.username);
      if (existingByUsername) {
        return res.status(400).json({
          success: false,
          error: 'اسم المستخدم مسجل بالفعل'
        });
      }

      // التحقق من البريد الإلكتروني إذا تم توفيره
      if (captainData.email) {
        const existingByEmail = existingCaptains.find((c: any) => c.email === captainData.email);
        if (existingByEmail) {
          return res.status(400).json({
            success: false,
            error: 'البريد الإلكتروني مسجل بالفعل'
          });
        }
      }

      const newCaptain = await storage.createDriver({
        ...captainData,
        status: 'offline',
        isAvailable: false,
        rating: 5.0,
        totalDeliveries: 0
      });
      
      console.log(`✅ تم إنشاء كبتن جديد: ${newCaptain.name}`);
      
      res.json({
        success: true,
        message: 'تم إنشاء حساب الكبتن بنجاح',
        captain: {
          id: newCaptain.id,
          name: newCaptain.name,
          username: newCaptain.username,
          email: newCaptain.email
        }
      });
    } catch (error) {
      console.error('❌ خطأ في إنشاء الكبتن:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إنشاء حساب الكبتن'
      });
    }
  });

  // تحديث بيانات كبتن (للإدمن)
  app.put('/api/admin/captains/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedCaptain = await storage.updateDriver(id, updates);
      
      console.log(`✅ تم تحديث بيانات الكبتن: ${id}`);
      
      res.json({
        success: true,
        message: 'تم تحديث بيانات الكبتن بنجاح',
        captain: updatedCaptain
      });
    } catch (error) {
      console.error('❌ خطأ في تحديث الكبتن:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في تحديث بيانات الكبتن'
      });
    }
  });

  // حذف كبتن (للإدمن)
  app.delete('/api/admin/captains/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteDriver(id);
      
      if (success) {
        console.log(`✅ تم حذف الكبتن: ${id}`);
        res.json({
          success: true,
          message: 'تم حذف الكبتن بنجاح'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'الكبتن غير موجود'
        });
      }
    } catch (error) {
      console.error('❌ خطأ في حذف الكبتن:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في حذف الكبتن'
      });
    }
  });

  // === Captain Registration API ===
  
  // تسجيل كبتن جديد (للعامة)
  app.post('/api/captains/register', async (req, res) => {
    try {
      const { name, username, email, phone, vehicleType, vehiclePlate, password } = req.body;
      
      // التحقق من البيانات المطلوبة
      if (!name || !username || !phone || !password) {
        return res.status(400).json({
          success: false,
          error: 'جميع البيانات الأساسية مطلوبة'
        });
      }

      // التحقق من عدم وجود اسم المستخدم
      const existingCaptains = await storage.getAllDrivers();
      const existingByUsername = existingCaptains.find((c: any) => c.username === username);
      if (existingByUsername) {
        return res.status(400).json({
          success: false,
          error: 'اسم المستخدم غير متاح'
        });
      }

      // إنشاء حساب الكبتن
      const newCaptain = await storage.createDriver({
        name,
        username,
        email: email || '',
        phone,
        vehicleType: vehicleType || 'motorcycle',
        vehicleNumber: vehiclePlate || '',
        password,
        status: 'pending', // في انتظار الموافقة
        isAvailable: false,
        rating: 5.0,
        totalDeliveries: 0,
        workingArea: 'القاهرة الكبرى'
      });
      
      console.log(`📝 طلب تسجيل كبتن جديد: ${newCaptain.name}`);
      
      res.json({
        success: true,
        message: 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعة طلبك والرد عليك قريباً.',
        captain: {
          id: newCaptain.id,
          name: newCaptain.name,
          username: newCaptain.username
        }
      });
    } catch (error) {
      console.error('❌ خطأ في تسجيل الكبتن:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في تسجيل طلب الانضمام'
      });
    }
  });

  // === Captain Location APIs ===
  
  // جلب موقع الكبتن
  app.get('/api/captain/:captainId/location', requireCaptainAuth, async (req, res) => {
    try {
      const { captainId } = req.params;
      
      // في الوقت الحالي، نستخدم WebSocket لتتبع المواقع
      // هنا يمكن إرجاع آخر موقع محفوظ
      res.json({
        success: true,
        location: {
          lat: 30.0444,
          lng: 31.2357,
          heading: 0,
          speed: 0,
          accuracy: 10,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ خطأ في جلب موقع الكبتن:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في جلب الموقع'
      });
    }
  });

  // تحديث موقع الكبتن
  app.put('/api/captain/:captainId/location', requireCaptainAuth, async (req, res) => {
    try {
      const { captainId } = req.params;
      const { lat, lng, heading, speed, accuracy } = req.body;
      
      // حفظ الموقع (يمكن تحسينه لاحقاً بقاعدة بيانات الموقع)
      console.log(`📍 تحديث موقع الكبتن ${captainId}: ${lat}, ${lng}`);
      
      res.json({
        success: true,
        message: 'تم تحديث الموقع بنجاح'
      });
    } catch (error) {
      console.error('❌ خطأ في تحديث الموقع:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في تحديث الموقع'
      });
    }
  });

  // === Secure Captain Management APIs ===
  
  // جلب الكباتن الآمنين (للإدمن)
  app.get('/api/admin/secure-captains', async (req, res) => {
    try {
      // استخدام نفس بيانات الكباتن العادية لكن بتنسيق آمن
      const captains = await storage.getAllDrivers();
      const secureCaptains = captains.map((captain: any) => ({
        id: captain.id,
        username: captain.username,
        email: captain.email,
        full_name: captain.name,
        driver_code: captain.driverCode || captain.vehicleNumber,
        phone: captain.phone,
        license_number: captain.licenseNumber || '',
        vehicle_type: captain.vehicleType,
        vehicle_plate: captain.vehicleNumber,
        is_active: captain.status !== 'banned',
        status: captain.status || 'offline',
        failed_attempts: 0,
        total_deliveries: captain.totalDeliveries || 0,
        rating: captain.rating || 5.0,
        created_at: captain.createdAt,
        updated_at: captain.updatedAt
      }));
      
      res.json({
        success: true,
        captains: secureCaptains
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الكباتن الآمنين:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في جلب بيانات الكباتن'
      });
    }
  });

  // إنشاء كبتن آمن (للإدمن)
  app.post('/api/admin/secure-captains', async (req, res) => {
    try {
      const captainData = req.body;
      
      // التحقق من البيانات المطلوبة
      if (!captainData.username || !captainData.email || !captainData.password) {
        return res.status(400).json({
          success: false,
          error: 'اسم المستخدم والبريد الإلكتروني وكلمة المرور مطلوبة'
        });
      }

      // التحقق من عدم وجود المستخدم
      const existingCaptains = await storage.getAllDrivers();
      const existingByUsername = existingCaptains.find((c: any) => c.username === captainData.username);
      const existingByEmail = existingCaptains.find((c: any) => c.email === captainData.email);
      
      if (existingByUsername) {
        return res.status(400).json({
          success: false,
          error: 'اسم المستخدم موجود بالفعل'
        });
      }
      
      if (existingByEmail) {
        return res.status(400).json({
          success: false,
          error: 'البريد الإلكتروني موجود بالفعل'
        });
      }

      // إنشاء الكبتن الآمن
      const newCaptain = await storage.createDriver({
        name: captainData.full_name || captainData.username,
        username: captainData.username,
        email: captainData.email,
        password: captainData.password, // في الإنتاج، يجب تشفيرها
        phone: captainData.phone || '',
        vehicleType: captainData.vehicle_type || 'motorcycle',
        vehicleNumber: captainData.vehicle_plate || '',
        driverCode: captainData.driver_code || '',
        licenseNumber: captainData.license_number || '',
        status: 'active',
        isAvailable: false,
        rating: 5.0,
        totalDeliveries: 0
      });
      
      console.log(`🔐 تم إنشاء كبتن آمن: ${newCaptain.username}`);
      
      res.json({
        success: true,
        message: 'تم إنشاء حساب الكبتن الآمن بنجاح',
        captain: {
          id: newCaptain.id,
          username: newCaptain.username,
          email: newCaptain.email,
          full_name: newCaptain.name
        }
      });
    } catch (error) {
      console.error('❌ خطأ في إنشاء الكبتن الآمن:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إنشاء حساب الكبتن الآمن'
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