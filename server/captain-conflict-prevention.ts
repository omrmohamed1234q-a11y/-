// نظام منع التضارب المتقدم للكباتن
import { OrderManager } from './order-manager';

export class ConflictPreventionSystem {
  private orderManager: OrderManager;
  private readonly MAX_CONCURRENT_ATTEMPTS = 5; // الحد الأقصى للمحاولات المتزامنة
  private readonly CAPTAIN_COOLDOWN = 60 * 1000; // فترة انتظار بين المحاولات (60 ثانية)
  
  private captainCooldowns: Map<string, number> = new Map(); // captainId -> timestamp
  private concurrentAttempts: Map<string, Set<string>> = new Map(); // orderId -> set of captainIds
  
  constructor(orderManager: OrderManager) {
    this.orderManager = orderManager;
    
    // تنظيف دوري للكولداونز المنتهية
    setInterval(() => this.cleanupExpiredCooldowns(), 30000); // كل 30 ثانية
    
    console.log('🛡️ تم تهيئة نظام منع التضارب المتقدم');
  }

  /**
   * فحص ما إذا كان الكبتن يستطيع محاولة قبول الطلب
   */
  canCaptainAttempt(captainId: string, orderId: string): {
    canAttempt: boolean;
    reason?: string;
    waitTime?: number;
  } {
    // فحص فترة الانتظار
    const cooldownTime = this.captainCooldowns.get(captainId);
    if (cooldownTime && Date.now() < cooldownTime) {
      const waitTime = cooldownTime - Date.now();
      return {
        canAttempt: false,
        reason: 'يجب انتظار فترة قبل المحاولة مرة أخرى',
        waitTime: waitTime
      };
    }

    // فحص عدد المحاولات المتزامنة للطلب
    const currentAttempts = this.concurrentAttempts.get(orderId);
    if (currentAttempts && currentAttempts.size >= this.MAX_CONCURRENT_ATTEMPTS) {
      return {
        canAttempt: false,
        reason: 'عدد كبير من الكباتن يحاولون قبول هذا الطلب حالياً'
      };
    }

    return { canAttempt: true };
  }

  /**
   * تسجيل محاولة قبول من كبتن
   */
  registerAttempt(captainId: string, orderId: string): void {
    // إضافة للمحاولات المتزامنة
    if (!this.concurrentAttempts.has(orderId)) {
      this.concurrentAttempts.set(orderId, new Set());
    }
    this.concurrentAttempts.get(orderId)!.add(captainId);

    // تسجيل وقت المحاولة
    console.log(`🔄 تسجيل محاولة قبول من الكبتن ${captainId} للطلب ${orderId}`);
  }

  /**
   * إزالة محاولة عند النجاح أو الفشل
   */
  removeAttempt(captainId: string, orderId: string, success: boolean): void {
    const attempts = this.concurrentAttempts.get(orderId);
    if (attempts) {
      attempts.delete(captainId);
      if (attempts.size === 0) {
        this.concurrentAttempts.delete(orderId);
      }
    }

    // إضافة كولداون فقط في حالة الفشل
    if (!success) {
      this.captainCooldowns.set(captainId, Date.now() + this.CAPTAIN_COOLDOWN);
      console.log(`⏰ تم تطبيق فترة انتظار للكبتن ${captainId} لمدة ${this.CAPTAIN_COOLDOWN/1000} ثانية`);
    }

    console.log(`${success ? '✅' : '❌'} إزالة محاولة الكبتن ${captainId} للطلب ${orderId}`);
  }

  /**
   * تنظيف الكولداونز المنتهية الصلاحية
   */
  private cleanupExpiredCooldowns(): void {
    const currentTime = Date.now();
    let cleanedCount = 0;

    for (const [captainId, cooldownTime] of this.captainCooldowns) {
      if (currentTime >= cooldownTime) {
        this.captainCooldowns.delete(captainId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 تم تنظيف ${cleanedCount} فترة انتظار منتهية الصلاحية`);
    }
  }

  /**
   * الحصول على إحصائيات نظام منع التضارب
   */
  getConflictStats(): any {
    const activeOrders = Array.from(this.concurrentAttempts.keys()).length;
    const totalAttempts = Array.from(this.concurrentAttempts.values())
      .reduce((sum, attempts) => sum + attempts.size, 0);
    const captainsInCooldown = this.captainCooldowns.size;

    return {
      activeOrdersWithAttempts: activeOrders,
      totalConcurrentAttempts: totalAttempts,
      captainsInCooldown: captainsInCooldown,
      maxAllowedConcurrentAttempts: this.MAX_CONCURRENT_ATTEMPTS,
      cooldownDuration: this.CAPTAIN_COOLDOWN / 1000
    };
  }

  /**
   * إشعار جميع الكباتن المحاولين حول تطورات الطلب
   */
  notifyCompetingCaptains(orderId: string, eventType: string, data?: any): void {
    const attempts = this.concurrentAttempts.get(orderId);
    if (!attempts || attempts.size === 0) return;

    const notification = {
      type: 'conflict_event',
      eventType,
      orderId,
      competingCaptains: attempts.size,
      timestamp: Date.now(),
      data: data || {}
    };

    console.log(`📢 إشعار ${attempts.size} كبتن متنافس حول الطلب ${orderId}: ${eventType}`);
    
    // يمكن إضافة منطق إرسال الإشعارات هنا
  }

  /**
   * فحص ما إذا كان هناك تضارب حالي للطلب
   */
  hasActiveConflict(orderId: string): boolean {
    const attempts = this.concurrentAttempts.get(orderId);
    return attempts ? attempts.size > 1 : false;
  }

  /**
   * الحصول على قائمة الكباتن المتنافسين على طلب
   */
  getCompetingCaptains(orderId: string): string[] {
    const attempts = this.concurrentAttempts.get(orderId);
    return attempts ? Array.from(attempts) : [];
  }

  /**
   * فرض إنهاء جميع المحاولات لطلب معين (للطوارئ)
   */
  forceEndAllAttempts(orderId: string): void {
    const attempts = this.concurrentAttempts.get(orderId);
    if (attempts) {
      const captainIds = Array.from(attempts);
      this.concurrentAttempts.delete(orderId);
      
      // إضافة كولداون لجميع الكباتن المحاولين
      captainIds.forEach(captainId => {
        this.captainCooldowns.set(captainId, Date.now() + (this.CAPTAIN_COOLDOWN / 2));
      });

      console.log(`🚨 تم فرض إنهاء جميع المحاولات للطلب ${orderId} (${captainIds.length} كبتن)`);
    }
  }

  /**
   * إعادة تعيين فترة انتظار كبتن (للإدارة)
   */
  resetCaptainCooldown(captainId: string): boolean {
    if (this.captainCooldowns.has(captainId)) {
      this.captainCooldowns.delete(captainId);
      console.log(`🔓 تم إعادة تعيين فترة انتظار الكبتن ${captainId}`);
      return true;
    }
    return false;
  }

  /**
   * الحصول على معلومات تفصيلية عن طلب معين
   */
  getOrderConflictDetails(orderId: string): any {
    const attempts = this.concurrentAttempts.get(orderId);
    const orderState = this.orderManager.getOrderState(orderId);

    return {
      orderId,
      hasConflict: this.hasActiveConflict(orderId),
      competingCaptains: attempts ? Array.from(attempts) : [],
      attemptCount: attempts ? attempts.size : 0,
      orderStatus: orderState?.status || 'unknown',
      isLocked: !!orderState?.lockInfo,
      lockDetails: orderState?.lockInfo || null
    };
  }
}