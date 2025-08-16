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
