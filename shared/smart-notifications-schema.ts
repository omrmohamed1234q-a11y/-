import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// نظام التنبيهات الذكي - Smart Notifications System
// ============================================================================

// جدول الحملات الذكية - Smart Campaigns
export const smartCampaigns = pgTable("smart_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  
  // معلومات الحملة - Campaign Info
  type: varchar("type", { length: 50 }).notNull(), // 'promotional', 'transactional', 'educational', 'reminder'
  status: varchar("status", { length: 20 }).default("draft"), // 'draft', 'active', 'paused', 'completed'
  priority: varchar("priority", { length: 20 }).default("normal"), // 'low', 'normal', 'high', 'urgent'
  
  // محتوى الرسالة - Message Content
  subject: text("subject").notNull(),
  emailContent: text("email_content"),
  smsContent: text("sms_content"),
  pushContent: text("push_content"),
  
  // قنوات الإرسال - Delivery Channels
  channels: varchar("channels").array().default(['email']), // ['email', 'sms', 'push', 'in_app']
  
  // الجدولة - Scheduling
  scheduledAt: timestamp("scheduled_at"),
  sendImmediately: boolean("send_immediately").default(false),
  timezone: varchar("timezone", { length: 50 }).default("Africa/Cairo"),
  
  // الاستهداف الذكي - Smart Targeting
  targetingRules: jsonb("targeting_rules").default({}), // JSON with complex targeting rules
  estimatedAudience: integer("estimated_audience").default(0),
  
  // إعدادات متقدمة - Advanced Settings
  personalizeContent: boolean("personalize_content").default(true),
  abTestEnabled: boolean("ab_test_enabled").default(false),
  trackEngagement: boolean("track_engagement").default(true),
  
  // إحصائيات - Statistics
  totalSent: integer("total_sent").default(0),
  totalDelivered: integer("total_delivered").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  
  // معلومات إضافية - Additional Info
  createdBy: varchar("created_by").notNull(),
  metadata: jsonb("metadata").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول قواعد الاستهداف - Targeting Rules
export const targetingRules = pgTable("targeting_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => smartCampaigns.id, { onDelete: "cascade" }).notNull(),
  
  // نوع القاعدة - Rule Type
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // 'demographic', 'behavioral', 'geographic', 'engagement'
  operator: varchar("operator", { length: 20 }).notNull(), // 'equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in_range'
  
  // المعايير - Criteria
  field: varchar("field", { length: 100 }).notNull(), // 'age', 'grade_level', 'location', 'total_orders', 'last_activity'
  value: text("value").notNull(), // The comparison value
  
  // المنطق - Logic
  logicOperator: varchar("logic_operator", { length: 10 }).default("AND"), // 'AND', 'OR'
  priority: integer("priority").default(1),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول الرسائل المرسلة - Sent Messages
export const sentMessages = pgTable("sent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => smartCampaigns.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").notNull(), // Reference to users table
  
  // تفاصيل الرسالة - Message Details
  channel: varchar("channel", { length: 20 }).notNull(), // 'email', 'sms', 'push', 'in_app'
  subject: text("subject"),
  content: text("content").notNull(),
  personalizedContent: jsonb("personalized_content"), // Personalized variables used
  
  // حالة الإرسال - Delivery Status
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'sent', 'delivered', 'failed', 'bounced'
  deliveryAttempts: integer("delivery_attempts").default(0),
  
  // تتبع التفاعل - Engagement Tracking
  isOpened: boolean("is_opened").default(false),
  openedAt: timestamp("opened_at"),
  isClicked: boolean("is_clicked").default(false),
  clickedAt: timestamp("clicked_at"),
  clickedUrl: text("clicked_url"),
  
  // معلومات تقنية - Technical Info
  providerResponse: jsonb("provider_response"), // Response from email/SMS provider
  errorMessage: text("error_message"),
  
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
});

