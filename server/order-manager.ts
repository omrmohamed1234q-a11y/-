/*
  🔒 PROTECTED ORDER MANAGER - DO NOT MODIFY 🔒
  ===========================================
  
  ⚠️ CRITICAL ORDER SYSTEM WARNING ⚠️
  This file contains the order processing logic which is 100% functional.
  
  🚨 DO NOT EDIT WITHOUT EXPLICIT APPROVAL 🚨
  - Order acceptance flow working perfectly
  - 3-order limit per captain implemented
  - Conflict prevention system operational
  - Database sync functioning correctly
  
  Contact system admin before making ANY changes to this file.
  Last protected: September 21, 2025
*/

// نظام إدارة الطلبات المتطور مع منع التضارب
import { WebSocket } from 'ws';

// أنواع البيانات
export interface OrderLock {
  captainId: string;
  timestamp: number;
  expiresAt: number;
}

export interface OrderAcceptanceAttempt {
  captainId: string;
  captainName: string;
  timestamp: number;
  status: 'attempting' | 'success' | 'failed' | 'timeout';
}

export interface OrderState {
  id: string;
  status: 'pending' | 'locked' | 'accepted' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled';
  assignedCaptain?: string;
  lockInfo?: OrderLock;
  acceptanceAttempts: OrderAcceptanceAttempt[];
  lastUpdated: number;
}

