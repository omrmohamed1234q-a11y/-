import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("customer"), // admin, customer, VIP
  bountyPoints: integer("bounty_points").default(0),
  level: integer("level").default(1),
  totalPrints: integer("total_prints").default(0),
  totalPurchases: integer("total_purchases").default(0),
  totalReferrals: integer("total_referrals").default(0),
  isTeacher: boolean("is_teacher").default(false),
  teacherSubscription: boolean("teacher_subscription").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  isDigital: boolean("is_digital").default(false),
  downloadUrl: text("download_url"),
  grade: text("grade"),
  subject: text("subject"),
  publisher: text("publisher"),
  curriculum: text("curriculum"),
  stock: integer("stock").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0),
  tags: text("tags").array(),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const printJobs = pgTable("print_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(),
  pages: integer("pages").notNull(),
  copies: integer("copies").default(1),
  colorMode: text("color_mode").notNull(), // "color" | "grayscale"
  paperSize: text("paper_size").default("A4"),
  doubleSided: boolean("double_sided").default(false),
  status: text("status").notNull(), // "pending" | "printing" | "completed" | "failed"
  progress: integer("progress").default(0),
  queuePosition: integer("queue_position"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  items: jsonb("items").notNull(), // Array of {productId, quantity, price}
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  shippingAddress: jsonb("shipping_address"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("pending"),
  pointsUsed: integer("points_used").default(0),
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  pointsCost: integer("points_cost").notNull(),
  rewardType: text("reward_type").notNull(), // "discount" | "free_prints" | "digital_book" | "physical_item"
  rewardValue: jsonb("reward_value"), // Flexible reward configuration
  imageUrl: text("image_url"),
  available: boolean("available").default(true),
  limitPerUser: integer("limit_per_user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  rewardId: varchar("reward_id").notNull().references(() => rewards.id),
  pointsSpent: integer("points_spent").notNull(),
  status: text("status").default("pending"), // "pending" | "used" | "expired"
  expiresAt: timestamp("expires_at"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  type: text("type").notNull(), // "print_pages" | "scan_documents" | "refer_friend" | "make_purchase"
  targetValue: integer("target_value").notNull(),
  pointsReward: integer("points_reward").notNull(),
  isDaily: boolean("is_daily").default(true),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userChallenges = pgTable("user_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeId: varchar("challenge_id").notNull().references(() => challenges.id),
  currentProgress: integer("current_progress").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  date: timestamp("date").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  category: text("category").notNull(),
  templateType: text("template_type").notNull(),
  content: jsonb("content").notNull(),
  previewUrl: text("preview_url"),
  downloadUrl: text("download_url"),
  isAiGenerated: boolean("is_ai_generated").default(false),
  userId: varchar("user_id").references(() => users.id),
  public: boolean("public").default(true),
  downloads: integer("downloads").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher subscription plans
export const teacherPlans = pgTable("teacher_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // Duration in days
  features: text("features").array(),
  featuresEn: text("features_en").array(),
  maxStudents: integer("max_students").default(30),
  maxMaterials: integer("max_materials").default(100),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher subscriptions
export const teacherSubscriptions = pgTable("teacher_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  planId: varchar("plan_id").notNull().references(() => teacherPlans.id),
  status: text("status").notNull().default("active"), // active, expired, cancelled
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").default(true),
  studentsCount: integer("students_count").default(0),
  materialsCount: integer("materials_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher materials
export const teacherMaterials = pgTable("teacher_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  grade: text("grade").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type").notNull(),
  isPublic: boolean("is_public").default(false),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student subscriptions to teachers
export const studentSubscriptions = pgTable("student_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  status: text("status").notNull().default("active"), // active, expired, cancelled
  accessCode: text("access_code").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chatbot conversations
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id").notNull(),
  messages: jsonb("messages").notNull(), // Array of {role, content, timestamp}
  status: text("status").default("active"), // active, resolved, escalated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order tracking for animations
export const orderTracking = pgTable("order_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  status: text("status").notNull(), // processing, printing, shipped, delivered
  message: text("message"),
  messageEn: text("message_en"),
  estimatedTime: timestamp("estimated_time"),
  actualTime: timestamp("actual_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertPrintJobSchema = createInsertSchema(printJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherPlanSchema = createInsertSchema(teacherPlans).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherSubscriptionSchema = createInsertSchema(teacherSubscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherMaterialSchema = createInsertSchema(teacherMaterials).omit({
  id: true,
  createdAt: true,
});

export const insertStudentSubscriptionSchema = createInsertSchema(studentSubscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderTrackingSchema = createInsertSchema(orderTracking).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertPrintJob = z.infer<typeof insertPrintJobSchema>;
export type PrintJob = typeof printJobs.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;

// New types
export type InsertTeacherPlan = z.infer<typeof insertTeacherPlanSchema>;
export type TeacherPlan = typeof teacherPlans.$inferSelect;
export type InsertTeacherSubscription = z.infer<typeof insertTeacherSubscriptionSchema>;
export type TeacherSubscription = typeof teacherSubscriptions.$inferSelect;
export type InsertTeacherMaterial = z.infer<typeof insertTeacherMaterialSchema>;
export type TeacherMaterial = typeof teacherMaterials.$inferSelect;
export type InsertStudentSubscription = z.infer<typeof insertStudentSubscriptionSchema>;
export type StudentSubscription = typeof studentSubscriptions.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertOrderTracking = z.infer<typeof insertOrderTrackingSchema>;
export type OrderTracking = typeof orderTracking.$inferSelect;
