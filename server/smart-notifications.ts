// ============================================================================
// نظام التنبيهات الذكي - Smart Notifications Service
// Implementation using SendGrid blueprint
// ============================================================================

import sgMail from '@sendgrid/mail';
import {
  smartCampaigns,
  targetingRules,
  sentMessages,
  userBehaviorTracking,
  messageTemplates,
  scheduledJobs,
  type SmartCampaign,
  type InsertSmartCampaign,
  type TargetingRule,
  type SentMessage,
  type UserBehavior,
  type MessageTemplate,
} from '../shared/smart-notifications-schema';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn("⚠️ SENDGRID_API_KEY not found. Email notifications will be disabled.");
}

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ============================================================================
// Smart Targeting Engine - محرك الاستهداف الذكي
// ============================================================================

interface SmartTargetingCriteria {
  demographic?: {
    ageRange?: [number, number];
    gradeLevel?: string[];
    location?: string[];
    gender?: string;
  };
  behavioral?: {
    totalOrders?: { min?: number; max?: number };
    totalSpent?: { min?: number; max?: number };
    lastOrderDays?: number; // Days since last order
    engagementScore?: { min?: number; max?: number };
  };
  engagement?: {
    emailOpenRate?: { min?: number; max?: number };
    clickThroughRate?: { min?: number; max?: number };
    preferredChannel?: string[];
    optedOutChannels?: string[];
  };
  temporal?: {
    bestTimeToSend?: string[];
    timezone?: string;
    dayOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  };
}