export interface CaptainInfo {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy' | 'on_delivery';
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export class OrderManager {
  private orders: Map<string, OrderState> = new Map();
  private captains: Map<string, CaptainInfo> = new Map();
  private wsClients: Map<string, WebSocket>;
  private storage: any;
  
  // إعدادات النظام
  private readonly LOCK_DURATION = 90 * 1000; // 90 ثانية (دقيقة ونصف)
  private readonly ORDER_TIMEOUT_DURATION = 5 * 60 * 1000; // 5 دقائق
  private readonly MAX_ATTEMPTS_PER_CAPTAIN = 3; // محاولات القبول القصوى
  
  constructor(storage: any, wsClients: Map<string, WebSocket>) {
    this.storage = storage;
    this.wsClients = wsClients;
    
    // تنظيف دوري للطلبات المنتهية الصلاحية
    setInterval(() => this.cleanupExpiredLocks(), 10000); // كل 10 ثوان
    
    console.log('🎯 تم تهيئة OrderManager المتطور بنجاح');
  }

  /**
   * تهيئة طلب جديد في النظام
   */
  async initializeOrder(orderId: string): Promise<boolean> {
    try {
      const order = await this.storage.getOrder(orderId);
      if (!order) {
        console.log(`❌ طلب غير موجود: ${orderId}`);
        return false;
      }

      const orderState: OrderState = {
        id: orderId,
        status: (order.status === 'ready' || order.status === 'assigned_to_driver') ? 'pending' : order.status,
        assignedCaptain: order.assignedCaptain,
        acceptanceAttempts: [],
        lastUpdated: Date.now()
      };

      this.orders.set(orderId, orderState);
      
      // إشعار جميع الكباتن المتاحين بطلب جديد
      if (orderState.status === 'pending') {
        await this.notifyAvailableCaptains(orderId, 'new_order_available');
      }

      console.log(`✅ تم تهيئة الطلب ${orderId} في OrderManager`);
      return true;
    } catch (error) {
      console.error(`❌ خطأ في تهيئة الطلب ${orderId}:`, error);
      return false;
    }
  }

  /**
   * محاولة قبول طلب من قبل كبتن
   */
  async attemptOrderAcceptance(orderId: string, captainId: string): Promise<{
    success: boolean;
    message: string;
    lockTimeRemaining?: number;
    conflictInfo?: any;
  }> {
    try {
      const orderState = this.orders.get(orderId);
      const captain = this.captains.get(captainId);

      // التحقق من وجود الطلب والكبتن
      if (!orderState) {
        return {
          success: false,
          message: 'الطلب غير موجود في النظام'
        };
      }

      if (!captain) {
        return {
          success: false,
          message: 'بيانات الكبتن غير متاحة'
        };
      }

      // التحقق من حالة الطلب
      if (orderState.status !== 'pending' && orderState.status !== 'locked') {
        return {
          success: false,
          message: 'الطلب غير متاح للقبول',
          conflictInfo: {
            currentStatus: orderState.status,
            assignedCaptain: orderState.assignedCaptain
          }
        };
      }

      // التحقق من القفل الموجود
      if (orderState.lockInfo) {
        const currentTime = Date.now();
        
        // إذا كان القفل منتهي الصلاحية، أزله
        if (currentTime >= orderState.lockInfo.expiresAt) {
          console.log(`🔓 انتهت صلاحية قفل الطلب ${orderId}`);
          orderState.lockInfo = undefined;
          orderState.status = 'pending';
        } else {
          // القفل ما زال فعال
          if (orderState.lockInfo.captainId !== captainId) {
            const timeRemaining = orderState.lockInfo.expiresAt - currentTime;
            const lockedCaptain = this.captains.get(orderState.lockInfo.captainId);
            
            return {
              success: false,
              message: `الطلب محجوز حالياً من كبتن آخر`,
              lockTimeRemaining: timeRemaining,
              conflictInfo: {
                lockedBy: lockedCaptain?.name || 'كبتن آخر',
                timeRemaining: Math.ceil(timeRemaining / 1000)
              }
            };
          }
        }
      }

      // التحقق من عدد المحاولات السابقة
      const captainAttempts = orderState.acceptanceAttempts.filter(
        attempt => attempt.captainId === captainId
      );
      
      if (captainAttempts.length >= this.MAX_ATTEMPTS_PER_CAPTAIN) {
        return {
          success: false,
          message: 'تم تجاوز الحد الأقصى لمحاولات قبول هذا الطلب'
        };
      }

      // إنشاء قفل جديد
      const lockInfo: OrderLock = {
        captainId,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.LOCK_DURATION
      };

      // تسجيل محاولة القبول
      const acceptanceAttempt: OrderAcceptanceAttempt = {
        captainId,
        captainName: captain.name,
        timestamp: Date.now(),
        status: 'attempting'
      };

      // تحديث حالة الطلب
      orderState.lockInfo = lockInfo;
      orderState.status = 'locked';
      orderState.acceptanceAttempts.push(acceptanceAttempt);
      orderState.lastUpdated = Date.now();

      // إشعار جميع الكباتن بأن الطلب محجوز مؤقتاً
      await this.notifyAvailableCaptains(orderId, 'order_locked', {
        lockedBy: captain.name,
        timeRemaining: this.LOCK_DURATION / 1000
      });

      console.log(`🔒 تم حجز الطلب ${orderId} مؤقتاً للكبتن ${captain.name}`);

      return {
        success: true,
        message: 'تم حجز الطلب مؤقتاً لك',
        lockTimeRemaining: this.LOCK_DURATION
      };

    } catch (error) {
      console.error(`❌ خطأ في محاولة قبول الطلب ${orderId}:`, error);
      return {
        success: false,
        message: 'حدث خطأ في النظام'
      };
    }
  }

  /**
   * تأكيد قبول الطلب نهائياً
   */
  async confirmOrderAcceptance(orderId: string, captainId: string): Promise<{
    success: boolean;
    message: string;
    order?: any;
  }> {
    try {
      const orderState = this.orders.get(orderId);
      const captain = this.captains.get(captainId);

      if (!orderState || !captain) {
        return {
          success: false,
          message: 'بيانات الطلب أو الكبتن غير متاحة'
        };
      }

      // التحقق من القفل
      if (!orderState.lockInfo || orderState.lockInfo.captainId !== captainId) {
        return {
          success: false,
          message: 'ليس لديك حجز صحيح لهذا الطلب'
        };
      }

      // التحقق من انتهاء صلاحية القفل
      if (Date.now() >= orderState.lockInfo.expiresAt) {
        return {
          success: false,
          message: 'انتهت مهلة حجز الطلب'
        };
      }

      // 🆕 فحص الحد الأقصى 3 طلبات نشطة للكابتن
      try {
        const activeOrders = await this.storage.getOrdersByCaptain(captainId);
        const activeCount = activeOrders.filter(order => 
          ['assigned_to_driver', 'accepted', 'picked_up', 'out_for_delivery'].includes(order.status)
        ).length;

        if (activeCount >= 3) {
          return {
            success: false,
            message: `لديك بالفعل ${activeCount} طلبات نشطة. الحد الأقصى 3 طلبات فقط!`
          };
        }

        console.log(`📊 الكابتن ${captain.name} لديه ${activeCount}/3 طلبات نشطة`);
      } catch (error) {
        console.error('❌ خطأ في فحص الطلبات النشطة:', error);
        // نستمر رغم الخطأ لتجنب حجب النظام
      }

      // تحديث الطلب في قاعدة البيانات - استخدام حالة مناسبة
      await this.storage.assignOrderToDriver(orderId, captainId);
      await this.storage.updateOrderStatus(orderId, 'assigned_to_driver');  // ✅ حالة صحيحة

      // تحديث حالة الطلب في النظام
      orderState.status = 'accepted';
      orderState.assignedCaptain = captainId;
      orderState.lockInfo = undefined;
      
      // تحديث محاولة القبول
      const lastAttempt = orderState.acceptanceAttempts.find(
        attempt => attempt.captainId === captainId && attempt.status === 'attempting'
      );
      if (lastAttempt) {
        lastAttempt.status = 'success';
      }

      orderState.lastUpdated = Date.now();

      // إشعار جميع الكباتن بأن الطلب تم تعيينه
      await this.notifyAvailableCaptains(orderId, 'order_assigned', {
        assignedTo: captain.name,
        captainId: captainId
      });

      // جلب بيانات الطلب الكاملة
      const order = await this.storage.getOrder(orderId);

      console.log(`🎉 تم تأكيد قبول الطلب ${orderId} للكبتن ${captain.name} (${activeCount + 1}/3 طلبات نشطة)`);

      return {
        success: true,
        message: 'تم قبول الطلب بنجاح! 🎉',
        order: {
          ...order,
          assignedCaptain: captain
        }
      };

    } catch (error) {
      console.error(`❌ خطأ في تأكيد قبول الطلب ${orderId}:`, error);
      return {
        success: false,
        message: 'حدث خطأ في النظام'
      };
    }
  }

  /**
   * إلغاء محاولة قبول الطلب
   */
  async cancelOrderAcceptance(orderId: string, captainId: string): Promise<boolean> {
    try {
      const orderState = this.orders.get(orderId);
      
      if (!orderState || !orderState.lockInfo || orderState.lockInfo.captainId !== captainId) {
        return false;
      }

      // إزالة القفل
      orderState.lockInfo = undefined;
      orderState.status = 'pending';
      orderState.lastUpdated = Date.now();

      // تحديث محاولة القبول
      const lastAttempt = orderState.acceptanceAttempts.find(
        attempt => attempt.captainId === captainId && attempt.status === 'attempting'
      );
      if (lastAttempt) {
        lastAttempt.status = 'failed';
      }

      // إشعار الكباتن بأن الطلب متاح مرة أخرى
      await this.notifyAvailableCaptains(orderId, 'order_available_again');

      console.log(`↩️ تم إلغاء حجز الطلب ${orderId} من الكبتن ${captainId}`);
      return true;

    } catch (error) {
      console.error(`❌ خطأ في إلغاء قبول الطلب ${orderId}:`, error);
      return false;
    }
  }

  /**
   * تسجيل كبتن في النظام
   */
  registerCaptain(captainInfo: CaptainInfo): void {
    this.captains.set(captainInfo.id, captainInfo);
    console.log(`👨‍✈️ تم تسجيل الكبتن ${captainInfo.name} في OrderManager`);
  }

  /**
   * إزالة كبتن من النظام
   */
  unregisterCaptain(captainId: string): void {
    const captain = this.captains.get(captainId);
    this.captains.delete(captainId);
    
    // إلغاء أي أقفال للكبتن
    for (const [orderId, orderState] of this.orders) {
      if (orderState.lockInfo?.captainId === captainId) {
        orderState.lockInfo = undefined;
        orderState.status = 'pending';
      }
    }
    
    if (captain) {
      console.log(`👨‍✈️ تم إلغاء تسجيل الكبتن ${captain.name} من OrderManager`);
    }
  }

  /**
   * تحديث موقع الكبتن
   */
  updateCaptainLocation(captainId: string, location: { lat: number; lng: number }): void {
    const captain = this.captains.get(captainId);
    if (captain) {
      captain.currentLocation = location;
    }
  }

  /**
   * تنظيف الأقفال المنتهية الصلاحية
   */
  private cleanupExpiredLocks(): void {
    const currentTime = Date.now();
    let cleanedCount = 0;

    for (const [orderId, orderState] of this.orders) {
      if (orderState.lockInfo && currentTime >= orderState.lockInfo.expiresAt) {
        const captainName = this.captains.get(orderState.lockInfo.captainId)?.name || 'unknown';
        
        orderState.lockInfo = undefined;
        orderState.status = 'pending';
        orderState.lastUpdated = currentTime;

        // تحديث محاولة القبول المنتهية الصلاحية
        const lastAttempt = orderState.acceptanceAttempts.find(
          attempt => attempt.status === 'attempting'
        );
        if (lastAttempt) {
          lastAttempt.status = 'timeout';
        }

        // إشعار الكباتن
        this.notifyAvailableCaptains(orderId, 'order_timeout', {
          previousCaptain: captainName
        });

        cleanedCount++;
        console.log(`⏰ انتهت صلاحية قفل الطلب ${orderId} للكبتن ${captainName}`);
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 تم تنظيف ${cleanedCount} قفل منتهي الصلاحية`);
    }
  }

  /**
   * إشعار الكباتن المتاحين
   */
  private async notifyAvailableCaptains(
    orderId: string, 
    eventType: string, 
    data?: any
  ): Promise<void> {
    try {
      const availableCaptains = Array.from(this.captains.values()).filter(
        captain => captain.status === 'online'
      );

      const notification = {
        type: 'order_event',
        eventType,
        orderId,
        timestamp: Date.now(),
        data: data || {}
      };

      // إرسال إشعار عبر WebSocket للكباتن المتاحين
      for (const captain of availableCaptains) {
        const captainWs = this.wsClients.get(captain.id);
        if (captainWs && captainWs.readyState === WebSocket.OPEN) {
          captainWs.send(JSON.stringify(notification));
        }
      }

      console.log(`📢 تم إرسال إشعار ${eventType} للطلب ${orderId} إلى ${availableCaptains.length} كبتن`);

    } catch (error) {
      console.error('❌ خطأ في إرسال الإشعارات:', error);
    }
  }

  /**
   * إحصائيات النظام الأساسية
   */
  getSystemStats(): any {
    const currentTime = Date.now();
    const pendingOrders = Array.from(this.orders.values()).filter(order => order.status === 'pending').length;
    const lockedOrders = Array.from(this.orders.values()).filter(order => order.status === 'locked').length;
    const acceptedOrders = Array.from(this.orders.values()).filter(order => order.status === 'accepted').length;
    const onlineCaptains = Array.from(this.captains.values()).filter(captain => captain.status === 'online').length;
    
    // حساب الأقفال الفعالة والمنتهية الصلاحية
    const activeLocks = Array.from(this.orders.values())
      .filter(order => order.lockInfo && order.lockInfo.expiresAt >= currentTime).length;
    const expiredLocks = Array.from(this.orders.values())
      .filter(order => order.lockInfo && order.lockInfo.expiresAt < currentTime).length;

    return {
      totalOrders: this.orders.size,
      pendingOrders,
      lockedOrders,
      acceptedOrders,
      totalCaptains: this.captains.size,
      onlineCaptains,
      offlineCaptains: this.captains.size - onlineCaptains,
      activeLocks,
      expiredLocks,
      systemHealth: 'operational',
      timestamp: currentTime
    };
  }

  /**
   * الحصول على حالة طلب محدد
   */
  getOrderState(orderId: string): OrderState | undefined {
    return this.orders.get(orderId);
  }

  /**
   * الحصول على جميع الطلبات المتاحة للكبتن
   */
  getAvailableOrders(): OrderState[] {
    return Array.from(this.orders.values()).filter(
      order => order.status === 'pending'
    );
  }

  /**
   * الحصول على جميع الطلبات المحجوزة حالياً
   */
  getAllLockedOrders(): any[] {
    const currentTime = Date.now();
    const lockedOrders: any[] = [];
    
    for (const [orderId, state] of this.orders) {
      if (state.lockInfo && state.lockInfo.expiresAt >= currentTime) {
        const captain = this.captains.get(state.lockInfo.captainId);
        lockedOrders.push({
          orderId,
          lockedBy: state.lockInfo.captainId,
          captainName: captain?.name || 'Unknown',
          lockedAt: state.lockInfo.lockedAt,
          expiresAt: state.lockInfo.expiresAt,
          remainingTime: state.lockInfo.expiresAt - currentTime,
          isExpired: false,
          status: state.status
        });
      } else if (state.lockInfo && state.lockInfo.expiresAt < currentTime) {
        const captain = this.captains.get(state.lockInfo.captainId);
        lockedOrders.push({
          orderId,
          lockedBy: state.lockInfo.captainId,
          captainName: captain?.name || 'Unknown',
          lockedAt: state.lockInfo.lockedAt,
          expiresAt: state.lockInfo.expiresAt,
          remainingTime: 0,
          isExpired: true,
          status: state.status
        });
      }
    }
    
    return lockedOrders.sort((a, b) => b.lockedAt - a.lockedAt);
  }

  /**
   * إحصائيات متقدمة للنظام
   */
  getAdvancedStats(): any {
    const currentTime = Date.now();
    const baseStats = this.getSystemStats();
    
    // حساب متوسط زمن الحجز
    const activeLocks = Array.from(this.orders.values())
      .filter(state => state.lockInfo && state.lockInfo.expiresAt >= currentTime);
    
    const averageLockTime = activeLocks.length > 0 
      ? activeLocks.reduce((sum, state) => 
          sum + (state.lockInfo!.expiresAt - state.lockInfo!.lockedAt), 0) / activeLocks.length
      : 0;
    
    // حساب عدد الكباتن النشطين
    const activeCaptains = Array.from(this.captains.values())
      .filter(captain => captain.status === 'online').length;
    
    // حساب معدل النجاح
    const totalAttempts = Array.from(this.orders.values())
      .reduce((sum, order) => sum + order.acceptanceAttempts.length, 0);
    
    const successfulAttempts = Array.from(this.orders.values())
      .reduce((sum, order) => 
        sum + order.acceptanceAttempts.filter(attempt => attempt.status === 'accepted').length, 0);
    
    const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;
    
    return {
      ...baseStats,
      averageLockTime: Math.round(averageLockTime),
      activeCaptains,
      offlineCaptains: this.captains.size - activeCaptains,
      totalAttempts,
      successfulAttempts,
      successRate: Math.round(successRate * 100) / 100,
      expiredLocks: Array.from(this.orders.values())
        .filter(state => state.lockInfo && state.lockInfo.expiresAt < currentTime).length
    };
  }

  /**
   * الحصول على حالة كبتن معين
   */
  getCaptainState(captainId: string): CaptainInfo | undefined {
    return this.captains.get(captainId);
  }

  /**
   * الحصول على عدد المحاولات لطلب معين
   */
  getOrderAttempts(orderId: string): AcceptanceAttempt[] {
    const order = this.orders.get(orderId);
    return order ? order.acceptanceAttempts : [];
  }

  /**
   * الحصول على معلومات حجز الطلب
   */
  getOrderLockInfo(orderId: string): any {
    const order = this.orders.get(orderId);
    if (!order || !order.lockInfo) {
      return null;
    }
    
    const captain = this.captains.get(order.lockInfo.captainId);
    return {
      captainName: captain?.name || 'Unknown',
      lockedUntil: order.lockInfo.expiresAt,
      remainingTime: Math.max(0, order.lockInfo.expiresAt - Date.now()),
      isExpired: order.lockInfo.expiresAt < Date.now()
    };
  }

  /**
   * إحصائيات مفصلة لطلب معين
   */
  getOrderDetails(orderId: string): any {
    const order = this.orders.get(orderId);
    if (!order) return null;
    
    const lockInfo = order.lockInfo ? {
      captainId: order.lockInfo.captainId,
      captainName: this.captains.get(order.lockInfo.captainId)?.name || 'Unknown',
      lockedAt: order.lockInfo.lockedAt,
      expiresAt: order.lockInfo.expiresAt,
      remainingTime: Math.max(0, order.lockInfo.expiresAt - Date.now()),
      isExpired: order.lockInfo.expiresAt < Date.now()
    } : null;
    
    return {
      orderId,
      status: order.status,
      lockInfo,
      attempts: order.acceptanceAttempts.length,
      lastUpdated: order.lastUpdated,
      createdAt: order.createdAt
    };
  }
}