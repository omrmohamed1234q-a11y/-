// APIs الكابتن المحمية - إضافة جديدة لأنظمة الحماية المتقدمة
import { Express } from 'express';
import {
  updateLocationSchema,
  updateOrderStatusSchema,
  addOrderNoteSchema,
  captainApiLimiter,
  locationUpdateLimiter,
  verifyCaptainToken,
  verifyCaptainStatus,
  sanitizeInput,
  logCaptainActivity,
  validateOrderId,
  validateCoordinates,
  createSuccessResponse,
  createErrorResponse
} from './captain-protection';

export function setupProtectedCaptainAPIs(app: Express, storage: any) {
  
  // تحديث موقع الكابتن - محمي
  app.post('/api/captain/location/update',
    captainApiLimiter,
    locationUpdateLimiter, // حماية إضافية لتحديثات الموقع
    sanitizeInput,
    verifyCaptainToken,
    verifyCaptainStatus,
    logCaptainActivity('UPDATE_LOCATION'),
    async (req, res) => {
      try {
        // التحقق من صحة البيانات
        const validationResult = updateLocationSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json(createErrorResponse(
            'بيانات الموقع غير صحيحة',
            'LOCATION_VALIDATION_ERROR',
            validationResult.error.errors
          ));
        }

        const { lat, lng, heading, speed, accuracy } = validationResult.data;
        const captainId = req.captain.id;

        // التحقق الإضافي من صحة الإحداثيات
        if (!validateCoordinates(lat, lng)) {
          return res.status(400).json(createErrorResponse(
            'إحداثيات غير صحيحة',
            'INVALID_COORDINATES'
          ));
        }

        // تحديث موقع الكابتن في قاعدة البيانات
        const locationData = {
          lat,
          lng,
          heading: heading || 0,
          speed: speed || 0,
          accuracy: accuracy || 0,
          timestamp: new Date().toISOString()
        };

        await storage.updateDriverLocation(captainId, locationData);

        res.json(createSuccessResponse({
          location: locationData,
          captainId
        }, 'تم تحديث الموقع بنجاح'));

      } catch (error: any) {
        console.error('❌ خطأ في تحديث موقع الكابتن:', error);
        res.status(500).json(createErrorResponse(
          'خطأ في تحديث الموقع',
          'LOCATION_UPDATE_ERROR'
        ));
      }
    }
  );

  // تحديث حالة الطلب - محمي
  app.post('/api/captain/order/status',
    captainApiLimiter,
    sanitizeInput,
    verifyCaptainToken,
    verifyCaptainStatus,
    logCaptainActivity('UPDATE_ORDER_STATUS'),
    async (req, res) => {
      try {
        // التحقق من صحة البيانات
        const validationResult = updateOrderStatusSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json(createErrorResponse(
            'بيانات الطلب غير صحيحة',
            'ORDER_VALIDATION_ERROR',
            validationResult.error.errors
          ));
        }

        const { orderId, status, notes, location } = validationResult.data;
        const captainId = req.captain.id;

        // التحقق من صحة معرف الطلب
        if (!validateOrderId(orderId)) {
          return res.status(400).json(createErrorResponse(
            'معرف الطلب غير صحيح',
            'INVALID_ORDER_ID'
          ));
        }

        // التحقق من وجود الطلب
        const order = await storage.getOrder(orderId);
        if (!order) {
          return res.status(404).json(createErrorResponse(
            'الطلب غير موجود',
            'ORDER_NOT_FOUND'
          ));
        }

        // التحقق من أن الطلب مخصص لهذا الكابتن (حماية أمنية مهمة)
        if (order.assignedDriverId !== captainId && order.driverId !== captainId) {
          return res.status(403).json(createErrorResponse(
            'غير مخول لتعديل هذا الطلب',
            'UNAUTHORIZED_ORDER_ACCESS'
          ));
        }

        // تحديث حالة الطلب
        const updatedOrder = await storage.updateOrderStatus(orderId, status);

        // إضافة timeline event
        const timelineEvent = {
          timestamp: new Date().toISOString(),
          status,
          description: `تم تحديث حالة الطلب إلى: ${getStatusArabicName(status)}`,
          location: location ? `${location.lat}, ${location.lng}` : undefined,
          notes: notes || undefined,
          captainId
        };

        await storage.addOrderTimelineEvent(orderId, timelineEvent);

        // إضافة ملاحظة إذا وُجدت
        if (notes) {
          await storage.addDriverNote(orderId, notes);
        }

        res.json(createSuccessResponse({
          orderId,
          status,
          updatedOrder,
          timelineEvent
        }, 'تم تحديث حالة الطلب بنجاح'));

      } catch (error: any) {
        console.error('❌ خطأ في تحديث حالة الطلب:', error);
        res.status(500).json(createErrorResponse(
          'خطأ في تحديث حالة الطلب',
          'ORDER_STATUS_UPDATE_ERROR'
        ));
      }
    }
  );

  // إضافة ملاحظة للطلب - محمي
  app.post('/api/captain/order/note',
    captainApiLimiter,
    sanitizeInput,
    verifyCaptainToken,
    verifyCaptainStatus,
    logCaptainActivity('ADD_ORDER_NOTE'),
    async (req, res) => {
      try {
        // التحقق من صحة البيانات
        const validationResult = addOrderNoteSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json(createErrorResponse(
            'بيانات الملاحظة غير صحيحة',
            'NOTE_VALIDATION_ERROR',
            validationResult.error.errors
          ));
        }

        const { orderId, note } = validationResult.data;
        const captainId = req.captain.id;

        // التحقق من صحة معرف الطلب
        if (!validateOrderId(orderId)) {
          return res.status(400).json(createErrorResponse(
            'معرف الطلب غير صحيح',
            'INVALID_ORDER_ID'
          ));
        }

        // التحقق من وجود الطلب
        const order = await storage.getOrder(orderId);
        if (!order) {
          return res.status(404).json(createErrorResponse(
            'الطلب غير موجود',
            'ORDER_NOT_FOUND'
          ));
        }

        // التحقق من أن الطلب مخصص لهذا الكابتن (حماية أمنية مهمة)
        if (order.assignedDriverId !== captainId && order.driverId !== captainId) {
          return res.status(403).json(createErrorResponse(
            'غير مخول لإضافة ملاحظة لهذا الطلب',
            'UNAUTHORIZED_ORDER_ACCESS'
          ));
        }

        // إضافة الملاحظة
        await storage.addDriverNote(orderId, note);

        // إضافة timeline event للملاحظة
        const timelineEvent = {
          timestamp: new Date().toISOString(),
          status: 'note_added',
          description: 'أضاف الكابتن ملاحظة',
          notes: note,
          captainId
        };

        await storage.addOrderTimelineEvent(orderId, timelineEvent);

        res.json(createSuccessResponse({
          orderId,
          note,
          timelineEvent
        }, 'تم إضافة الملاحظة بنجاح'));

      } catch (error: any) {
        console.error('❌ خطأ في إضافة ملاحظة الطلب:', error);
        res.status(500).json(createErrorResponse(
          'خطأ في إضافة الملاحظة',
          'NOTE_ADD_ERROR'
        ));
      }
    }
  );

  // احصائيات الكابتن - محمي
  app.get('/api/captain/stats',
    captainApiLimiter,
    sanitizeInput,
    verifyCaptainToken,
    verifyCaptainStatus,
    logCaptainActivity('GET_STATS'),
    async (req, res) => {
      try {
        const captainId = req.captain.id;

        // جلب احصائيات الكابتن
        const orders = await storage.getDriverOrders(captainId);
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // فلترة الطلبات حسب التاريخ
        const todayOrders = orders.filter((order: any) => 
          new Date(order.createdAt || order.timeline?.[0]?.timestamp) >= todayStart
        );

        const completedOrders = orders.filter((order: any) => 
          order.status === 'delivered'
        );

        const todayCompletedOrders = todayOrders.filter((order: any) => 
          order.status === 'delivered'
        );

        // حساب الإحصائيات
        const stats = {
          dailyEarnings: todayCompletedOrders.reduce((sum: number, order: any) => 
            sum + (order.deliveryFee || 15), 0
          ),
          weeklyEarnings: completedOrders
            .filter((order: any) => {
              const orderDate = new Date(order.createdAt || order.timeline?.[0]?.timestamp);
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              return orderDate >= weekAgo;
            })
            .reduce((sum: number, order: any) => sum + (order.deliveryFee || 15), 0),
          monthlyEarnings: completedOrders
            .filter((order: any) => {
              const orderDate = new Date(order.createdAt || order.timeline?.[0]?.timestamp);
              return orderDate.getMonth() === today.getMonth() && 
                     orderDate.getFullYear() === today.getFullYear();
            })
            .reduce((sum: number, order: any) => sum + (order.deliveryFee || 15), 0),
          ordersToday: todayOrders.length,
          ordersWeek: orders.filter((order: any) => {
            const orderDate = new Date(order.createdAt || order.timeline?.[0]?.timestamp);
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          }).length,
          ordersMonth: orders.filter((order: any) => {
            const orderDate = new Date(order.createdAt || order.timeline?.[0]?.timestamp);
            return orderDate.getMonth() === today.getMonth() && 
                   orderDate.getFullYear() === today.getFullYear();
          }).length,
          totalDistance: completedOrders.reduce((sum: number, order: any) => 
            sum + (order.distance || 5), 0
          ),
          onlineTime: todayOrders.length * 30, // تقدير: 30 دقيقة لكل طلب
          completionRate: orders.length > 0 ? 
            Math.round((completedOrders.length / orders.length) * 100) : 100
        };

        res.json(createSuccessResponse(stats, 'تم جلب الإحصائيات بنجاح'));

      } catch (error: any) {
        console.error('❌ خطأ في جلب إحصائيات الكابتن:', error);
        res.status(500).json(createErrorResponse(
          'خطأ في جلب الإحصائيات',
          'STATS_ERROR'
        ));
      }
    }
  );

  // حالة الكابتن الحالية - محمي
  app.get('/api/captain/status',
    captainApiLimiter,
    sanitizeInput,
    verifyCaptainToken,
    logCaptainActivity('GET_STATUS'),
    async (req, res) => {
      try {
        const captainId = req.captain.id;

        // جلب معلومات الكابتن
        const captain = await storage.getDriver(captainId);
        if (!captain) {
          return res.status(404).json(createErrorResponse(
            'بيانات الكابتن غير موجودة',
            'CAPTAIN_NOT_FOUND'
          ));
        }

        res.json(createSuccessResponse({
          id: captain.id,
          name: captain.name,
          status: captain.status || 'offline',
          isAvailable: captain.isAvailable || false,
          currentLocation: captain.currentLocation || null,
          lastActive: captain.lastActive || null,
          vehicleType: captain.vehicleType,
          vehicleNumber: captain.vehicleNumber
        }, 'تم جلب حالة الكابتن بنجاح'));

      } catch (error: any) {
        console.error('❌ خطأ في جلب حالة الكابتن:', error);
        res.status(500).json(createErrorResponse(
          'خطأ في جلب حالة الكابتن',
          'STATUS_ERROR'
        ));
      }
    }
  );
}

// دالة مساعدة لترجمة أسماء الحالات للعربية
function getStatusArabicName(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'قيد الانتظار',
    'accepted': 'مقبول',
    'picked_up': 'تم الاستلام',
    'in_transit': 'في الطريق',
    'delivered': 'تم التوصيل',
    'cancelled': 'ملغي'
  };
  return statusMap[status] || status;
}