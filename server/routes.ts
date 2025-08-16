import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { insertUserSchema, insertProductSchema, insertPrintJobSchema, insertOrderSchema, insertCartItemSchema } from "@shared/schema";
import { createClient } from '@supabase/supabase-js';
import { storage } from "./storage";

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

  const httpServer = createServer(app);
  return httpServer;
}
