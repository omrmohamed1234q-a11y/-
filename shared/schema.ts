import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  bountyPoints: integer("bounty_points").default(0),
  level: integer("level").default(1),
  experiencePoints: integer("experience_points").default(0),
  totalPrints: integer("total_prints").default(0),
  totalPurchases: integer("total_purchases").default(0),
  totalReferrals: integer("total_referrals").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  achievementsCount: integer("achievements_count").default(0),
  challengesCompleted: integer("challenges_completed").default(0),
  rank: text("rank").default("مبتدئ"), // "مبتدئ", "متوسط", "متقدم", "خبير", "أستاذ"
  title: text("title"), // Custom title earned through achievements
  isTeacher: boolean("is_teacher").default(false),
  teacherSubscription: boolean("teacher_subscription").default(false),
  lastLoginDate: timestamp("last_login_date"),
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
  icon: text("icon").notNull(),
  type: text("type").notNull(), // "daily", "weekly", "monthly", "special"
  category: text("category").notNull(), // "printing", "shopping", "social", "learning"
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard", "expert"
  actionType: text("action_type").notNull(), // "print_pages", "scan_documents", "refer_friend", "make_purchase"
  targetValue: integer("target_value").notNull(),
  pointsReward: integer("points_reward").notNull(),
  experienceReward: integer("experience_reward").default(0),
  bonusReward: jsonb("bonus_reward"), // {type: "discount", value: 10}
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  isDaily: boolean("is_daily").default(true),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userChallenges = pgTable("user_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeId: varchar("challenge_id").notNull().references(() => challenges.id),
  currentProgress: integer("current_progress").default(0),
  targetProgress: integer("target_progress").notNull(),
  completed: boolean("completed").default(false),
  status: text("status").default("active"), // "active", "completed", "failed", "abandoned"
  pointsEarned: integer("points_earned").default(0),
  experienceEarned: integer("experience_earned").default(0),
  bonusEarned: jsonb("bonus_earned"),
  completedAt: timestamp("completed_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievements System
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  icon: text("icon").notNull(),
  category: text("category").notNull(), // "printing", "purchases", "social", "challenges", "streaks"
  pointsReward: integer("points_reward").default(0),
  experienceReward: integer("experience_reward").default(0),
  badgeLevel: text("badge_level").notNull(), // "bronze", "silver", "gold", "platinum", "diamond"
  requirement: jsonb("requirement").notNull(), // {type: "print_count", value: 10}
  rarity: text("rarity").default("common"), // "common", "rare", "epic", "legendary"
  isActive: boolean("is_active").default(true),
  isSecret: boolean("is_secret").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id),
  progress: integer("progress").default(0),
  maxProgress: integer("max_progress").notNull(),
  isCompleted: boolean("is_completed").default(false),
  unlockedAt: timestamp("unlocked_at"),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leaderboards System
export const leaderboards = pgTable("leaderboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  type: text("type").notNull(), // "weekly", "monthly", "all_time", "seasonal"
  category: text("category").notNull(), // "points", "prints", "purchases", "challenges", "streaks"
  icon: text("icon").notNull(),
  resetFrequency: text("reset_frequency"), // "weekly", "monthly", "never"
  lastReset: timestamp("last_reset"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  prizes: jsonb("prizes"), // [{rank: 1, points: 1000, title: "Print Master"}]
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaderboardId: varchar("leaderboard_id").notNull().references(() => leaderboards.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  rank: integer("rank").notNull(),
  previousRank: integer("previous_rank"),
  metadata: jsonb("metadata"), // Additional data like streak, achievements earned
  period: text("period"), // "2024-W01", "2024-01" for weekly/monthly boards
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Points and Experience Tracking
export const pointsHistory = pgTable("points_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // "print_job", "purchase", "achievement", "challenge", "referral", "daily_login"
  points: integer("points").notNull(),
  experience: integer("experience").default(0),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  relatedId: varchar("related_id"), // ID of print job, order, etc.
  relatedType: text("related_type"), // "print_job", "order", "achievement", "challenge"
  multiplier: decimal("multiplier", { precision: 3, scale: 2 }).default("1.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily Streaks and Engagement
export const streaks = pgTable("streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  streakType: text("streak_type").notNull(), // "login", "print", "challenge", "purchase"
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  bonusMultiplier: decimal("bonus_multiplier", { precision: 3, scale: 2 }).default("1.00"),
  nextMilestone: integer("next_milestone").default(7),
  totalActiveDays: integer("total_active_days").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Seasonal Events and Special Challenges
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  icon: text("icon").notNull(),
  theme: text("theme").notNull(), // "ramadan", "back_to_school", "new_year", "summer"
  type: text("type").notNull(), // "seasonal", "holiday", "special"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  bonusMultiplier: decimal("bonus_multiplier", { precision: 3, scale: 2 }).default("1.00"),
  specialRewards: jsonb("special_rewards"),
  isActive: boolean("is_active").default(true),
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

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

export const insertUserChallengeSchema = createInsertSchema(userChallenges).omit({
  id: true,
  joinedAt: true,
  updatedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  createdAt: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboards).omit({
  id: true,
  createdAt: true,
});

export const insertLeaderboardEntrySchema = createInsertSchema(leaderboardEntries).omit({
  id: true,
  lastUpdated: true,
});

export const insertPointsHistorySchema = createInsertSchema(pointsHistory).omit({
  id: true,
  createdAt: true,
});

export const insertStreakSchema = createInsertSchema(streaks).omit({
  id: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
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
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboards.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardEntrySchema>;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type InsertPointsHistory = z.infer<typeof insertPointsHistorySchema>;
export type PointsHistory = typeof pointsHistory.$inferSelect;
export type InsertStreak = z.infer<typeof insertStreakSchema>;
export type Streak = typeof streaks.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
