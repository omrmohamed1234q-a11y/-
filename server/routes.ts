import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { 
  insertUserSchema, insertProductSchema, insertPrintJobSchema, insertOrderSchema, 
  insertCartItemSchema, insertTeacherPlanSchema, insertOrderTrackingSchema, 
  insertChatConversationSchema, users, products, orders, teacherPlans, 
  teacherSubscriptions, chatConversations, orderTracking
} from "@shared/schema";
import { createClient } from '@supabase/supabase-js';
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc, count } from "drizzle-orm";
import { generateChatResponse } from "./openai";

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes - Real Supabase implementation

  // Supabase authentication routes - Real implementation
  app.post('/api/auth/supabase/login', async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          message: "البريد الإلكتروني وكلمة المرور مطلوبان" 
        });
      }
      
      // Special handling for admin user
      if (email === 'printformead1@gmail.com' && password === 'adminadminS582038s123') {
        try {
          const adminUser = await storage.getUserByEmail(email);
          if (adminUser) {
            return res.json({ 
              success: true, 
              message: "تم تسجيل الدخول بنجاح",
              user: { 
                id: adminUser.id,
                email: adminUser.email,
                fullName: adminUser.full_name || "Admin User",
                role: 'admin',
                provider: 'local',
                isPremium: true,
                bounty_points: adminUser.bounty_points || 1000,
                level: adminUser.level || 10
              },
              token: 'admin-token-' + adminUser.id,
              refresh_token: 'admin-refresh-token'
            });
          }
        } catch (error) {
          console.error("Admin login error:", error);
        }
      }
      
      // Regular Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (!data.user || !data.session) {
        throw new Error("فشل في تسجيل الدخول");
      }
      
      res.json({ 
        success: true, 
        message: "تم تسجيل الدخول بنجاح",
        user: { 
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || "مستخدم عزيز",
          provider: 'supabase',
          isPremium: false
        },
        token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
    } catch (error) {
      console.error("Supabase login error:", error);
      res.status(400).json({ 
        success: false,
        message: error instanceof Error ? error.message : "فشل في تسجيل الدخول" 
      });
    }
  });

  app.post('/api/auth/supabase/signup', async (req, res) => {
    try {
      const { email, password, fullName, agreeToTerms } = req.body;
      
      if (!agreeToTerms) {
        return res.status(400).json({ 
          success: false,
          message: "يجب الموافقة على الشروط والأحكام" 
        });
      }
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          message: "البريد الإلكتروني وكلمة المرور مطلوبان" 
        });
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) throw error;
      
      if (!data.user) {
        throw new Error("فشل في إنشاء الحساب");
      }
      
      const message = data.session 
        ? "تم إنشاء الحساب بنجاح"
        : "تم إنشاء الحساب بنجاح. يرجى تأكيد بريدك الإلكتروني.";
      
      res.json({ 
        success: true, 
        message,
        user: { 
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || fullName,
          provider: 'supabase',
          isPremium: false,
          emailConfirmed: !!data.session
        },
        token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        requiresEmailConfirmation: !data.session
      });
    } catch (error) {
      console.error("Supabase signup error:", error);
      res.status(400).json({ 
        success: false,
        message: error instanceof Error ? error.message : "فشل في إنشاء الحساب" 
      });
    }
  });

  app.post('/api/auth/supabase/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "البريد الإلكتروني مطلوب" 
        });
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${req.protocol}://${req.get('host')}/auth/reset-password`
      });
      
      if (error) throw error;
      
      res.json({ 
        success: true, 
        message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ 
        success: false, 
        message: "فشل في إرسال رابط إعادة التعيين" 
      });
    }
  });

  // Google and Facebook OAuth routes for mobile
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { idToken, accessToken } = req.body;
      
      // TODO: Verify Google tokens and extract user info
      console.log("Google OAuth attempt");
      
      res.json({ 
        success: true, 
        message: "تم تسجيل الدخول بجوجل بنجاح",
        user: { 
          id: `google_${Date.now()}`,
          email: "user@gmail.com", 
          fullName: "مستخدم جوجل",
          provider: 'google',
          profileImageUrl: "https://lh3.googleusercontent.com/default"
        },
        token: `google_token_${Date.now()}`
      });
    } catch (error) {
      console.error("Google OAuth error:", error);
      res.status(400).json({ message: "فشل في تسجيل الدخول بجوجل" });
    }
  });

  app.post('/api/auth/facebook', async (req, res) => {
    try {
      const { accessToken } = req.body;
      
      // TODO: Verify Facebook token and extract user info
      console.log("Facebook OAuth attempt");
      
      res.json({ 
        success: true, 
        message: "تم تسجيل الدخول بفيسبوك بنجاح",
        user: { 
          id: `facebook_${Date.now()}`,
          email: "user@facebook.com", 
          fullName: "مستخدم فيسبوك",
          provider: 'facebook',
          profileImageUrl: "https://graph.facebook.com/default/picture"
        },
        token: `facebook_token_${Date.now()}`
      });
    } catch (error) {
      console.error("Facebook OAuth error:", error);
      res.status(400).json({ message: "فشل في تسجيل الدخول بفيسبوك" });
    }
  });

  // Simple auth check endpoint for debugging
  app.get("/api/auth/status", async (req, res) => {
    res.json({ 
      message: "Auth endpoint working", 
      timestamp: new Date().toISOString()
    });
  });





  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Print job processing endpoint
  app.post("/api/print-jobs/process", async (req, res) => {
    try {
      const { jobId } = req.body;
      
      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
      }

      // TODO: Implement print job processing logic
      // This could include:
      // - File validation
      // - Print queue management
      // - Printer communication
      // - Status updates
      
      console.log("Processing print job:", jobId);
      
      res.json({ 
        success: true, 
        message: "Print job processing initiated",
        jobId 
      });
    } catch (error) {
      console.error("Print job processing error:", error);
      res.status(500).json({ error: "Failed to process print job" });
    }
  });

  // OCR processing endpoint
  app.post("/api/ocr/process", async (req, res) => {
    try {
      const { imageUrl, language = 'ara+eng' } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      // TODO: Implement OCR processing using Tesseract.js or similar
      // This would extract text from images and return structured data
      
      console.log("Processing OCR for:", imageUrl);
      
      // Mock response for now
      res.json({
        success: true,
        text: "Extracted text would appear here",
        language,
        confidence: 0.95
      });
    } catch (error) {
      console.error("OCR processing error:", error);
      res.status(500).json({ error: "Failed to process OCR" });
    }
  });

  // PDF processing endpoint
  app.post("/api/pdf/process", async (req, res) => {
    try {
      const { operation, fileUrl, options } = req.body;
      
      if (!operation || !fileUrl) {
        return res.status(400).json({ error: "Operation and file URL are required" });
      }

      // TODO: Implement PDF processing operations
      // - compress: Reduce file size
      // - merge: Combine multiple PDFs
      // - split: Extract specific pages
      // - rotate: Change page orientation
      
      console.log("Processing PDF operation:", operation, "for:", fileUrl);
      
      res.json({
        success: true,
        operation,
        processedFileUrl: fileUrl, // Would be the processed file URL
        message: `PDF ${operation} completed successfully`
      });
    } catch (error) {
      console.error("PDF processing error:", error);
      res.status(500).json({ error: "Failed to process PDF" });
    }
  });

  // Payment processing endpoint
  app.post("/api/payments/process", async (req, res) => {
    try {
      const { orderId, paymentMethod, amount } = req.body;
      
      if (!orderId || !paymentMethod || !amount) {
        return res.status(400).json({ error: "Order ID, payment method, and amount are required" });
      }

      // TODO: Implement payment processing integration
      // This could integrate with Egyptian payment gateways like:
      // - Paymob
      // - Fawry
      // - Accept
      
      console.log("Processing payment for order:", orderId);
      
      res.json({
        success: true,
        orderId,
        paymentStatus: "completed",
        transactionId: `txn_${Date.now()}`,
        message: "Payment processed successfully"
      });
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  // AI template generation endpoint
  app.post("/api/ai/generate-template", async (req, res) => {
    try {
      const { templateType, customization, language, paperSize } = req.body;
      
      if (!templateType || !customization) {
        return res.status(400).json({ error: "Template type and customization are required" });
      }

      // TODO: Implement AI template generation
      // This could use OpenAI API or similar to generate templates
      // based on user requirements
      
      console.log("Generating AI template:", templateType);
      
      res.json({
        success: true,
        templateType,
        generatedTemplate: {
          content: "Generated template content would be here",
          downloadUrl: "/templates/generated_template.pdf",
          previewUrl: "/templates/generated_template_preview.png"
        },
        message: "Template generated successfully"
      });
    } catch (error) {
      console.error("AI template generation error:", error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  // Reward redemption endpoint (using Supabase RPC)
  app.post("/api/rewards/redeem", async (req, res) => {
    try {
      const { userId, rewardId, pointsCost } = req.body;
      
      if (!userId || !rewardId || !pointsCost) {
        return res.status(400).json({ error: "User ID, reward ID, and points cost are required" });
      }

      // TODO: Implement reward redemption logic
      // This would be handled by a Supabase RPC function for atomic operations
      
      console.log("Processing reward redemption for user:", userId);
      
      res.json({
        success: true,
        userId,
        rewardId,
        pointsDeducted: pointsCost,
        message: "Reward redeemed successfully"
      });
    } catch (error) {
      console.error("Reward redemption error:", error);
      res.status(500).json({ error: "Failed to redeem reward" });
    }
  });

  // File upload processing endpoint
  app.post("/api/files/upload", async (req, res) => {
    try {
      // TODO: Implement file upload handling
      // Files would typically be uploaded directly to Supabase Storage from the frontend
      // This endpoint could be used for server-side file processing
      
      console.log("File upload processing");
      
      res.json({
        success: true,
        fileUrl: "/uploads/sample_file.pdf",
        message: "File uploaded successfully"
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Challenge progress update endpoint
  app.post("/api/challenges/update-progress", async (req, res) => {
    try {
      const { userId, challengeType, progressValue } = req.body;
      
      if (!userId || !challengeType || progressValue === undefined) {
        return res.status(400).json({ error: "User ID, challenge type, and progress value are required" });
      }

      // TODO: Implement challenge progress update logic
      // This would update user challenge progress based on actions taken
      
      console.log("Updating challenge progress for user:", userId);
      
      res.json({
        success: true,
        userId,
        challengeType,
        updatedProgress: progressValue,
        message: "Challenge progress updated successfully"
      });
    } catch (error) {
      console.error("Challenge update error:", error);
      res.status(500).json({ error: "Failed to update challenge progress" });
    }
  });

  // Error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message || "An unexpected error occurred"
    });
  });

  // Admin Dashboard Routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const totalUsers = await storage.getUserCount();
      const totalProducts = await storage.getProductCount();
      const totalOrders = await storage.getOrderCount();
      const totalPointsDistributed = await storage.getTotalPointsDistributed();

      res.json({
        totalUsers,
        totalProducts,
        totalOrders,
        totalPointsDistributed
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Products Management
  app.get("/api/admin/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/admin/products/:id", async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Offers Management
  app.get("/api/admin/offers", async (req, res) => {
    try {
      const offers = await storage.getAllOffers();
      res.json(offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.post("/api/admin/offers", async (req, res) => {
    try {
      const offer = await storage.createOffer(req.body);
      res.json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(500).json({ message: "Failed to create offer" });
    }
  });

  app.put("/api/admin/offers/:id", async (req, res) => {
    try {
      const offer = await storage.updateOffer(req.params.id, req.body);
      res.json(offer);
    } catch (error) {
      console.error("Error updating offer:", error);
      res.status(500).json({ message: "Failed to update offer" });
    }
  });

  // Awards Management
  app.get("/api/admin/awards", async (req, res) => {
    try {
      const awards = await storage.getAllAwards();
      res.json(awards);
    } catch (error) {
      console.error("Error fetching awards:", error);
      res.status(500).json({ message: "Failed to fetch awards" });
    }
  });

  app.post("/api/admin/awards", async (req, res) => {
    try {
      const award = await storage.createAward(req.body);
      res.json(award);
    } catch (error) {
      console.error("Error creating award:", error);
      res.status(500).json({ message: "Failed to create award" });
    }
  });

  app.put("/api/admin/awards/:id", async (req, res) => {
    try {
      const award = await storage.updateAward(req.params.id, req.body);
      res.json(award);
    } catch (error) {
      console.error("Error updating award:", error);
      res.status(500).json({ message: "Failed to update award" });
    }
  });

  // Admin Management Endpoints
  app.get("/api/admin/admin-users", async (req, res) => {
    try {
      const adminUsers = await storage.getAdminUsers();
      res.json(adminUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch admin users" });
    }
  });

  app.post("/api/admin/add-admin", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email and update role
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found with this email" });
      }

      await storage.updateUser(user.id, { role: 'admin' });
      res.json({ success: true, message: "User promoted to admin" });
    } catch (error) {
      console.error("Error adding admin:", error);
      res.status(500).json({ message: "Failed to add admin" });
    }
  });

  app.post("/api/admin/remove-admin", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Don't allow removing the main admin
      if (email === 'printformead1@gmail.com') {
        return res.status(403).json({ message: "Cannot remove main admin" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found with this email" });
      }

      await storage.updateUser(user.id, { role: 'user' });
      res.json({ success: true, message: "Admin role removed" });
    } catch (error) {
      console.error("Error removing admin:", error);
      res.status(500).json({ message: "Failed to remove admin" });
    }
  });

  // Temporary endpoint to make user admin (for development)
  app.post("/api/admin/make-admin", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Update user role to admin in database
      await storage.updateUser(userId, { role: 'admin' });
      
      res.json({ success: true, message: "User role updated to admin" });
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/admin/bounties", async (req, res) => {
    try {
      const bounties = await storage.getAllBounties();
      res.json(bounties);
    } catch (error) {
      console.error("Error fetching bounties:", error);
      res.status(500).json({ message: "Failed to fetch bounties" });
    }
  });

  // Test endpoint
  app.get("/api/test", async (req, res) => {
    res.json({ message: "Hello from the backend!" });
  });

  // Admin Routes
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const [usersCount] = await db.select({ count: count() }).from(users);
      const [productsCount] = await db.select({ count: count() }).from(products);
      const [ordersCount] = await db.select({ count: count() }).from(orders);
      
      res.json({
        users: usersCount.count,
        products: productsCount.count,
        orders: ordersCount.count,
        revenue: 15420.50, // Mock data - calculate from orders
        growth: 12.5
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'فشل في جلب الإحصائيات' });
    }
  });

  app.get('/api/admin/products', async (req, res) => {
    try {
      const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
      res.json(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'فشل في جلب المنتجات' });
    }
  });

  app.post('/api/admin/products', async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const [newProduct] = await db.insert(products).values(validatedData).returning();
      res.json(newProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'فشل في إضافة المنتج' });
    }
  });

  app.put('/api/admin/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertProductSchema.parse(req.body);
      const [updatedProduct] = await db
        .update(products)
        .set(validatedData)
        .where(eq(products.id, id))
        .returning();
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'فشل في تحديث المنتج' });
    }
  });

  app.delete('/api/admin/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(products).where(eq(products.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'فشل في حذف المنتج' });
    }
  });

  app.get('/api/admin/orders', async (req, res) => {
    try {
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      res.json(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'فشل في جلب الطلبات' });
    }
  });

  app.patch('/api/admin/orders/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const [updatedOrder] = await db
        .update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .returning();

      // Add tracking entry
      await db.insert(orderTracking).values({
        orderId: id,
        status,
        message: `تم تحديث حالة الطلب إلى: ${status}`,
        messageEn: `Order status updated to: ${status}`,
        actualTime: new Date()
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'فشل في تحديث حالة الطلب' });
    }
  });

  app.get('/api/admin/teacher-plans', async (req, res) => {
    try {
      const plans = await db.select().from(teacherPlans).orderBy(desc(teacherPlans.createdAt));
      res.json(plans);
    } catch (error) {
      console.error('Error fetching teacher plans:', error);
      res.status(500).json({ error: 'فشل في جلب خطط المعلمين' });
    }
  });

  app.post('/api/admin/teacher-plans', async (req, res) => {
    try {
      const validatedData = insertTeacherPlanSchema.parse(req.body);
      const [newPlan] = await db.insert(teacherPlans).values(validatedData).returning();
      res.json(newPlan);
    } catch (error) {
      console.error('Error creating teacher plan:', error);
      res.status(500).json({ error: 'فشل في إضافة خطة المعلم' });
    }
  });

  app.get('/api/admin/teacher-subscriptions', async (req, res) => {
    try {
      const subscriptions = await db
        .select({
          id: teacherSubscriptions.id,
          teacherName: users.fullName,
          planName: teacherPlans.name,
          status: teacherSubscriptions.status,
          startDate: teacherSubscriptions.startDate,
          endDate: teacherSubscriptions.endDate,
          studentsCount: teacherSubscriptions.studentsCount,
          materialsCount: teacherSubscriptions.materialsCount
        })
        .from(teacherSubscriptions)
        .leftJoin(users, eq(teacherSubscriptions.teacherId, users.id))
        .leftJoin(teacherPlans, eq(teacherSubscriptions.planId, teacherPlans.id))
        .orderBy(desc(teacherSubscriptions.createdAt));
      
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching teacher subscriptions:', error);
      res.status(500).json({ error: 'فشل في جلب اشتراكات المعلمين' });
    }
  });

  // Chatbot Route
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, sessionId, userId, messages } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ error: 'Message and session ID are required' });
      }

      // Generate AI response
      const aiResponse = await generateChatResponse(message, messages);

      // Save conversation
      const conversationData = {
        userId: userId || null,
        sessionId,
        messages: [
          ...messages || [],
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
        ]
      };

      await db.insert(chatConversations).values(conversationData);

      res.json({ 
        message: aiResponse,
        reply: aiResponse,
        sessionId 
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        error: 'حدث خطأ في النظام',
        message: 'عذراً، حدث خطأ مؤقت. يرجى المحاولة مرة أخرى.' 
      });
    }
  });

  // Order Tracking Route
  app.get('/api/orders/:id/tracking', async (req, res) => {
    try {
      const { id } = req.params;
      
      const trackingData = await db
        .select()
        .from(orderTracking)
        .where(eq(orderTracking.orderId, id))
        .orderBy(desc(orderTracking.createdAt));

      // Mock tracking steps with completion status
      const steps = [
        { 
          id: '1', 
          status: 'processing', 
          message: 'تم استلام طلبك وهو قيد المعالجة',
          messageEn: 'Order received and processing',
          completed: true
        },
        { 
          id: '2', 
          status: 'printing', 
          message: 'جاري طباعة طلبك',
          messageEn: 'Your order is being printed',
          completed: trackingData.length > 1
        },
        { 
          id: '3', 
          status: 'shipped', 
          message: 'تم شحن طلبك وهو في الطريق إليك',
          messageEn: 'Order shipped and on the way',
          completed: trackingData.length > 2
        },
        { 
          id: '4', 
          status: 'delivered', 
          message: 'تم تسليم طلبك بنجاح',
          messageEn: 'Order delivered successfully',
          completed: trackingData.length > 3
        }
      ];

      res.json({
        steps,
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      res.status(500).json({ error: 'فشل في جلب تتبع الطلب' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
