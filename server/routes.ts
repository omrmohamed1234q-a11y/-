import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Simple admin auth middleware
const isAdminAuthenticated = (req: any, res: any, next: any) => {
  // For demo purposes, we'll allow admin access
  // In production, this should verify proper authentication
  req.user = { claims: { sub: 'admin-user' }, role: 'admin' };
  next();
};
import { insertProductSchema, insertOrderSchema, insertPrintJobSchema } from "@shared/schema";
import { z } from "zod";

// Google Pay configuration
const GOOGLE_PAY_MERCHANT_ID = process.env.GOOGLE_PAY_MERCHANT_ID || 'merchant.com.atbaalee';

export async function registerRoutes(app: Express): Promise<Server> {
  // Basic auth route for frontend compatibility
  app.get('/api/auth/user', (req: any, res) => {
    // Return null for unauthenticated users (frontend handles this)
    res.json(null);
  });

  // Admin routes
  app.get('/api/admin/stats', isAdminAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/products', isAdminAuthenticated, async (req: any, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/admin/products', isAdminAuthenticated, async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/admin/products/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, updates);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/admin/products/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get('/api/admin/orders', isAdminAuthenticated, async (req: any, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.put('/api/admin/orders/:id/status', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.get('/api/admin/print-jobs', isAdminAuthenticated, async (req: any, res) => {
    try {
      const printJobs = await storage.getAllPrintJobs();
      res.json(printJobs);
    } catch (error) {
      console.error("Error fetching print jobs:", error);
      res.status(500).json({ message: "Failed to fetch print jobs" });
    }
  });

  app.put('/api/admin/print-jobs/:id/status', isAdminAuthenticated, async (req: any, res) => {
    try {
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
  app.post('/api/print-jobs', isAdminAuthenticated, async (req: any, res) => {
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

  app.get('/api/print-jobs', isAdminAuthenticated, async (req: any, res) => {
    try {
      const printJobs = await storage.getAllPrintJobs();
      res.json(printJobs);
    } catch (error) {
      console.error("Error fetching print jobs:", error);
      res.status(500).json({ message: "Failed to fetch print jobs" });
    }
  });

  // Order routes
  app.post('/api/orders', isAdminAuthenticated, async (req: any, res) => {
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

  app.get('/api/orders', isAdminAuthenticated, async (req: any, res) => {
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
  app.post("/api/google-pay/payment", isAdminAuthenticated, async (req, res) => {
    try {
      const { amount, currency = "EGP", paymentData } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      
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

  // Vodafone Cash integration
  app.post("/api/vodafone-cash/payment", isAdminAuthenticated, async (req, res) => {
    try {
      const { amount, currency = "EGP", phoneNumber, pin } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      
      // Validate required fields
      if (!amount || !phoneNumber || !pin) {
        return res.status(400).json({ message: "Missing required payment information" });
      }

      // Validate Egyptian phone number format
      const egyptianPhoneRegex = /^(010|011|012|015)\d{8}$/;
      if (!egyptianPhoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: "Invalid Egyptian phone number format" });
      }

      // Validate amount
      if (amount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }
      
      // For now, simulate payment processing
      const transactionId = `VC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order record
      const orderData = {
        userId,
        items: JSON.stringify([{ 
          type: 'payment', 
          description: `Vodafone Cash payment - ${amount} ${currency}`,
          amount 
        }]),
        totalAmount: amount,
        status: 'completed',
        paymentMethod: 'vodafone_cash',
        paymentStatus: 'completed'
      };

      const order = await storage.createOrder(orderData);
      
      const paymentResult = {
        success: true,
        transactionId,
        orderId: order.id,
        amount,
        currency,
        status: 'completed',
        timestamp: new Date().toISOString(),
        message: 'Payment processed successfully via Vodafone Cash'
      };

      res.json(paymentResult);
    } catch (error) {
      console.error("Vodafone Cash error:", error);
      res.status(500).json({ message: "Failed to process Vodafone Cash payment" });
    }
  });

  // Teacher management routes
  app.get('/api/admin/teacher-plans', isAdminAuthenticated, async (req: any, res) => {
    try {
      const teacherPlans = await storage.getAllTeacherPlans();
      res.json(teacherPlans);
    } catch (error) {
      console.error("Error fetching teacher plans:", error);
      res.status(500).json({ message: "Failed to fetch teacher plans" });
    }
  });

  app.get('/api/admin/teacher-subscriptions', isAdminAuthenticated, async (req: any, res) => {
    try {
      const teacherSubscriptions = await storage.getAllTeacherSubscriptions();
      res.json(teacherSubscriptions);
    } catch (error) {
      console.error("Error fetching teacher subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch teacher subscriptions" });
    }
  });

  // File upload for camera/document capture
  app.post('/api/upload', isAdminAuthenticated, async (req: any, res) => {
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

  // Analytics endpoints
  app.get('/api/admin/analytics', async (req, res) => {
    try {
      const { from, to, compare } = req.query;
      
      // Generate comprehensive analytics data
      const analytics = {
        totalOrders: 1247,
        totalRevenue: 45750.50,
        totalUsers: 834,
        totalPrintJobs: 2156,
        avgOrderValue: 36.70,
        conversionRate: 12.8,
        customerSatisfaction: 4.3,
        repeatCustomerRate: 28.5,
        
        // Growth rates (compared to previous period)
        orderGrowth: 15.2,
        revenueGrowth: 23.8,
        userGrowth: 8.7,
        
        // Charts data
        dailyOrders: [
          { date: '2025-01-01', orders: 45, revenue: 1650 },
          { date: '2025-01-02', orders: 52, revenue: 1920 },
          { date: '2025-01-03', orders: 38, revenue: 1390 },
          { date: '2025-01-04', orders: 67, revenue: 2460 },
          { date: '2025-01-05', orders: 48, revenue: 1760 },
          { date: '2025-01-06', orders: 72, revenue: 2640 },
          { date: '2025-01-07', orders: 56, revenue: 2050 },
        ],
        
        ordersByStatus: [
          { status: 'مكتمل', count: 987, color: '#00C49F' },
          { status: 'قيد التنفيذ', count: 156, color: '#FFBB28' },
          { status: 'ملغي', count: 45, color: '#FF8042' },
          { status: 'معلق', count: 59, color: '#8884D8' }
        ],
        
        revenueByCategory: [
          { category: 'طباعة المستندات', revenue: 18500 },
          { category: 'المواد التعليمية', revenue: 12300 },
          { category: 'التصوير والمسح', revenue: 8900 },
          { category: 'الطباعة الملونة', revenue: 6050 }
        ],
        
        topProducts: [
          { name: 'طباعة مستندات A4', orders: 145, revenue: 4350 },
          { name: 'كتاب رياضيات للصف الثالث', orders: 98, revenue: 2940 },
          { name: 'مسح وتحويل PDF', orders: 87, revenue: 1740 },
          { name: 'طباعة صور', orders: 76, revenue: 2280 },
          { name: 'كراسة التدريبات', orders: 65, revenue: 1950 }
        ],
        
        userActivity: [
          { hour: '00:00', users: 12 },
          { hour: '06:00', users: 25 },
          { hour: '09:00', users: 156 },
          { hour: '12:00', users: 198 },
          { hour: '15:00', users: 145 },
          { hour: '18:00', users: 187 },
          { hour: '21:00', users: 134 }
        ],
        
        geographicDistribution: [
          { region: 'القاهرة', orders: 456, percentage: 36.6 },
          { region: 'الجيزة', orders: 298, percentage: 23.9 },
          { region: 'الإسكندرية', orders: 187, percentage: 15.0 },
          { region: 'الشرقية', orders: 156, percentage: 12.5 },
          { region: 'أخرى', orders: 150, percentage: 12.0 }
        ],
        
        printJobTypes: [
          { type: 'مستندات', count: 856, avgTime: 15 },
          { type: 'صور', count: 453, avgTime: 8 },
          { type: 'كتب', count: 298, avgTime: 45 },
          { type: 'مخططات', count: 187, avgTime: 25 },
          { type: 'أخرى', count: 362, avgTime: 20 }
        ],
        
        teacherMaterials: [
          { subject: 'الرياضيات', downloads: 234, rating: 4.8 },
          { subject: 'العلوم', downloads: 198, rating: 4.6 },
          { subject: 'اللغة العربية', downloads: 187, rating: 4.7 },
          { subject: 'التاريخ', downloads: 156, rating: 4.4 },
          { subject: 'الجغرافيا', downloads: 134, rating: 4.5 }
        ]
      };
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics data' });
    }
  });

  // Analytics export endpoint
  app.get('/api/admin/analytics/export', async (req, res) => {
    try {
      const { format, from, to, compare } = req.query;
      
      // In a real implementation, you would generate the actual export file
      const filename = `analytics-${format}-${new Date().toISOString().split('T')[0]}`;
      
      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.${format}"`);
      res.setHeader('Content-Type', 
        format === 'csv' ? 'text/csv' : 
        format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
        'application/pdf'
      );
      
      // Return sample export data (in production, this would be actual file content)
      const exportData = `Analytics Report
Generated: ${new Date().toISOString()}
Period: ${from} to ${to}

Total Orders: 1247
Total Revenue: $45,750.50
Total Users: 834
Total Print Jobs: 2156
`;
      
      res.send(exportData);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      res.status(500).json({ message: 'Failed to export analytics data' });
    }
  });

  // Order tracking endpoints
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Failed to fetch order' });
    }
  });

  // Get driver location (mock for now)
  app.get('/api/driver-location/:driverId', async (req, res) => {
    try {
      // In production, this would fetch real-time driver location
      const mockLocation = {
        lat: 30.0444 + (Math.random() - 0.5) * 0.01,
        lng: 31.2357 + (Math.random() - 0.5) * 0.01,
        heading: Math.floor(Math.random() * 360),
        speed: 20 + Math.floor(Math.random() * 30),
        updatedAt: new Date().toISOString()
      };
      
      res.json(mockLocation);
    } catch (error) {
      console.error('Error fetching driver location:', error);
      res.status(500).json({ message: 'Failed to fetch driver location' });
    }
  });

  // Submit order rating
  app.post('/api/orders/:id/rating', async (req, res) => {
    try {
      const orderId = req.params.id;
      const { rating, review } = req.body;
      
      await storage.updateOrderRating(orderId, rating, review);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error submitting rating:', error);
      res.status(500).json({ message: 'Failed to submit rating' });
    }
  });

  // Cancel order
  app.post('/api/orders/:id/cancel', async (req, res) => {
    try {
      const orderId = req.params.id;
      
      await storage.cancelOrder(orderId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ message: 'Failed to cancel order' });
    }
  });

  // Send message to driver
  app.post('/api/orders/:id/driver-message', async (req, res) => {
    try {
      const orderId = req.params.id;
      const { message } = req.body;
      
      // In production, this would send a real message to the driver
      await storage.addDriverNote(orderId, message);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // Get order invoice
  app.get('/api/orders/:id/invoice', async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // In production, generate a proper PDF invoice
      const invoiceContent = `
        فاتورة - Invoice
        =================
        رقم الطلب: ${order.orderNumber}
        التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-EG')}
        
        المنتجات:
        ${order.items.map((item: any) => `${item.name} × ${item.quantity} = ${item.price * item.quantity} ر.س`).join('\n')}
        
        المجموع الفرعي: ${order.subtotal} ر.س
        الخصم: ${order.discount} ر.س
        رسوم التوصيل: ${order.deliveryFee} ر.س
        الضريبة: ${order.tax} ر.س
        =================
        الإجمالي: ${order.totalAmount} ر.س
      `;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
      res.send(invoiceContent);
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ message: 'Failed to generate invoice' });
    }
  });

  // Get delivery slots
  app.get('/api/delivery-slots', async (req, res) => {
    try {
      const slots = [
        { id: 'asap', label: 'في أقرب وقت ممكن', time: '30-45 دقيقة' },
        { id: 'morning', label: 'صباحاً', time: '9:00 - 12:00' },
        { id: 'afternoon', label: 'بعد الظهر', time: '12:00 - 17:00' },
        { id: 'evening', label: 'مساءً', time: '17:00 - 21:00' }
      ];
      
      res.json(slots);
    } catch (error) {
      console.error('Error fetching delivery slots:', error);
      res.status(500).json({ message: 'Failed to fetch delivery slots' });
    }
  });

  // Get user addresses
  app.get('/api/addresses', async (req, res) => {
    try {
      // In production, fetch from database
      const addresses = [
        {
          id: '1',
          label: 'منزل',
          street: 'شارع التحرير',
          building: '15',
          floor: '3',
          apartment: '12',
          area: 'مدينة نصر',
          city: 'القاهرة',
          phone: '01012345678'
        },
        {
          id: '2',
          label: 'العمل',
          street: 'شارع جامعة الدول',
          building: '42',
          floor: '5',
          apartment: '8',
          area: 'المهندسين',
          city: 'الجيزة',
          phone: '01098765432'
        }
      ];
      
      res.json(addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      res.status(500).json({ message: 'Failed to fetch addresses' });
    }
  });

  // Cart API endpoints
  app.get('/api/cart', async (req, res) => {
    try {
      // Mock cart data with sample items for demonstration
      const cartData = {
        items: [
          {
            id: 'cart-item-1',
            productId: 'prod-1',
            productName: 'كتاب الرياضيات - الصف الثالث الثانوي',
            productImage: 'https://via.placeholder.com/80',
            price: 150,
            quantity: 2,
            orderId: 'test-order-001', // This item has an active order
            orderStatus: 'preparing',
            variant: {
              size: 'A4'
            }
          },
          {
            id: 'cart-item-2',
            productId: 'prod-2',
            productName: 'دفتر ملاحظات فاخر',
            productImage: 'https://via.placeholder.com/80',
            price: 45,
            quantity: 1,
            variant: {
              color: 'أزرق'
            }
          }
        ],
        discount: 0,
        shipping: 15,
        availablePoints: 250
      };
      res.json(cartData);
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ message: 'Failed to fetch cart' });
    }
  });

  app.get('/api/cart/suggestions', async (req, res) => {
    try {
      // Return suggested products
      const suggestions = [
        {
          id: '1',
          name: 'دفتر ملاحظات A4',
          price: 25,
          image: '/placeholder.jpg'
        },
        {
          id: '2',
          name: 'أقلام جل ملونة',
          price: 45,
          image: '/placeholder.jpg'
        }
      ];
      res.json(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
  });

  app.put('/api/cart/items/:itemId', async (req, res) => {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      // Update cart item quantity in session/database
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ message: 'Failed to update cart item' });
    }
  });

  app.delete('/api/cart/items/:itemId', async (req, res) => {
    try {
      const { itemId } = req.params;
      // Remove item from cart
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing cart item:', error);
      res.status(500).json({ message: 'Failed to remove cart item' });
    }
  });

  app.post('/api/cart/apply-coupon', async (req, res) => {
    try {
      const { code } = req.body;
      // Validate coupon and apply discount
      if (code === 'WELCOME10') {
        res.json({ discount: 10, success: true });
      } else {
        res.status(400).json({ message: 'Invalid coupon code' });
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      res.status(500).json({ message: 'Failed to apply coupon' });
    }
  });

  // Get active orders
  app.get('/api/orders/active', async (req, res) => {
    try {
      const activeOrders = await storage.getActiveOrders();
      res.json(activeOrders || []);
    } catch (error) {
      console.error('Error fetching active orders:', error);
      res.status(500).json({ message: 'Failed to fetch active orders' });
    }
  });

  // Create new order
  app.post('/api/orders', async (req, res) => {
    try {
      const orderData = req.body;
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const newOrder = {
        ...orderData,
        orderNumber,
        status: 'pending',
        statusText: 'معلق',
        createdAt: new Date(),
        timeline: [{
          event: 'order_placed',
          timestamp: new Date(),
          note: 'تم استلام الطلب'
        }]
      };
      
      const order = await storage.createOrder(newOrder);
      
      res.json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Failed to create order' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}