// جدول تتبع سلوك المستخدمين - User Behavior Tracking
export const userBehaviorTracking = pgTable("user_behavior_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  
  // نشاط الموقع - Site Activity
  pageViews: integer("page_views").default(0),
  sessionDuration: integer("session_duration").default(0), // in seconds
  lastVisitAt: timestamp("last_visit_at"),
  
  // سلوك الطلبات - Order Behavior
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).default("0"),
  lastOrderAt: timestamp("last_order_at"),
  
  // التفاعل مع التنبيهات - Notification Engagement
  notificationsReceived: integer("notifications_received").default(0),
  notificationsOpened: integer("notifications_opened").default(0),
  notificationsClicked: integer("notifications_clicked").default(0),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }).default("0"), // 0-100 score
  
  // تفضيلات المستخدم - User Preferences
  preferredChannel: varchar("preferred_channel", { length: 20 }).default("email"),
  optedOutChannels: varchar("opted_out_channels").array().default([]),
  bestTimeToSend: varchar("best_time_to_send", { length: 10 }), // "09:00", "14:30", etc.
  
  // بيانات محسوبة - Calculated Fields
  customerSegment: varchar("customer_segment", { length: 50 }), // 'new', 'active', 'at_risk', 'churned', 'vip'
  lifetimeValue: decimal("lifetime_value", { precision: 10, scale: 2 }).default("0"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول قوالب الرسائل - Message Templates
export const messageTemplates = pgTable("message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  
  // نوع القالب - Template Type
  category: varchar("category", { length: 50 }).notNull(), // 'welcome', 'order_confirmation', 'promotion', 'reminder'
  channel: varchar("channel", { length: 20 }).notNull(), // 'email', 'sms', 'push'
  
  // محتوى القالب - Template Content
  subject: text("subject"),
  content: text("content").notNull(),
  variables: jsonb("variables").default({}), // Available personalization variables
  
  // إعدادات - Settings
  isActive: boolean("is_active").default(true),
  isSystem: boolean("is_system").default(false), // System templates can't be deleted
  usageCount: integer("usage_count").default(0),
  
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول الجدولة المتقدمة - Advanced Scheduling
export const scheduledJobs = pgTable("scheduled_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => smartCampaigns.id, { onDelete: "cascade" }).notNull(),
  
  // تفاصيل الجدولة - Scheduling Details
  jobType: varchar("job_type", { length: 50 }).notNull(), // 'immediate', 'scheduled', 'recurring', 'trigger_based'
  triggerCondition: jsonb("trigger_condition"), // Conditions for trigger-based jobs
  
  // التوقيت - Timing
  scheduledFor: timestamp("scheduled_for").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("Africa/Cairo"),
  recurringPattern: varchar("recurring_pattern", { length: 100 }), // cron-like pattern
  
  // حالة المهمة - Job Status
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'processing', 'completed', 'failed', 'cancelled'
  processedAt: timestamp("processed_at"),
  
  // إحصائيات المهمة - Job Statistics
  targetAudience: integer("target_audience").default(0),
  processedCount: integer("processed_count").default(0),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  
  // معلومات إضافية - Additional Info
  errorLog: text("error_log"),
  executionTime: integer("execution_time"), // in milliseconds
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// Types and Schemas for TypeScript
// ============================================================================

// Smart Campaign Types
export type SmartCampaign = typeof smartCampaigns.$inferSelect;
export const insertSmartCampaignSchema = createInsertSchema(smartCampaigns).omit({
  id: true,
  totalSent: true,
  totalDelivered: true,
  totalOpened: true,
  totalClicked: true,
  estimatedAudience: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSmartCampaign = z.infer<typeof insertSmartCampaignSchema>;

// Targeting Rules Types
export type TargetingRule = typeof targetingRules.$inferSelect;
export const insertTargetingRuleSchema = createInsertSchema(targetingRules).omit({
  id: true,
  createdAt: true,
});
export type InsertTargetingRule = z.infer<typeof insertTargetingRuleSchema>;

// Sent Messages Types
export type SentMessage = typeof sentMessages.$inferSelect;
export const insertSentMessageSchema = createInsertSchema(sentMessages).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
});
export type InsertSentMessage = z.infer<typeof insertSentMessageSchema>;

// User Behavior Types
export type UserBehavior = typeof userBehaviorTracking.$inferSelect;
export const insertUserBehaviorSchema = createInsertSchema(userBehaviorTracking).omit({
  id: true,
  updatedAt: true,
});
export type InsertUserBehavior = z.infer<typeof insertUserBehaviorSchema>;

// Message Templates Types
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

// Scheduled Jobs Types
export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export const insertScheduledJobSchema = createInsertSchema(scheduledJobs).omit({
  id: true,
  processedAt: true,
  targetAudience: true,
  processedCount: true,
  successCount: true,
  failureCount: true,
  executionTime: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScheduledJob = z.infer<typeof insertScheduledJobSchema>;