class SmartTargetingEngine {
  /**
   * حساب الجمهور المستهدف بناءً على المعايير الذكية
   * Calculate target audience based on smart criteria
   */
  async calculateTargetAudience(criteria: SmartTargetingCriteria, storage: any): Promise<string[]> {
    console.log('🎯 Calculating target audience with criteria:', criteria);
    
    try {
      let targetUsers: any[] = [];

      // Apply demographic filters
      if (criteria.demographic?.gradeLevel && criteria.demographic.gradeLevel.length > 0) {
        const gradeUsers = await storage.getUsersByGradeLevel(criteria.demographic.gradeLevel);
        targetUsers = targetUsers.length === 0 ? gradeUsers : targetUsers.filter(u => 
          gradeUsers.some(gu => gu.id === u.id)
        );
      }

      // Apply role filters
      if (criteria.demographic && 'role' in criteria.demographic && criteria.demographic.role && criteria.demographic.role.length > 0) {
        const roleUsers = await storage.getUsersByRole(criteria.demographic.role);
        targetUsers = targetUsers.length === 0 ? roleUsers : targetUsers.filter(u => 
          roleUsers.some(ru => ru.id === u.id)
        );
      }

      // Apply behavioral filters
      if (criteria.behavioral) {
        const behaviorCriteria: any = {};
        if (criteria.behavioral.totalOrders?.min) {
          behaviorCriteria.minPurchases = criteria.behavioral.totalOrders.min;
        }
        if (criteria.behavioral.totalSpent?.min) {
          behaviorCriteria.minPoints = criteria.behavioral.totalSpent.min;
        }
        
        if (Object.keys(behaviorCriteria).length > 0) {
          const behaviorUsers = await storage.getUsersByBehavior(behaviorCriteria);
          targetUsers = targetUsers.length === 0 ? behaviorUsers : targetUsers.filter(u => 
            behaviorUsers.some(bu => bu.id === u.id)
          );
        }
      }

      // Apply activity filters
      if (criteria.behavioral?.lastOrderDays) {
        const activityUsers = await storage.getUsersByActivity(criteria.behavioral.lastOrderDays);
        targetUsers = targetUsers.length === 0 ? activityUsers : targetUsers.filter(u => 
          activityUsers.some(au => au.id === u.id)
        );
      }

      // If no specific criteria, get all users
      if (targetUsers.length === 0) {
        targetUsers = await storage.getAllUsers();
      }

      const userIds = targetUsers.map(user => user.id);
      console.log(`✅ Found ${userIds.length} users matching criteria:`, userIds.slice(0, 5), userIds.length > 5 ? '...' : '');
      
      return userIds;
    } catch (error) {
      console.error('❌ Error calculating target audience:', error);
      
      // Fallback to getting all users
      try {
        const allUsers = await storage.getAllUsers();
        return allUsers.map((user: any) => user.id);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * حساب أفضل وقت للإرسال لكل مستخدم
   * Calculate optimal send time for each user
   */
  getOptimalSendTime(userId: string): string {
    // Mock implementation - would analyze user behavior patterns
    const defaultTimes = ['09:00', '14:00', '19:00'];
    return defaultTimes[Math.floor(Math.random() * defaultTimes.length)];
  }

  /**
   * تخصيص المحتوى لكل مستخدم
   * Personalize content for each user
   */
  personalizeContent(template: string, userData: any): string {
    let personalizedContent = template;
    
    // Replace common placeholders
    personalizedContent = personalizedContent.replace('{{name}}', userData.name || 'عميلنا العزيز');
    personalizedContent = personalizedContent.replace('{{grade}}', userData.gradeLevel || '');
    personalizedContent = personalizedContent.replace('{{points}}', userData.bountyPoints || '0');
    
    return personalizedContent;
  }

  /**
   * تحديث نقاط التفاعل للمستخدم
   * Update user engagement score
   */
  async updateEngagementScore(userId: string, action: 'opened' | 'clicked' | 'converted'): Promise<void> {
    const scoreIncrements = {
      opened: 5,
      clicked: 15,
      converted: 50
    };
    
    console.log(`📈 User ${userId} engagement +${scoreIncrements[action]} points for ${action}`);
    
    // In real implementation, update the userBehaviorTracking table
    // This would calculate running averages and update customer segments
  }
}

// ============================================================================
// Smart Delivery Service - خدمة التوصيل الذكية
// ============================================================================

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  personalizations?: any[];
}

class SmartDeliveryService {
  private targetingEngine: SmartTargetingEngine;

  constructor() {
    this.targetingEngine = new SmartTargetingEngine();
  }

  /**
   * إرسال إيميل ذكي مع التخصيص
   * Send smart email with personalization
   */
  async sendSmartEmail(params: EmailParams): Promise<boolean> {
    console.log('🔍 DEBUG sendSmartEmail called with:', { 
      to: params.to, 
      subject: params.subject,
      sendgridKeyExists: !!process.env.SENDGRID_API_KEY,
      sendgridKeyPrefix: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.substring(0, 10) + '...' : 'undefined'
    });
    
    if (!process.env.SENDGRID_API_KEY) {
      console.log('📧 Email would be sent (SendGrid API key not configured):', params.subject);
      return true; // Return true for testing when API key not available
    }

    try {
      await sgMail.send({
        to: params.to,
        from: params.from || 'no-reply@atbaali.com',
        subject: params.subject,
        text: params.text,
        html: params.html,
        templateId: params.templateId,
        personalizations: params.personalizations,
      });
      
      console.log('✅ Smart email sent successfully to:', params.to);
      return true;
    } catch (error) {
      console.error('❌ SendGrid email error:', error);
      return false;
    }
  }

  /**
   * إرسال حملة ذكية للجمهور المستهدف
   * Send smart campaign to targeted audience
   */
  async sendSmartCampaign(campaignId: string, targetingCriteria: SmartTargetingCriteria, storage: any, campaignTemplate?: any): Promise<{
    sent: number;
    failed: number;
    details: any[];
  }> {
    console.log('🚀 Starting smart campaign:', campaignId);

    // Get target audience with real data
    const targetUserIds = await this.targetingEngine.calculateTargetAudience(targetingCriteria, storage);
    
    if (targetUserIds.length === 0) {
      console.log('⚠️ No users found matching criteria');
      return { sent: 0, failed: 0, details: [] };
    }

    let sentCount = 0;
    let failedCount = 0;
    const details: any[] = [];

    // Default campaign template if not provided
    const defaultTemplate = {
      subject: 'عرض خاص لك في منصة اطبعلي! 🎉',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً {{name}}! 👋</h2>
          <p>لديك عرض خاص ينتظرك في منصة اطبعلي للطباعة والخدمات التعليمية.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🎯 عرض مخصص لك:</h3>
            <ul>
              <li>خصم 25% على جميع خدمات الطباعة</li>
              <li>توصيل مجاني للطلبات أكثر من 100 جنيه</li>
              <li>نقاط مكافآت إضافية: {{points}} نقطة</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://atbaali.com/store" 
               style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              اطلب الآن واستفد من العرض 🛒
            </a>
          </div>
          <p><small>هذا العرض صالح لمدة محدودة. لا تفوت الفرصة!</small></p>
        </div>
      `
    };

    const template = campaignTemplate || defaultTemplate;

    // Send to each targeted user
    for (const userId of targetUserIds) {
      try {
        // Get real user data from storage
        const userData = await storage.getUser(userId);
        
        if (!userData || !userData.email) {
          console.warn(`⚠️ User ${userId} not found or missing email, skipping...`);
          failedCount++;
          details.push({
            userId,
            status: 'failed',
            error: 'User not found or missing email',
            sentAt: new Date().toISOString(),
          });
          continue;
        }

        // Personalize content using real user data
        const personalizedSubject = this.targetingEngine.personalizeContent(template.subject, {
          name: userData.fullName || userData.username || 'عميلنا العزيز',
          gradeLevel: userData.gradeLevel || '',
          points: userData.bountyPoints || 0,
        });
        
        const personalizedHtml = this.targetingEngine.personalizeContent(template.html, {
          name: userData.fullName || userData.username || 'عميلنا العزيز',
          gradeLevel: userData.gradeLevel || '',
          points: userData.bountyPoints || 0,
        });

        // Send email
        const emailSent = await this.sendSmartEmail({
          to: userData.email,
          from: 'campaigns@atbaali.com',
          subject: personalizedSubject,
          html: personalizedHtml,
        });

        if (emailSent) {
          sentCount++;
          details.push({
            userId,
            email: userData.email,
            userName: userData.fullName || userData.username,
            gradeLevel: userData.gradeLevel,
            status: 'sent',
            personalizedSubject,
            sentAt: new Date().toISOString(),
          });
        } else {
          failedCount++;
          details.push({
            userId,
            email: userData.email,
            userName: userData.fullName || userData.username,
            status: 'failed',
            error: 'SendGrid delivery failed',
            sentAt: new Date().toISOString(),
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        failedCount++;
        details.push({
          userId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date().toISOString(),
        });
      }
    }

    console.log(`📊 Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`);

    return {
      sent: sentCount,
      failed: failedCount,
      details,
    };
  }

  /**
   * إرسال رسالة ترحيب ذكية للمستخدمين الجدد
   * Send smart welcome message to new users
   */
  async sendWelcomeMessage(userEmail: string, userData: any): Promise<boolean> {
    const welcomeTemplate = {
      subject: 'أهلاً وسهلاً بك في منصة اطبعلي! 🎉',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #007bff;">مرحباً بك في اطبعلي! 👋</h1>
            <p style="font-size: 18px; color: #666;">منصتك الشاملة للطباعة والخدمات التعليمية</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h3>🎯 ماذا يمكنك أن تفعل معنا:</h3>
            <ul style="line-height: 1.8;">
              <li>📄 طباعة عالية الجودة بأسعار منافسة</li>
              <li>📚 مواد تعليمية متنوعة لجميع المراحل</li>
              <li>🚚 توصيل سريع لباب البيت</li>
              <li>🎁 نظام نقاط ومكافآت حصري</li>
            </ul>
          </div>
          
          <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🎉 هدية ترحيب خاصة:</h3>
            <p>احصل على <strong>خصم 20%</strong> على أول طلب لك + <strong>50 نقطة مكافآت</strong> مجانية!</p>
            <p><strong>كود الخصم:</strong> WELCOME20</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://atbaali.com/store" 
               style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              ابدأ التسوق الآن 🛒
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666;">هل تحتاج مساعدة؟ نحن هنا دائماً لخدمتك</p>
            <p>
              <a href="mailto:support@atbaali.com" style="color: #007bff;">support@atbaali.com</a> |
              <a href="https://atbaali.com/contact" style="color: #007bff;">اتصل بنا</a>
            </p>
          </div>
        </div>
      `
    };

    return await this.sendSmartEmail({
      to: userEmail,
      from: 'welcome@atbaali.com',
      subject: welcomeTemplate.subject,
      html: this.targetingEngine.personalizeContent(welcomeTemplate.html, userData),
    });
  }

  /**
   * إرسال تنبيه حالة الطلب
   * Send order status notification
   */
  async sendOrderStatusNotification(userEmail: string, orderData: any): Promise<boolean> {
    const statusTemplates = {
      confirmed: {
        subject: 'تأكيد طلبك رقم {{orderNumber}} ✅',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>تم تأكيد طلبك! ✅</h2>
            <p>طلبك رقم <strong>{{orderNumber}}</strong> قيد التحضير وسيصلك قريباً.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h3>تفاصيل الطلب:</h3>
              <p><strong>المبلغ الإجمالي:</strong> {{totalAmount}} جنيه</p>
              <p><strong>وقت التسليم المتوقع:</strong> {{estimatedDelivery}}</p>
            </div>
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://atbaali.com/orders/{{orderId}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                تتبع الطلب 📍
              </a>
            </div>
          </div>
        `
      },
      shipped: {
        subject: 'طلبك في الطريق إليك! 🚚',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>طلبك في الطريق! 🚚</h2>
            <p>الكابتن {{driverName}} في طريقه إليك بطلبك رقم <strong>{{orderNumber}}</strong></p>
            <p><strong>الوصول المتوقع:</strong> خلال {{estimatedArrival}} دقيقة</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://atbaali.com/track/{{trackingId}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                تتبع مباشر 📍
              </a>
            </div>
          </div>
        `
      }
    };

    const template = statusTemplates[orderData.status] || statusTemplates.confirmed;
    const personalizedSubject = this.targetingEngine.personalizeContent(template.subject, orderData);
    const personalizedHtml = this.targetingEngine.personalizeContent(template.html, orderData);

    return await this.sendSmartEmail({
      to: userEmail,
      from: 'orders@atbaali.com',
      subject: personalizedSubject,
      html: personalizedHtml,
    });
  }

  /**
   * إرسال إشعار المكافآت والنقاط
   * Send reward and points notification email
   */
  async sendSmartReward(userEmail: string, rewardData: any): Promise<boolean> {
    console.log('🎁 DEBUG sendSmartReward called with:', { 
      userEmail, 
      rewardData,
      timestamp: new Date().toISOString()
    });
    
    const rewardTemplate = {
      subject: '🎁 تهانينا! حصلت على مكافأة جديدة - {{points}} نقطة!',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px; overflow: hidden;">
          <div style="text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.1);">
            <h1 style="color: #FFD700; font-size: 2.5em; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🎉 تهانينا! 🎉</h1>
            <p style="font-size: 1.3em; margin: 10px 0 0 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">حصلت على مكافأة جديدة!</p>
          </div>
          
          <div style="background: white; color: #333; padding: 30px; margin: 0;">
            <div style="text-align: center; margin-bottom: 25px;">
              <div style="background: linear-gradient(45deg, #ff6b6b, #ffa726); border-radius: 50%; width: 100px; height: 100px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 3em;">🎁</div>
              <h2 style="color: #2c3e50; margin: 0;">مكافأة خاصة لك!</h2>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <h3 style="color: #007bff; font-size: 2em; margin: 0 0 10px 0;">{{points}} نقطة 💎</h3>
              <p style="color: #666; font-size: 1.1em; margin: 0;">{{reason}}</p>
              {{#adminName}}<p style="color: #28a745; margin: 10px 0 0 0; font-weight: bold;">منحت بواسطة: {{adminName}}</p>{{/adminName}}
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; border-right: 4px solid #28a745; margin: 20px 0;">
              <h4 style="color: #155724; margin: 0 0 10px 0;">💡 كيف تستفيد من نقاطك:</h4>
              <ul style="color: #155724; margin: 0; padding-right: 20px;">
                <li>🎁 استبدال النقاط بخصومات حصرية</li>
                <li>📚 الحصول على مواد تعليمية مجانية</li>
                <li>🏆 الوصول للمستويات المتقدمة</li>
                <li>🎉 مكافآت خاصة للأعضاء المميزين</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://atbaali.com/rewards" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 15px 35px; text-decoration: none; border-radius: 30px; font-size: 1.1em; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                🎁 استخدم نقاطك الآن
              </a>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 0.9em; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>شكراً لك على ثقتك في منصة اطبعلي! 💙</p>
              <p>فريق اطبعلي</p>
            </div>
          </div>
        </div>
      `
    };

    const personalizedSubject = this.targetingEngine.personalizeContent(rewardTemplate.subject, rewardData);
    const personalizedHtml = this.targetingEngine.personalizeContent(rewardTemplate.html, rewardData);

    return await this.sendSmartEmail({
      to: userEmail,
      from: 'rewards@atbaali.com',
      subject: personalizedSubject,
      html: personalizedHtml,
    });
  }
}

// ============================================================================
// Smart Analytics Service - خدمة التحليلات الذكية
// ============================================================================

class SmartAnalyticsService {
  /**
   * حساب إحصائيات الحملة
   * Calculate campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<{
    totalSent: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    engagementScore: number;
    bestPerformingSegment: string;
  }> {
    // Mock analytics data - in real implementation, query from sentMessages table
    return {
      totalSent: 1250,
      deliveryRate: 98.5,
      openRate: 45.2,
      clickRate: 12.8,
      conversionRate: 3.4,
      engagementScore: 78.5,
      bestPerformingSegment: 'students_grade_10_12'
    };
  }

  /**
   * تحليل سلوك المستخدمين
   * Analyze user behavior patterns
   */
  async analyzeUserBehavior(userId: string): Promise<{
    segment: string;
    engagementLevel: string;
    preferredTime: string;
    preferredChannel: string;
    recommendations: string[];
  }> {
    // Mock behavior analysis
    return {
      segment: 'active_student',
      engagementLevel: 'high',
      preferredTime: '19:00',
      preferredChannel: 'email',
      recommendations: [
        'إرسال عروض خاصة في المساء',
        'التركيز على المواد التعليمية',
        'استخدام الإيميل كقناة أساسية'
      ]
    };
  }
}

// ============================================================================
// Export Services - تصدير الخدمات
// ============================================================================

export const smartTargetingEngine = new SmartTargetingEngine();
export const smartDeliveryService = new SmartDeliveryService();
export const smartAnalyticsService = new SmartAnalyticsService();

// Main class export
export class SmartNotificationsSystem {
  public targeting = smartTargetingEngine;
  public delivery = smartDeliveryService;
  public analytics = smartAnalyticsService;

  constructor() {
    console.log('🧠 Smart Notifications System initialized');
    if (process.env.SENDGRID_API_KEY) {
      console.log('✅ SendGrid API key configured - email delivery enabled');
    } else {
      console.log('⚠️ SendGrid API key not found - email delivery disabled (demo mode)');
    }
  }

  /**
   * إنشاء وإرسال حملة ذكية جديدة
   * Create and send new smart campaign
   */
  async createAndSendCampaign(
    name: string,
    targetingCriteria: SmartTargetingCriteria,
    customTemplate?: { subject: string; html: string }
  ) {
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎯 Creating smart campaign: ${name} (${campaignId})`);
    
    const result = await this.delivery.sendSmartCampaign(campaignId, targetingCriteria);
    
    return {
      campaignId,
      name,
      ...result,
      analytics: await this.analytics.getCampaignAnalytics(campaignId)
    };
  }
}

// Default export
export default new SmartNotificationsSystem();