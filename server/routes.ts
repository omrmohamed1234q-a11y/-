import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { 
  insertUserSchema, insertProductSchema, insertPrintJobSchema, insertOrderSchema, insertCartItemSchema,
  insertChallengeSchema, insertUserChallengeSchema, insertAchievementSchema, insertUserAchievementSchema,
  insertLeaderboardSchema, insertLeaderboardEntrySchema, insertPointsHistorySchema, insertStreakSchema
} from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

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

  // Mock user endpoint for development
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // For development, return a mock user
      const mockUser = {
        id: "user123",
        email: "user@example.com",
        username: "testuser",
        fullName: "مستخدم تجريبي",
        firstName: "مستخدم",
        lastName: "تجريبي",
        phone: "+966501234567",
        isVip: false,
        profileImageUrl: null,
        bountyPoints: 1250,
        level: 5,
        experience: 2750,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      res.json(mockUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  // Gamification API Routes
  
  // Achievements endpoints
  app.get('/api/achievements', async (req, res) => {
    try {
      const { category = 'all' } = req.query;
      
      // Mock achievements data for now
      const mockAchievements = [
        {
          id: "1",
          name: "طابع مبتدئ",
          nameEn: "Rookie Printer",
          description: "اطبع أول مستند لك",
          descriptionEn: "Print your first document",
          icon: "printer",
          category: "printing",
          pointsReward: 50,
          experienceReward: 25,
          badgeLevel: "bronze",
          requirement: { type: "print_count", value: 1 },
          rarity: "common",
          isActive: true,
          isSecret: false,
          progressPercentage: 100,
          userProgress: {
            progress: 1,
            maxProgress: 1,
            isCompleted: true,
            unlockedAt: new Date(),
          }
        },
        {
          id: "2", 
          name: "ماستر الطباعة",
          nameEn: "Print Master",
          description: "اطبع 100 مستند",
          descriptionEn: "Print 100 documents",
          icon: "trophy",
          category: "printing",
          pointsReward: 500,
          experienceReward: 250,
          badgeLevel: "gold",
          requirement: { type: "print_count", value: 100 },
          rarity: "rare",
          isActive: true,
          isSecret: false,
          progressPercentage: 45,
          userProgress: {
            progress: 45,
            maxProgress: 100,
            isCompleted: false,
          }
        },
        {
          id: "3",
          name: "متسوق ذكي", 
          nameEn: "Smart Shopper",
          description: "اشتر 10 منتجات",
          descriptionEn: "Purchase 10 products",
          icon: "shopping-bag",
          category: "purchases",
          pointsReward: 200,
          experienceReward: 100,
          badgeLevel: "silver",
          requirement: { type: "purchase_count", value: 10 },
          rarity: "common",
          isActive: true,
          isSecret: false,
          progressPercentage: 30,
          userProgress: {
            progress: 3,
            maxProgress: 10,
            isCompleted: false,
          }
        },
        {
          id: "4",
          name: "محارب التحديات",
          nameEn: "Challenge Warrior", 
          description: "أكمل 50 تحدي",
          descriptionEn: "Complete 50 challenges",
          icon: "target",
          category: "challenges",
          pointsReward: 1000,
          experienceReward: 500,
          badgeLevel: "platinum",
          requirement: { type: "challenge_count", value: 50 },
          rarity: "epic",
          isActive: true,
          isSecret: false,
          progressPercentage: 16,
          userProgress: {
            progress: 8,
            maxProgress: 50,
            isCompleted: false,
          }
        },
        {
          id: "5",
          name: "إنجاز سري",
          nameEn: "Secret Achievement",
          description: "إنجاز سري مخفي",
          descriptionEn: "Hidden secret achievement",
          icon: "crown",
          category: "social",
          pointsReward: 2000,
          experienceReward: 1000,
          badgeLevel: "diamond",
          requirement: { type: "secret", value: 1 },
          rarity: "legendary",
          isActive: true,
          isSecret: true,
          progressPercentage: 0,
          userProgress: {
            progress: 0,
            maxProgress: 1,
            isCompleted: false,
          }
        }
      ];
      
      const filteredAchievements = category === 'all' 
        ? mockAchievements 
        : mockAchievements.filter(a => a.category === category);
      
      res.json(filteredAchievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "فشل في جلب الإنجازات" });
    }
  });

  app.get('/api/achievements/stats', async (req, res) => {
    try {
      // Mock user stats
      const mockStats = {
        totalAchievements: 24,
        completedAchievements: 7,
        totalPoints: 2350,
        currentLevel: 8
      };
      
      res.json(mockStats);
    } catch (error) {
      console.error("Error fetching achievement stats:", error);
      res.status(500).json({ message: "فشل في جلب إحصائيات الإنجازات" });
    }
  });

  // Leaderboards endpoints
  app.get('/api/leaderboards', async (req, res) => {
    try {
      const { category = 'points' } = req.query;
      
      // Mock leaderboard data
      const mockLeaderboards = [
        {
          id: "1",
          name: "لوحة النقاط الأسبوعية",
          nameEn: "Weekly Points Leaderboard",
          description: "أفضل لاعبين هذا الأسبوع",
          descriptionEn: "Top players this week",
          type: "weekly",
          category: "points",
          icon: "trophy",
          isActive: true,
          entries: [
            {
              id: "e1",
              rank: 1,
              score: 2850,
              user: { id: "u1", fullName: "أحمد محمد", username: "ahmed_m" }
            },
            {
              id: "e2", 
              rank: 2,
              score: 2640,
              user: { id: "u2", fullName: "سارة أحمد", username: "sara_a" }
            },
            {
              id: "e3",
              rank: 3,
              score: 2435,
              user: { id: "u3", fullName: "محمد علي", username: "mohamed_ali" }
            },
            {
              id: "e4",
              rank: 4,
              score: 2180,
              user: { id: "u4", fullName: "فاطمة حسن", username: "fatima_h" }
            },
            {
              id: "e5",
              rank: 5,
              score: 1965,
              user: { id: "u5", fullName: "عمر خالد", username: "omar_k" }
            }
          ]
        }
      ];
      
      res.json(mockLeaderboards);
    } catch (error) {
      console.error("Error fetching leaderboards:", error);
      res.status(500).json({ message: "فشل في جلب لوحات المتصدرين" });
    }
  });

  app.get('/api/leaderboards/my-rank', async (req, res) => {
    try {
      const { category = 'points' } = req.query;
      
      // Mock user rank
      const mockRank = {
        rank: 15,
        score: 1420
      };
      
      res.json(mockRank);
    } catch (error) {
      console.error("Error fetching user rank:", error);
      res.status(500).json({ message: "فشل في جلب ترتيب المستخدم" });
    }
  });

  // Challenges endpoints  
  app.get('/api/challenges', async (req, res) => {
    try {
      const { type = 'all', status = 'active' } = req.query;
      
      // Mock challenges data
      const mockChallenges = [
        {
          id: "1",
          name: "تحدي طباعة اليوم",
          nameEn: "Daily Print Challenge",
          description: "اطبع 5 مستندات اليوم",
          descriptionEn: "Print 5 documents today",
          icon: "printer",
          type: "daily",
          category: "printing",
          difficulty: "easy",
          actionType: "print_pages",
          targetValue: 5,
          pointsReward: 100,
          experienceReward: 50,
          startDate: new Date(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isDaily: true,
          active: true,
          userProgress: {
            currentProgress: 2,
            targetProgress: 5,
            completed: false,
            status: "active"
          }
        },
        {
          id: "2",
          name: "تحدي التسوق الأسبوعي",
          nameEn: "Weekly Shopping Challenge", 
          description: "اشتر 3 منتجات هذا الأسبوع",
          descriptionEn: "Buy 3 products this week",
          icon: "shopping-bag",
          type: "weekly",
          category: "shopping",
          difficulty: "medium",
          actionType: "make_purchase",
          targetValue: 3,
          pointsReward: 300,
          experienceReward: 150,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isDaily: false,
          active: true,
          userProgress: {
            currentProgress: 1,
            targetProgress: 3,
            completed: false,
            status: "active"
          }
        },
        {
          id: "3",
          name: "تحدي الإحالة",
          nameEn: "Referral Challenge",
          description: "ادع 2 أصدقاء للانضمام",
          descriptionEn: "Invite 2 friends to join",
          icon: "users",
          type: "special",
          category: "social",
          difficulty: "hard",
          actionType: "refer_friend",
          targetValue: 2,
          pointsReward: 500,
          experienceReward: 250,
          bonusReward: { type: "discount", value: 20 },
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isDaily: false,
          active: true,
          userProgress: {
            currentProgress: 0,
            targetProgress: 2,
            completed: false,
            status: "active"
          }
        }
      ];
      
      let filteredChallenges = mockChallenges;
      if (type !== 'all') {
        filteredChallenges = filteredChallenges.filter(c => c.type === type);
      }
      
      res.json(filteredChallenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "فشل في جلب التحديات" });
    }
  });

  // Points history endpoint
  app.get('/api/points/history', async (req, res) => {
    try {
      // Mock points history
      const mockHistory = [
        {
          id: "1",
          action: "achievement",
          points: 50,
          experience: 25,
          description: "إنجاز: طابع مبتدئ",
          descriptionEn: "Achievement: Rookie Printer",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: "2", 
          action: "challenge",
          points: 100,
          experience: 50,
          description: "تحدي يومي: طباعة 5 مستندات",
          descriptionEn: "Daily Challenge: Print 5 documents",
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
        },
        {
          id: "3",
          action: "print_job",
          points: 25,
          experience: 10,
          description: "طباعة مستند - 10 صفحات",
          descriptionEn: "Document print - 10 pages",
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
        }
      ];
      
      res.json(mockHistory);
    } catch (error) {
      console.error("Error fetching points history:", error);
      res.status(500).json({ message: "فشل في جلب تاريخ النقاط" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
