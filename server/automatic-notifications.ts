import { IStorage } from './storage';
import { smartDeliveryService } from './smart-notifications';

/**
 * خدمة الإشعارات التلقائية للأحداث
 * Automatic Event-Based Notifications Service
 */
export class AutomaticNotificationService {
  private storage: IStorage;
  private smartDelivery: any;
  private websocket: any; // WebSocket helpers from routes.ts

  constructor(storage: IStorage, websocket?: any) {
    this.storage = storage;
    this.smartDelivery = smartDeliveryService;
    this.websocket = websocket;
  }

  // Set WebSocket helpers (called from routes.ts)
  setWebSocket(websocket: any) {
    this.websocket = websocket;
  }

  /**
   * إرسال إشعار فوري عبر WebSocket
   * Send real-time notification via WebSocket
   */
  private async sendRealtimeNotification(userId: string, notification: any): Promise<void> {
    if (this.websocket && this.websocket.sendToUser) {
      try {
        await this.websocket.sendToUser(userId, {
          type: 'notification',
          data: notification,
          timestamp: Date.now()
        });
        console.log(`📨 Real-time notification sent to user: ${userId}`);
      } catch (error: any) {
        console.error('❌ Failed to send real-time notification:', error.message);
      }
    }
  }

  /**
   * إرسال إشعار عند إنشاء طلب جديد
   * Send notification when new order is created
   */
  async onOrderCreated(order: any): Promise<void> {
    try {
      console.log(`📦 Sending order creation notification for order: ${order.id}`);

      // Create in-app notification
      const notification = await this.storage.createNotification({
        userId: order.userId,
        title: 'تم إنشاء طلبك بنجاح 🎉',
        message: `طلبك رقم ${order.orderNumber} قيد المعالجة وسيتم التواصل معك قريباً`,
        type: 'order',
        category: 'order_created',
        iconType: 'package-plus',
        actionUrl: `/orders/${order.id}`,
        sourceId: order.id,
        sourceType: 'order',
        priority: 'normal',
        actionData: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount
        }
      });

      // Send real-time notification
      await this.sendRealtimeNotification(order.userId, notification);

      // Send welcome email for first-time users
      const user = await this.storage.getUser(order.userId);
      if (user) {
        const userOrders = await this.storage.getAllOrders(); // Could be optimized to getUserOrders
        const userOrderCount = userOrders.filter(o => o.userId === order.userId).length;
        
        if (userOrderCount === 1) {
          // First order - send welcome message
          await this.smartDelivery.sendSmartWelcome(order.userId, this.storage, {
            orderNumber: order.orderNumber,
            userName: user.fullName || user.username || 'عميلنا العزيز'
          });
        }
      }

      console.log(`✅ Order creation notification sent for order: ${order.id}`);
    } catch (error) {
      console.error('Error sending order creation notification:', error);
    }
  }

  /**
   * إرسال إشعار عند تحديث حالة الطلب
   * Send notification when order status is updated
   */
  async onOrderStatusUpdated(order: any, previousStatus: string): Promise<void> {
    try {
      console.log(`📋 Sending order status update notification: ${order.id} (${previousStatus} → ${order.status})`);

      const statusMessages: Record<string, { title: string; message: string; icon: string; priority: string }> = {
        'confirmed': {
          title: 'تم تأكيد طلبك ✅',
          message: `طلبك رقم ${order.orderNumber} تم تأكيده وسيبدأ التحضير قريباً`,
          icon: 'check-circle',
          priority: 'normal'
        },
        'preparing': {
          title: 'جاري تحضير طلبك 🔄',
          message: `طلبك رقم ${order.orderNumber} جاري تحضيره الآن`,
          icon: 'settings',
          priority: 'normal'
        },
        'ready': {
          title: 'طلبك جاهز للاستلام! 🎯',
          message: `طلبك رقم ${order.orderNumber} أصبح جاهزاً، سيتم التواصل معك للتسليم`,
          icon: 'package-check',
          priority: 'high'
        },
        'out_for_delivery': {
          title: 'طلبك في الطريق إليك 🚚',
          message: `الكابتن في طريقه إليك بطلبك رقم ${order.orderNumber}`,
          icon: 'truck',
          priority: 'high'
        },
        'delivered': {
          title: 'تم تسليم طلبك بنجاح! 🎉',
          message: `شكراً لك! تم تسليم طلبك رقم ${order.orderNumber} بنجاح. نتطلع لخدمتك مرة أخرى`,
          icon: 'package-check',
          priority: 'high'
        },
        'cancelled': {
          title: 'تم إلغاء طلبك ❌',
          message: `تم إلغاء طلبك رقم ${order.orderNumber}. إذا كان لديك أي استفسار، لا تتردد في التواصل معنا`,
          icon: 'x-circle',
          priority: 'high'
        }
      };

      const statusData = statusMessages[order.status];
      if (statusData) {
        const notification = await this.storage.createNotification({
          userId: order.userId,
          title: statusData.title,
          message: statusData.message,
          type: 'order',
          category: 'status_update',
          iconType: statusData.icon,
          actionUrl: `/orders/${order.id}`,
          sourceId: order.id,
          sourceType: 'order',
          priority: statusData.priority as any,
          actionData: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            newStatus: order.status,
            previousStatus
          }
        });

        // Send real-time notification
        await this.sendRealtimeNotification(order.userId, notification);
      }

      console.log(`✅ Order status update notification sent: ${order.id}`);
    } catch (error) {
      console.error('Error sending order status update notification:', error);
    }
  }

  /**
   * إرسال إشعار عند اكتمال مهمة طباعة
   * Send notification when print job is completed
   */
  async onPrintJobCompleted(printJob: any): Promise<void> {
    try {
      console.log(`🖨️ Sending print job completion notification: ${printJob.id}`);

      const notification = await this.storage.createNotification({
        userId: printJob.userId,
        title: 'اكتملت مهمة الطباعة! 📄',
        message: `تم الانتهاء من طباعة "${printJob.filename}" بنجاح`,
        type: 'print',
        category: 'print_completed',
        iconType: 'printer',
        actionUrl: `/print-jobs/${printJob.id}`,
        sourceId: printJob.id,
        sourceType: 'print_job',
        priority: 'normal',
        actionData: {
          printJobId: printJob.id,
          filename: printJob.filename,
          copies: printJob.copies,
          paperSize: printJob.paperSize
        }
      });

      // Send real-time notification
      await this.sendRealtimeNotification(printJob.userId, notification);

      console.log(`✅ Print job completion notification sent: ${printJob.id}`);
    } catch (error) {
      console.error('Error sending print job completion notification:', error);
    }
  }

  /**
   * إرسال إشعار عند إنشاء حساب جديد
   * Send notification when new user account is created
   */
  async onUserRegistered(user: any): Promise<void> {
    try {
      console.log(`👤 Sending welcome notification for new user: ${user.id}`);

      const notification = await this.storage.createNotification({
        userId: user.id,
        title: 'مرحباً بك في منصة اطبعلي! 🎉',
        message: 'نحن سعداء لانضمامك إلينا. اكتشف خدماتنا المتميزة في الطباعة والخدمات التعليمية',
        type: 'system',
        category: 'welcome',
        iconType: 'user-plus',
        actionUrl: '/dashboard',
        sourceId: user.id,
        sourceType: 'user',
        priority: 'normal',
        isPinned: true,
        actionData: {
          userId: user.id,
          welcomeBonus: 50 // Bonus points for new users
        }
      });

      // Send real-time notification
      await this.sendRealtimeNotification(user.id, notification);

      // Create default notification preferences for new user
      await this.storage.createUserNotificationPreferences({
        userId: user.id,
        enableEmail: true,
        enableInApp: true,
        orderUpdates: true,
        deliveryNotifications: true,
        printJobUpdates: true,
        promotionalOffers: true,
        systemAlerts: true
      });

      // Send smart welcome email
      await this.smartDelivery.sendSmartWelcome(user.id, this.storage, {
        userName: user.fullName || user.username || 'عميلنا العزيز'
      });

      console.log(`✅ Welcome notification sent for new user: ${user.id}`);
    } catch (error) {
      console.error('Error sending user registration notification:', error);
    }
  }

  /**
   * إرسال إشعار عند تحديث معلومات التسليم من الكابتن
   * Send notification when driver provides delivery update
   */
  async onDeliveryUpdate(order: any, driverUpdate: any): Promise<void> {
    try {
      console.log(`🚚 Sending delivery update notification: ${order.id}`);

      const updateMessages: Record<string, { title: string; message: string; icon: string }> = {
        'picked_up': {
          title: 'تم استلام طلبك من المتجر 📦',
          message: `الكابتن ${driverUpdate.driverName} استلم طلبك رقم ${order.orderNumber} وهو في الطريق إليك`,
          icon: 'package'
        },
        'on_the_way': {
          title: 'الكابتن في الطريق إليك 🚚',
          message: `الكابتن ${driverUpdate.driverName} في الطريق إليك. المدة المتوقعة: ${driverUpdate.estimatedTime || '15-20 دقيقة'}`,
          icon: 'truck'
        },
        'arrived': {
          title: 'وصل الكابتن! 🎯',
          message: `الكابتن ${driverUpdate.driverName} وصل إلى موقعك مع طلبك رقم ${order.orderNumber}`,
          icon: 'map-pin'
        },
        'delayed': {
          title: 'تأخير في التسليم ⏰',
          message: `عذراً، هناك تأخير في تسليم طلبك رقم ${order.orderNumber}. السبب: ${driverUpdate.delayReason}`,
          icon: 'clock'
        }
      };

      const updateData = updateMessages[driverUpdate.type];
      if (updateData) {
        await this.storage.createNotification({
          userId: order.userId,
          title: updateData.title,
          message: updateData.message,
          type: 'delivery',
          category: 'driver_update',
          iconType: updateData.icon,
          actionUrl: `/orders/${order.id}/tracking`,
          sourceId: order.id,
          sourceType: 'order',
          priority: driverUpdate.type === 'arrived' ? 'urgent' : 'high',
          actionData: {
            orderId: order.id,
            driverName: driverUpdate.driverName,
            driverId: driverUpdate.driverId,
            updateType: driverUpdate.type,
            estimatedTime: driverUpdate.estimatedTime,
            driverLocation: driverUpdate.location
          }
        });
      }

      console.log(`✅ Delivery update notification sent: ${order.id}`);
    } catch (error) {
      console.error('Error sending delivery update notification:', error);
    }
  }

  /**
   * إرسال إشعار عند تلقي تقييم جديد
   * Send notification when new review is received
   */
  async onReviewReceived(review: any): Promise<void> {
    try {
      console.log(`⭐ Sending review notification: ${review.orderId}`);

      await this.storage.createNotification({
        userId: review.userId,
        title: 'شكراً لتقييمك! ⭐',
        message: `شكراً لتقييمك ${review.rating} نجوم. رأيك يهمنا ويساعدنا على التحسين المستمر`,
        type: 'system',
        category: 'review_thanks',
        iconType: 'star',
        actionUrl: `/orders/${review.orderId}`,
        sourceId: review.id,
        sourceType: 'review',
        priority: 'low',
        actionData: {
          reviewId: review.id,
          orderId: review.orderId,
          rating: review.rating
        }
      });

      // Give bonus points for reviews
      if (review.rating >= 4) {
        const user = await this.storage.getUser(review.userId);
        if (user) {
          await this.storage.updateUser(review.userId, {
            bountyPoints: (user.bountyPoints || 0) + 10
          });

          await this.storage.createNotification({
            userId: review.userId,
            title: 'حصلت على 10 نقاط مكافآت! 🎁',
            message: 'شكراً لتقييمك الإيجابي! حصلت على 10 نقاط مكافآت يمكن استخدامها في طلباتك القادمة',
            type: 'system',
            category: 'bonus_points',
            iconType: 'gift',
            actionUrl: '/rewards',
            sourceId: review.id,
            sourceType: 'review',
            priority: 'normal',
            isPinned: true,
            actionData: {
              pointsEarned: 10,
              reviewId: review.id,
              totalPoints: (user.bountyPoints || 0) + 10
            }
          });
        }
      }

      console.log(`✅ Review notification sent: ${review.orderId}`);
    } catch (error) {
      console.error('Error sending review notification:', error);
    }
  }

  /**
   * إرسال إشعارات الطوارئ والتنبيهات المهمة
   * Send emergency and important system alerts
   */
  async sendSystemAlert(alertData: {
    title: string;
    message: string;
    type: 'maintenance' | 'outage' | 'update' | 'emergency';
    targetAudience?: 'all' | 'active' | 'teachers' | 'students';
    priority: 'urgent' | 'high' | 'normal' | 'low';
  }): Promise<void> {
    try {
      console.log(`🚨 Sending system alert: ${alertData.type}`);

      let targetUsers: any[] = [];
      
      switch (alertData.targetAudience) {
        case 'teachers':
          targetUsers = await this.storage.getActiveTeachers();
          break;
        case 'active':
          targetUsers = await this.storage.getUsersByActivity(7); // Active in last 7 days
          break;
        default:
          targetUsers = await this.storage.getAllUsers();
          break;
      }

      // Send notification to all target users
      for (const user of targetUsers) {
        await this.storage.createNotification({
          userId: user.id,
          title: alertData.title,
          message: alertData.message,
          type: 'system',
          category: alertData.type,
          iconType: alertData.type === 'emergency' ? 'alert-triangle' : 'info',
          priority: alertData.priority as any,
          isPinned: alertData.priority === 'urgent',
          sourceType: 'system',
          actionData: {
            alertType: alertData.type,
            targetAudience: alertData.targetAudience
          }
        });
      }

      console.log(`✅ System alert sent to ${targetUsers.length} users`);
    } catch (error) {
      console.error('Error sending system alert:', error);
    }
  }

  /**
   * جدولة إشعارات المتابعة
   * Schedule follow-up notifications
   */
  async scheduleFollowUpNotifications(orderId: string): Promise<void> {
    try {
      console.log(`📅 Scheduling follow-up notifications for order: ${orderId}`);

      const order = await this.storage.getOrder(orderId);
      if (!order) return;

      // Schedule delivery reminder (2 hours after order if not delivered)
      const reminderTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

      await this.storage.createNotification({
        userId: order.userId,
        title: 'تذكير بطلبك 📋',
        message: `طلبك رقم ${order.orderNumber} قيد المعالجة. سنتواصل معك قريباً`,
        type: 'order',
        category: 'reminder',
        iconType: 'clock',
        actionUrl: `/orders/${order.id}`,
        sourceId: order.id,
        sourceType: 'order',
        priority: 'low',
        scheduledFor: reminderTime,
        actionData: {
          orderId: order.id,
          reminderType: 'delivery_reminder'
        }
      });

      console.log(`✅ Follow-up notifications scheduled for order: ${orderId}`);
    } catch (error) {
      console.error('Error scheduling follow-up notifications:', error);
    }
  }

  /**
   * إرسال إشعار عند منح مكافأة يدوية
   * Send notification when manual reward is granted
   */
  async onRewardGranted(data: { userId: string; points: number; reason: string; adminId?: string }): Promise<void> {
    try {
      console.log(`🎁 Sending reward granted notification: ${data.userId} (+${data.points} points)`);

      const notification = await this.storage.createNotification({
        userId: data.userId,
        title: '🎁 تم منحك مكافأة جديدة!',
        message: `تم منحك ${data.points} نقطة كمكافأة: ${data.reason}`,
        type: 'reward',
        category: 'reward_granted',
        iconType: 'gift',
        actionUrl: '/rewards',
        sourceId: `reward_grant_${Date.now()}`,
        sourceType: 'admin_reward',
        priority: 'normal',
        isPinned: true,
        isRead: false,
        actionData: {
          points: data.points,
          reason: data.reason,
          adminId: data.adminId,
          grantDate: new Date().toISOString()
        }
      });

      await this.sendRealtimeNotification(data.userId, notification);

      console.log(`✅ Reward granted notification sent: ${data.userId}`);
    } catch (error) {
      console.error('Error sending reward granted notification:', error);
    }
  }

  /**
   * إرسال إشعار عند كسب نقاط من الطلبات
   * Send notification when points are earned from orders
   */
  async onPointsEarned(data: { userId: string; points: number; orderNumber: string; orderId: string }): Promise<void> {
    try {
      console.log(`⭐ Sending points earned notification: ${data.userId} (+${data.points} points from order ${data.orderNumber})`);

      const notification = await this.storage.createNotification({
        userId: data.userId,
        title: '⭐ حصلت على نقاط جديدة!',
        message: `حصلت على ${data.points} نقطة من طلبك #${data.orderNumber}`,
        type: 'points',
        category: 'points_earned',
        iconType: 'star',
        actionUrl: `/orders/${data.orderId}`,
        sourceId: data.orderId,
        sourceType: 'order_completion',
        priority: 'normal',
        actionData: {
          points: data.points,
          orderNumber: data.orderNumber,
          orderId: data.orderId
        }
      });

      await this.sendRealtimeNotification(data.userId, notification);

      console.log(`✅ Points earned notification sent: ${data.userId}`);
    } catch (error) {
      console.error('Error sending points earned notification:', error);
    }
  }

  /**
   * إرسال إشعار عند الوصول لمستوى جديد
   * Send notification when user reaches a new level
   */
  async onLevelUp(data: { userId: string; newLevel: number; previousLevel: number }): Promise<void> {
    try {
      console.log(`🏆 Sending level up notification: ${data.userId} (level ${data.previousLevel} → ${data.newLevel})`);

      const notification = await this.storage.createNotification({
        userId: data.userId,
        title: '🏆 تهانينا! وصلت لمستوى جديد',
        message: `تهانينا! وصلت للمستوى ${data.newLevel} الجديد`,
        type: 'achievement',
        category: 'level_up',
        iconType: 'trophy',
        actionUrl: '/rewards',
        sourceId: `level_up_${data.userId}_${data.newLevel}`,
        sourceType: 'level_achievement',
        priority: 'high',
        actionData: {
          newLevel: data.newLevel,
          previousLevel: data.previousLevel
        }
      });

      await this.sendRealtimeNotification(data.userId, notification);

      console.log(`✅ Level up notification sent: ${data.userId}`);
    } catch (error) {
      console.error('Error sending level up notification:', error);
    }
  }

  /**
   * إرسال إشعار عند استخدام مكافأة
   * Send notification when reward is redeemed
   */
  async onRewardRedeemed(data: { userId: string; rewardName: string; rewardId: string; pointsCost: number }): Promise<void> {
    try {
      console.log(`✨ Sending reward redeemed notification: ${data.userId} redeemed ${data.rewardName}`);

      const notification = await this.storage.createNotification({
        userId: data.userId,
        title: '✨ تم استخدام المكافأة بنجاح',
        message: `تم استخدام المكافأة "${data.rewardName}" بنجاح`,
        type: 'reward_usage',
        category: 'reward_redeemed',
        iconType: 'gift-check',
        actionUrl: '/rewards',
        sourceId: data.rewardId,
        sourceType: 'reward_redemption',
        priority: 'normal',
        actionData: {
          rewardName: data.rewardName,
          rewardId: data.rewardId,
          pointsCost: data.pointsCost
        }
      });

      await this.sendRealtimeNotification(data.userId, notification);

      console.log(`✅ Reward redeemed notification sent: ${data.userId}`);
    } catch (error) {
      console.error('Error sending reward redeemed notification:', error);
    }
  }
}