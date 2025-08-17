import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProductSchema, insertOrderSchema, insertPrintJobSchema } from "@shared/schema";
import { z } from "zod";

// Google Pay configuration
const GOOGLE_PAY_MERCHANT_ID = process.env.GOOGLE_PAY_MERCHANT_ID || 'merchant.com.atbaalee';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/admin/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/admin/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const updates = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, updates);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/admin/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get('/api/admin/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.put('/api/admin/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.get('/api/admin/print-jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const printJobs = await storage.getAllPrintJobs();
      res.json(printJobs);
    } catch (error) {
      console.error("Error fetching print jobs:", error);
      res.status(500).json({ message: "Failed to fetch print jobs" });
    }
  });

  app.put('/api/admin/print-jobs/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { status } = req.body;
      const printJob = await storage.updatePrintJobStatus(id, status);
      res.json(printJob);
    } catch (error) {
      console.error("Error updating print job status:", error);
      res.status(500).json({ message: "Failed to update print job status" });
    }
  });

  // Print Job routes
  app.post('/api/print-jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const printJobData = insertPrintJobSchema.parse({
        ...req.body,
        userId
      });
      
      const printJob = await storage.createPrintJob(printJobData);
      res.json(printJob);
    } catch (error) {
      console.error("Error creating print job:", error);
      res.status(500).json({ message: "Failed to create print job" });
    }
  });

  app.get('/api/print-jobs', isAuthenticated, async (req: any, res) => {
    try {
      const printJobs = await storage.getAllPrintJobs();
      res.json(printJobs);
    } catch (error) {
      console.error("Error fetching print jobs:", error);
      res.status(500).json({ message: "Failed to fetch print jobs" });
    }
  });

  // Order routes
  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId
      });
      
      const order = await storage.createOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Public product routes
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Google Pay payment processing
  app.post("/api/google-pay/payment", isAuthenticated, async (req, res) => {
    try {
      const { amount, currency = "EGP", paymentData } = req.body;
      const userId = req.user?.claims?.sub;
      
      // In a real implementation, you would:
      // 1. Verify the payment token with Google Pay API
      // 2. Process the payment with your payment processor
      // 3. Update order status in database
      
      // For now, simulate successful payment processing
      const transactionId = `gp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order record
      const orderData = {
        userId,
        items: req.body.items || [],
        totalAmount: amount.toString(),
        status: 'confirmed',
        paymentMethod: 'google_pay',
        paymentStatus: 'completed'
      };
      
      const order = await storage.createOrder(orderData);
      
      res.json({
        success: true,
        transactionId,
        orderId: order.id,
        amount,
        currency,
        status: 'completed',
        message: 'Payment processed successfully with Google Pay'
      });
      
    } catch (error: any) {
      console.error("Google Pay payment error:", error);
      res.status(500).json({ message: "Failed to process Google Pay payment: " + error.message });
    }
  });

  // Get Google Pay configuration
  app.get("/api/google-pay/config", async (req, res) => {
    try {
      res.json({
        merchantId: GOOGLE_PAY_MERCHANT_ID,
        environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST',
        supportedNetworks: ['VISA', 'MASTERCARD', 'AMEX'],
        supportedMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        countryCode: 'EG',
        currencyCode: 'EGP'
      });
    } catch (error) {
      console.error("Google Pay config error:", error);
      res.status(500).json({ message: "Failed to get Google Pay config" });
    }
  });

  // Vodafone Cash integration placeholder
  app.post("/api/vodafone-cash/payment", isAuthenticated, async (req, res) => {
    try {
      const { amount, phone } = req.body;
      
      // Vodafone Cash integration would go here
      // For now, return a mock success response
      res.json({
        success: true,
        transactionId: `vc_${Date.now()}`,
        amount,
        phone,
        status: 'pending',
        message: 'Payment initiated with Vodafone Cash'
      });
    } catch (error) {
      console.error("Vodafone Cash payment error:", error);
      res.status(500).json({ message: "Failed to process Vodafone Cash payment" });
    }
  });

  // File upload for camera/document capture
  app.post('/api/upload', isAuthenticated, async (req: any, res) => {
    try {
      // This would handle file uploads from camera or file picker
      // Integration with Firebase Storage happens on the client side
      res.json({ 
        success: true, 
        message: 'File upload endpoint ready - use Firebase client integration'
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}