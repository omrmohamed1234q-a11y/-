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
  countryCode: text("country_code").default("+20"), // Default to Egypt
  age: integer("age"),
  gradeLevel: text("grade_level"), // "kg_1", "kg_2", "primary_1" to "primary_6", "preparatory_1" to "preparatory_3", "secondary_1" to "secondary_3", "university", "teacher", "parent"
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

// Secure Admin Accounts table
export const secureAdmins = pgTable("secure_admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("admin"), // admin, super_admin
  permissions: text("permissions").array().default(["read", "write"]), // Array of permissions
  
  // Security Features
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  failedAttempts: integer("failed_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  mustChangePassword: boolean("must_change_password").default(false),
  
  // Audit Trail
  createdBy: varchar("created_by"),
  ipWhitelist: text("ip_whitelist").array(), // Array of allowed IPs
  sessionTimeout: integer("session_timeout").default(900), // 15 minutes default
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Secure Driver Accounts table
export const secureDrivers = pgTable("secure_drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  driverCode: text("driver_code").notNull().unique(), // Unique driver code
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  
  // Driver Info
  licenseNumber: text("license_number").notNull(),
  vehicleType: text("vehicle_type").notNull(), // "motorcycle", "car", "truck"
  vehiclePlate: text("vehicle_plate").notNull(),
  
  // Security Features
  isActive: boolean("is_active").default(true),
  status: text("status").notNull().default("offline"), // "online", "offline", "busy", "suspended"
  lastLogin: timestamp("last_login"),
  failedAttempts: integer("failed_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  
  // Performance Metrics
  totalDeliveries: integer("total_deliveries").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  ratingCount: integer("rating_count").default(0),
  
  // Audit Trail
  createdBy: varchar("created_by"),
  sessionTimeout: integer("session_timeout").default(900), // 15 minutes default
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Security Logs table
export const securityLogs = pgTable("security_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Can be admin or driver ID
  userType: text("user_type").notNull(), // "admin", "driver"
  action: text("action").notNull(), // "login", "logout", "failed_login", "password_change", etc.
  
  // Security Context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"), // Geolocation if available
  
  // Request Details
  endpoint: text("endpoint"),
  method: text("method"),
  success: boolean("success").default(false),
  errorMessage: text("error_message"),
  
  // Additional Data
  metadata: jsonb("metadata"), // Additional context data
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Partners/Print Shops table
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"), // Brief description for cards
  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),
  
  // Contact & Location
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city").notNull(),
  governorate: text("governorate").notNull(),
  coordinates: jsonb("coordinates"), // {lat: number, lng: number}
  
  // Business Info
  businessType: text("business_type").notNull(), // "print_shop" | "bookstore" | "library" | "stationery"
  establishedYear: integer("established_year"),
  workingHours: jsonb("working_hours"), // {open: "09:00", close: "22:00", days: ["sunday", "monday"...]}
  
  // Services & Offerings
  services: text("services").array(), // ["printing", "binding", "scanning", "design", "books", "stationery"]
  specialties: text("specialties").array(), // ["textbooks", "exam_materials", "university_notes", "art_supplies"]
  
  // Media Gallery
  galleryImages: text("gallery_images").array(), // Array of image URLs
  videoUrl: text("video_url"), // Introduction video
  
  // Ratings & Reviews
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"), // Average rating
  reviewCount: integer("review_count").default(0),
  
  // Operational Status
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  isFeatured: boolean("is_featured").default(false), // For homepage display
  displayOrder: integer("display_order").default(0), // For sorting on homepage
  
  // Business Features
  hasDelivery: boolean("has_delivery").default(false),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }),
  minOrderForDelivery: decimal("min_order_for_delivery", { precision: 10, scale: 2 }),
  acceptsOnlinePayment: boolean("accepts_online_payment").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  buttonText: text("button_text").notNull(),
  buttonAction: text("button_action"), // "link" | "modal" | "action"
  buttonUrl: text("button_url"),
  imageUrl: text("image_url").notNull(),
  position: integer("position").default(0), // For ordering
  isActive: boolean("is_active").default(true),
  backgroundColor: text("background_color").default("#ff6b35"), // Orange like talabat
  textColor: text("text_color").default("#ffffff"),
  category: text("category").default("service"), // "service" | "promotion" | "announcement" | "article"
  
  // Article content fields
  articleContent: text("article_content"), // Rich text content for articles
  articleAuthor: text("article_author"), // Author name for articles
  articleReadTime: integer("article_read_time"), // Estimated read time in minutes
  articleTags: text("article_tags").array(), // Tags for categorization
  
  // Homepage display control
  showOnHomepage: boolean("show_on_homepage").default(false), // Whether to show on homepage
  homepagePriority: integer("homepage_priority").default(0), // Priority for homepage display (1-4)
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  
  // Educational Curriculum Fields
  curriculumType: text("curriculum_type"), // "egyptian_arabic" | "egyptian_languages" | "azhar" | "igcse" | "american" | "ib" | "stem"
  subject: text("subject"), // "arabic" | "math" | "science" | "chemistry" | "physics" | "biology" | etc.
  gradeLevel: text("grade_level"), // "primary_1" | "primary_2" | ... | "secondary_12" | "university"
  authorPublisher: text("author_publisher"), // Teacher/Author/Publisher name
  
  // Product Type and Format
  productTypes: text("product_types").array(), // ["book", "pdf", "worksheets", "exams", "solutions"]
  isDigital: boolean("is_digital").default(false),
  downloadUrl: text("download_url"),
  
  // Print Options
  coverType: text("cover_type"), // "color" | "black_white"
  availableCopies: integer("available_copies").default(0),
  downloadLimits: text("download_limits"), // "once" | "unlimited"
  canPrintDirectly: boolean("can_print_directly").default(false),
  
  // Legacy fields for backwards compatibility
  grade: text("grade"),
  publisher: text("publisher"),
  curriculum: text("curriculum"),
  stock: integer("stock").default(0),
  
  // Ratings and engagement
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0),
  tags: text("tags").array(),
  featured: boolean("featured").default(false),
  teacherOnly: boolean("teacher_only").default(false),
  vip: boolean("vip").default(false),
  variants: jsonb("variants").default([]), // Array of {name, price, stock}
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
  paperSize: text("paper_size").default("A4"), // "A4" | "A3"
  paperType: text("paper_type").default("plain"), // "plain" | "glossy" | "matte" | "sticker"
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
  orderNumber: text("order_number").notNull().unique(),
  items: jsonb("items").notNull(), // Array of {productId, quantity, price, name}
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled"
  statusText: text("status_text"), // Arabic status text
  
  // Address and delivery
  deliveryAddress: text("delivery_address"),
  shippingAddress: jsonb("shipping_address"), // Detailed address object
  deliveryMethod: text("delivery_method"), // "delivery" | "pickup"
  deliverySlot: text("delivery_slot"), // "asap" | "scheduled"
  scheduledDate: text("scheduled_date"),
  scheduledTime: text("scheduled_time"),
  
  // Payment
  paymentMethod: text("payment_method"), // "cash" | "card" | "vodafone_cash" | "paymob" | "paytabs" | "fawry"
  paymentMethodText: text("payment_method_text"), // Arabic payment method text
  paymentStatus: text("payment_status").default("pending"),
  
  // Points and vouchers
  pointsUsed: integer("points_used").default(0),
  pointsEarned: integer("points_earned").default(0),
  voucherCode: text("voucher_code"),
  voucherDiscount: decimal("voucher_discount", { precision: 10, scale: 2 }).default("0"),
  
  // Driver and tracking
  driverId: varchar("driver_id"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  estimatedDelivery: integer("estimated_delivery"), // Minutes
  
  // Notes and instructions
  deliveryNotes: text("delivery_notes"), // Customer notes for delivery
  driverNotes: text("driver_notes"), // Driver notes about delivery
  adminNotes: text("admin_notes"), // Admin internal notes
  
  // Ratings and feedback
  rating: integer("rating"), // 1-5 stars
  review: text("review"),
  
  // Timeline tracking
  timeline: jsonb("timeline").default([]), // Array of {event, timestamp, note}
  confirmedAt: timestamp("confirmed_at"),
  preparingAt: timestamp("preparing_at"),
  readyAt: timestamp("ready_at"),
  outForDeliveryAt: timestamp("out_for_delivery_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Delivery drivers table
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverCode: text("driver_code").notNull().unique(), // Unique driver identifier
  username: text("username").notNull().unique(), // Username for login (simplified)
  name: text("name").notNull(),
  email: text("email").unique(), // Made optional
  phone: text("phone").notNull(),
  countryCode: text("country_code").default("+20"),
  
  // Vehicle information
  vehicleType: text("vehicle_type"), // "motorcycle", "car", "bicycle", "walking"
  vehiclePlate: text("vehicle_plate"),
  vehicleModel: text("vehicle_model"),
  vehicleColor: text("vehicle_color"),
  
  // Work information
  status: text("status").default("offline"), // "online", "offline", "busy", "suspended"
  isAvailable: boolean("is_available").default(true),
  currentLocation: jsonb("current_location"), // {lat, lng, timestamp}
  workingArea: text("working_area"), // Assigned delivery area
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0),
  
  // Performance metrics
  totalDeliveries: integer("total_deliveries").default(0),
  completedDeliveries: integer("completed_deliveries").default(0),
  cancelledDeliveries: integer("cancelled_deliveries").default(0),
  averageDeliveryTime: integer("average_delivery_time"), // in minutes
  earnings: decimal("earnings", { precision: 10, scale: 2 }).default("0.00"),
  
  // Account information
  nationalId: text("national_id"),
  dateOfBirth: timestamp("date_of_birth"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  
  // Authentication
  password: text("password"), // Hashed password for driver login
  isVerified: boolean("is_verified").default(false),
  documentsVerified: boolean("documents_verified").default(false),
  
  // Activity tracking
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  lastLocationUpdate: timestamp("last_location_update"),
  shiftStartTime: timestamp("shift_start_time"),
  shiftEndTime: timestamp("shift_end_time"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Driver location tracking
export const driverLocations = pgTable("driver_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => drivers.id),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  accuracy: decimal("accuracy", { precision: 8, scale: 2 }), // GPS accuracy in meters
  speed: decimal("speed", { precision: 8, scale: 2 }), // Speed in km/h
  bearing: decimal("bearing", { precision: 6, scale: 2 }), // Direction in degrees
  timestamp: timestamp("timestamp").defaultNow(),
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
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  variant: text("variant"),
  notes: text("notes"),
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

// Teacher profiles with additional information
export const teacherProfiles = pgTable("teacher_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  teacherCode: text("teacher_code").notNull().unique(), // Unique teacher identifier
  specialization: text("specialization").notNull(), // Subject specialization
  school: text("school"), // School name
  educationLevel: text("education_level"), // "bachelor", "master", "phd"
  university: text("university"), // University graduated from
  graduationYear: integer("graduation_year"),
  yearsOfExperience: integer("years_of_experience").default(0),
  gradesTaught: text("grades_taught").array(), // Array of grade levels taught
  subjectsSpecialty: text("subjects_specialty").array(), // Specialized subjects
  certifications: text("certifications").array(), // Teaching certifications
  bio: text("bio"), // Teacher biography
  profileImageUrl: text("profile_image_url"),
  isVerified: boolean("is_verified").default(false), // School verification
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0),
  studentsCount: integer("students_count").default(0),
  materialsCount: integer("materials_count").default(0),
  totalDownloads: integer("total_downloads").default(0),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  status: text("status").default("active"), // "active", "inactive", "suspended"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Admin settings for configurable UI elements
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  category: text("category").default("general"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vouchers for discount management
export const vouchers = pgTable("vouchers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // "percentage" | "fixed"
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minSubtotal: decimal("min_subtotal", { precision: 10, scale: 2 }).default("0.00"),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit").default(1),
  usageCount: integer("usage_count").default(0),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rewards rules for gamification
export const rewardsRules = pgTable("rewards_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  event: text("event").notNull(), // "purchase" | "daily_login" | "referral" | "challenge"
  points: integer("points").notNull(),
  conditions: jsonb("conditions").default({}), // Event-specific conditions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit log for admin actions
export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  tableName: text("table_name").notNull(),
  recordId: text("record_id"),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Admin file uploads
export const adminUploads = pgTable("admin_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  category: text("category").default("general"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
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
}).extend({
  // Make required fields optional with sensible defaults
  orderNumber: z.string().optional(),
  items: z.array(z.any()).default([]),
  subtotal: z.string().or(z.number()).optional(),
  totalAmount: z.string().or(z.number()).optional(),
  status: z.string().default("pending"),
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherPlanSchema = createInsertSchema(teacherPlans).omit({
  id: true,
  createdAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminUploadSchema = createInsertSchema(adminUploads).omit({
  id: true,
  createdAt: true,
});

export const insertOrderTrackingSchema = createInsertSchema(orderTracking).omit({
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

export const insertVoucherSchema = createInsertSchema(vouchers).omit({
  id: true,
  createdAt: true,
});

export const insertRewardsRuleSchema = createInsertSchema(rewardsRules).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true,
});

// Additional types
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type AdminUpload = typeof adminUploads.$inferSelect;
export type InsertAdminUpload = z.infer<typeof insertAdminUploadSchema>;
export type Voucher = typeof vouchers.$inferSelect;
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type RewardsRule = typeof rewardsRules.$inferSelect;
export type InsertRewardsRule = z.infer<typeof insertRewardsRuleSchema>;
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

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
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type OrderTracking = typeof orderTracking.$inferSelect;
export type InsertOrderTracking = z.infer<typeof insertOrderTrackingSchema>;

// Delivery slots for configurable time windows
export const deliverySlots = pgTable("delivery_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "12:00"
  days: text("days").array().notNull(), // ["monday", "tuesday", etc.]
  isActive: boolean("is_active").default(true),
  maxOrders: integer("max_orders").default(50),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shipping fees configuration
export const shippingFees = pgTable("shipping_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  zone: text("zone").notNull(), // "cairo", "giza", "alexandria", etc.
  weightMin: decimal("weight_min", { precision: 5, scale: 2 }).default("0.00"),
  weightMax: decimal("weight_max", { precision: 5, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  freeShippingThreshold: decimal("free_shipping_threshold", { precision: 10, scale: 2 }),
  estimatedDays: integer("estimated_days").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment methods configuration
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  type: text("type").notNull(), // "google_pay", "vodafone_cash", "bank_transfer", "cod"
  isActive: boolean("is_active").default(true),
  processingFee: decimal("processing_fee", { precision: 5, scale: 2 }).default("0.00"),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }).default("0.00"),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }),
  config: jsonb("config").default({}), // Provider-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
});

// System analytics for tracking business metrics
export const systemAnalytics = pgTable("system_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  metric: text("metric").notNull(), // "orders_total", "revenue_total", "conversion_rate", etc.
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Curriculum and education metadata
export const curriculum = pgTable("curriculum", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  country: text("country").default("egypt"),
  grades: text("grades").array().notNull(), // ["grade-1", "grade-2", etc.]
  subjects: text("subjects").array().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertDeliverySlotSchema = createInsertSchema(deliverySlots).omit({
  id: true,
  createdAt: true,
});

export const insertShippingFeeSchema = createInsertSchema(shippingFees).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
});

// Partner Products table - marketplace model where each partner manages their inventory
export const partnerProducts = pgTable("partner_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category").notNull(), // كتب، أدوات مكتبية، مطبوعات، etc.
  subcategory: varchar("subcategory"), // فئة فرعية
  imageUrl: varchar("image_url"),
  inStock: boolean("in_stock").default(true),
  quantity: integer("quantity").default(0),
  unit: varchar("unit").default("قطعة"), // وحدة القياس
  tags: text("tags").array(), // العلامات للبحث
  featured: boolean("featured").default(false),
  gradeLevel: varchar("grade_level"), // للكتب المدرسية
  subject: varchar("subject"), // للكتب المدرسية
  isbn: varchar("isbn"), // للكتب
  publisher: varchar("publisher"), // للكتب
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPartnerProductSchema = createInsertSchema(partnerProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SelectPartnerProduct = typeof partnerProducts.$inferSelect;
export type InsertPartnerProduct = z.infer<typeof insertPartnerProductSchema>;

export const insertSystemAnalyticsSchema = createInsertSchema(systemAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertCurriculumSchema = createInsertSchema(curriculum).omit({
  id: true,
  createdAt: true,
});

// Types for new tables
export type DeliverySlot = typeof deliverySlots.$inferSelect;
export type InsertDeliverySlot = z.infer<typeof insertDeliverySlotSchema>;
export type ShippingFee = typeof shippingFees.$inferSelect;
export type InsertShippingFee = z.infer<typeof insertShippingFeeSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type SystemAnalytics = typeof systemAnalytics.$inferSelect;
export type InsertSystemAnalytics = z.infer<typeof insertSystemAnalyticsSchema>;
export type Curriculum = typeof curriculum.$inferSelect;
export type InsertCurriculum = z.infer<typeof insertCurriculumSchema>;

// Enhanced Coupons and discount codes system
export const adminCoupons = pgTable("admin_coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' or 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumOrderValue: decimal("minimum_order_value", { precision: 10, scale: 2 }).default('0'),
  maximumDiscount: decimal("maximum_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"), // null = unlimited
  usageCount: integer("usage_count").default(0),
  maxUsagePerUser: integer("max_usage_per_user").default(1), // max uses per user
  targetUserType: varchar("target_user_type", { length: 20 }).default("all"), // 'all', 'new', 'existing', 'specific', 'grade'
  targetUserIds: text("target_user_ids").array(), // array of specific user IDs
  targetGradeLevel: varchar("target_grade_level", { length: 50 }), // specific grade targeting
  targetLocation: varchar("target_location", { length: 100 }), // location-based targeting
  sendNotification: boolean("send_notification").default(false),
  notificationMessage: text("notification_message"),
  notificationSent: boolean("notification_sent").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  applicableProducts: jsonb("applicable_products"), // null = all products, or array of product IDs
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminCouponSchema = createInsertSchema(adminCoupons).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAdminCoupon = z.infer<typeof insertAdminCouponSchema>;
export type AdminCoupon = typeof adminCoupons.$inferSelect;

// Coupon usage tracking
export const couponUsageTracking = pgTable("coupon_usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").references(() => adminCoupons.id, { onDelete: "cascade" }).notNull(),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  userEmail: varchar("user_email", { length: 255 }),
  userName: varchar("user_name", { length: 255 }),
  userGradeLevel: varchar("user_grade_level", { length: 50 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  orderValue: decimal("order_value", { precision: 10, scale: 2 }),
  usageNumber: integer("usage_number").default(1), // which usage number for this user
  usedAt: timestamp("used_at").defaultNow(),
});

// Coupon notifications system
export const couponNotifications = pgTable("coupon_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").references(() => adminCoupons.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  notificationType: varchar("notification_type", { length: 50 }).default("coupon"), // 'coupon', 'expiry_reminder', 'usage_limit'
  isRead: boolean("is_read").default(false),
  isClicked: boolean("is_clicked").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  clickedAt: timestamp("clicked_at"),
});

export type CouponUsageTracking = typeof couponUsageTracking.$inferSelect;
export type CouponNotification = typeof couponNotifications.$inferSelect;

// Driver types and schemas
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = typeof drivers.$inferInsert;
export type DriverLocation = typeof driverLocations.$inferSelect;
export type InsertDriverLocation = typeof driverLocations.$inferInsert;

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDriverLocationSchema = createInsertSchema(driverLocations).omit({
  id: true,
  timestamp: true,
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// Partners/Print Shops types
export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

// Security System Schemas
export const insertSecureAdminSchema = createInsertSchema(secureAdmins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  failedAttempts: true,
  lockedUntil: true,
});

export const insertSecureDriverSchema = createInsertSchema(secureDrivers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  failedAttempts: true,
  lockedUntil: true,
  totalDeliveries: true,
  rating: true,
  ratingCount: true,
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  createdAt: true,
});

// Security System Types
export type SecureAdmin = typeof secureAdmins.$inferSelect;
export type InsertSecureAdmin = z.infer<typeof insertSecureAdminSchema>;
export type SecureDriver = typeof secureDrivers.$inferSelect;
export type InsertSecureDriver = z.infer<typeof insertSecureDriverSchema>;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;
