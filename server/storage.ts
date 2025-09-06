import { users, products, orders, printJobs, cartItems, drivers, announcements, partners, partnerProducts, secureAdmins, secureDrivers, securityLogs, type User, type Product, type Order, type PrintJob, type CartItem, type Announcement, type InsertAnnouncement, type Partner, type InsertPartner, type SelectPartnerProduct, type InsertPartnerProduct, type SecureAdmin, type InsertSecureAdmin, type SecureDriver, type InsertSecureDriver, type SecurityLog, type InsertSecurityLog } from "@shared/schema";
// import { db } from "./db"; // تعطيل مؤقتاً
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  updateUser(id: string, updates: any): Promise<User>;
  upsertUser(user: any): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  createProduct(product: any): Promise<Product>;
  updateProduct(id: string, updates: any): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Order operations
  getAllOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: any): Promise<Order>;
  updateOrder(id: string, updates: any): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  updateOrderRating(id: string, rating: number, review?: string): Promise<Order>;
  cancelOrder(id: string): Promise<Order>;
  addDriverNote(id: string, note: string): Promise<Order>;
  getActiveOrders(): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  deleteOrder(id: string): Promise<boolean>;
  
  // Print Job operations
  getAllPrintJobs(): Promise<PrintJob[]>;
  createPrintJob(printJob: any): Promise<PrintJob>;
  updatePrintJobStatus(id: string, status: string): Promise<PrintJob>;
  
  // Cart operations
  getCart(userId: string): Promise<any>;
  addToCart(userId: string, productId: string, quantity: number, variant?: any): Promise<CartItem>;
  updateCartItem(itemId: string, quantity: number): Promise<CartItem>;
  removeCartItem(itemId: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  getCartItemCount(userId: string): Promise<number>;
  
  // Admin statistics
  getAdminStats(): Promise<any>;
  
  // Teacher plan operations  
  getAllTeacherPlans(): Promise<any[]>;
  getAllTeacherSubscriptions(): Promise<any[]>;
  
  // Teacher operations
  getAllTeachers(): Promise<any[]>;
  createTeacher(teacher: any): Promise<any>;
  updateTeacher(id: string, updates: any): Promise<any>;
  deleteTeacher(id: string): Promise<void>;
  
  // Notification operations
  createNotification(data: any): any;
  getUserNotifications(userId: string): any[];
  markNotificationAsRead(notificationId: string): void;
  
  // Coupon operations
  getAllCoupons(): Promise<any[]>;
  createCoupon(coupon: any): Promise<any>;
  updateCoupon(id: string, updates: any): Promise<any>;
  updateCouponStatus(id: string, isActive: boolean): Promise<any>;
  deleteCoupon(id: string): Promise<boolean>;
  validateCoupon(code: string, orderTotal: number, userId: string): Promise<any>;
  applyCoupon(code: string, orderId: string, orderTotal: number, userId: string): Promise<any>;

  // Inquiry operations
  getAllInquiries(): Promise<any[]>;
  createInquiry(inquiry: any): Promise<any>;
  sendInquiry(inquiryId: string): Promise<any>;
  getInquiryResponses(inquiryId: string): Promise<any[]>;
  createInquiryNotifications(notifications: any[]): Promise<void>;

  // Driver operations
  getAllDrivers(): Promise<any[]>;
  getDriver(id: string): Promise<any | undefined>;
  getDriverByEmail(email: string): Promise<any | undefined>;
  getDriverByUsername(username: string): Promise<any | undefined>;
  createDriver(driver: any): Promise<any>;
  updateDriver(id: string, updates: any): Promise<any>;
  updateDriverStatus(id: string, status: string): Promise<any>;
  updateDriverLocation(id: string, location: any): Promise<any>;
  updateDriverLastActive(id: string): Promise<void>;
  authenticateDriver(identifier: string, password: string): Promise<any>;
  getAvailableDrivers(): Promise<any[]>;
  getAvailableOrdersForDriver(driverId: string): Promise<any[]>;
  assignOrderToDriver(orderId: string, driverId: string): Promise<any>;
  getDriverOrders(driverId: string): Promise<any[]>;
  deleteDriver(id: string): Promise<boolean>;

  // Additional compatibility methods
  getCoupon(id: string): Promise<any>;
  createCouponNotifications(notifications: any[]): Promise<void>;
  getCouponUsageAnalytics(couponId: string): Promise<any>;
  getCart(userId: string): Promise<any>;
  getUserNotifications(userId: string): any[];
  markNotificationAsRead(notificationId: string): void;
  createNotification(data: any): any;

  // Announcement operations
  getAllAnnouncements(): Promise<Announcement[]>;
  getHomepageAnnouncements(): Promise<Announcement[]>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, updates: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<boolean>;

  // Partners operations
  getFeaturedPartners(): Promise<Partner[]>;
  getAllPartners(): Promise<Partner[]>;
  getPartnerById(id: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: string, updates: Partial<Partner>): Promise<Partner | undefined>;
  deletePartner(id: string): Promise<boolean>;
  
  // Partner Products operations
  getPartnerProducts(partnerId: string): Promise<SelectPartnerProduct[]>;
  getAllPartnerProducts(): Promise<SelectPartnerProduct[]>;
  createPartnerProduct(product: InsertPartnerProduct): Promise<SelectPartnerProduct>;
  updatePartnerProduct(id: string, updates: Partial<InsertPartnerProduct>): Promise<SelectPartnerProduct>;
  deletePartnerProduct(id: string): Promise<boolean>;
  getPartnerProductsByCategory(partnerId: string, category: string): Promise<SelectPartnerProduct[]>;
  
  // Security System operations
  getSecureAdminByCredentials(username: string, email: string): Promise<any | undefined>;
  getSecureDriverByCredentials(username: string, email: string, driverCode?: string): Promise<any | undefined>;
  createSecureAdmin(admin: any): Promise<any>;
  createSecureDriver(driver: any): Promise<any>;
  updateSecureAdmin(id: string, updates: any): Promise<any>;
  updateSecureDriver(id: string, updates: any): Promise<any>;
  getAllSecureAdmins(): Promise<any[]>;
  getAllSecureDrivers(): Promise<any[]>;
  createSecurityLog(log: any): Promise<any>;
  getSecurityLogs(options: any): Promise<any[]>;
}

// Global storage to persist across application lifecycle
const globalCouponStorage: any[] = [];
const globalInquiryStorage: any[] = [];

// Memory Storage للاختبار السريع
export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private products: Product[] = [];
  private orders: Order[] = [];
  private cartItems: CartItem[] = [];
  private partners: Partner[] = [];
  private announcements: Announcement[] = [];
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(userData: any): Promise<User> {
    const user: User = {
      id: userData.id || `user-${Date.now()}`,
      username: userData.username || `user-${Date.now()}`,
      email: userData.email || `${Date.now()}@example.com`,
      fullName: userData.fullName || 'مستخدم جديد',
      phone: userData.phone || null,
      countryCode: userData.countryCode || '+20',
      age: userData.age || null,
      gradeLevel: userData.gradeLevel || null,
      role: userData.role || 'customer',
      bountyPoints: userData.bountyPoints || 0,
      level: userData.level || 1,
      totalPrints: userData.totalPrints || 0,
      totalPurchases: userData.totalPurchases || 0,
      totalReferrals: userData.totalReferrals || 0,
      isTeacher: userData.isTeacher || false,
      teacherSubscription: userData.teacherSubscription || false,
      createdAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: string, updates: any): Promise<User> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  }

  async upsertUser(userData: any): Promise<User> {
    const existingUser = this.users.find(u => u.id === userData.id);
    if (existingUser) {
      return await this.updateUser(userData.id, userData);
    } else {
      return await this.createUser(userData);
    }
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async deleteUser(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;
    this.users.splice(userIndex, 1);
    return true;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return [...this.products];
  }

  async createProduct(productData: any): Promise<Product> {
    const product: Product = {
      id: `product-${Date.now()}`,
      ...productData,
      createdAt: new Date()
    };
    this.products.push(product);
    return product;
  }

  async updateProduct(id: string, updates: any): Promise<Product> {
    const productIndex = this.products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    this.products[productIndex] = { ...this.products[productIndex], ...updates };
    return this.products[productIndex];
  }

  async deleteProduct(id: string): Promise<void> {
    const productIndex = this.products.findIndex(p => p.id === id);
    if (productIndex !== -1) {
      this.products.splice(productIndex, 1);
    }
  }

  // Cart operations
  async getCart(userId: string): Promise<any> {
    const items = this.cartItems.filter(item => item.userId === userId);
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price.toString()) * (item.quantity || 0), 0);
    
    return {
      items,
      totalQuantity,
      subtotal,
      currency: 'جنيه'
    };
  }

  async addToCart(userId: string, productId: string, quantity: number, variant?: any): Promise<CartItem> {
    const cartItem: CartItem = {
      id: `cart-${Date.now()}`,
      userId,
      productId,
      quantity,
      price: '10.00', // Default price
      variant: variant || null,
      notes: null,
      createdAt: new Date()
    };
    this.cartItems.push(cartItem);
    return cartItem;
  }

  async updateCartItem(itemId: string, quantity: number): Promise<CartItem> {
    const itemIndex = this.cartItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Cart item not found');
    }
    this.cartItems[itemIndex].quantity = quantity;
    return this.cartItems[itemIndex];
  }

  async removeCartItem(itemId: string): Promise<boolean> {
    const itemIndex = this.cartItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;
    this.cartItems.splice(itemIndex, 1);
    return true;
  }

  async clearCart(userId: string): Promise<boolean> {
    this.cartItems = this.cartItems.filter(item => item.userId !== userId);
    return true;
  }

  async getCartItemCount(userId: string): Promise<number> {
    return this.cartItems.filter(item => item.userId === userId).length;
  }

  // Basic implementations for other required methods
  async getAllOrders(): Promise<Order[]> { return []; }
  async getOrder(id: string): Promise<Order | undefined> { return undefined; }
  async createOrder(order: any): Promise<Order> { 
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      ...order,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.push(newOrder);
    return newOrder;
  }
  async updateOrder(id: string, updates: any): Promise<Order> { throw new Error('Not implemented'); }
  async updateOrderStatus(id: string, status: string): Promise<Order> { throw new Error('Not implemented'); }
  async updateOrderRating(id: string, rating: number, review?: string): Promise<Order> { throw new Error('Not implemented'); }
  async cancelOrder(id: string): Promise<Order> { throw new Error('Not implemented'); }
  async addDriverNote(id: string, note: string): Promise<Order> { throw new Error('Not implemented'); }
  async getActiveOrders(): Promise<Order[]> { return []; }
  async getOrdersByStatus(status: string): Promise<Order[]> { return []; }
  async deleteOrder(id: string): Promise<boolean> { return false; }
  
  // Print jobs
  printJobs: PrintJob[] = [];

  async getAllPrintJobs(): Promise<PrintJob[]> { 
    return this.printJobs; 
  }
  
  async createPrintJob(printJobData: any): Promise<PrintJob> { 
    const printJob: PrintJob = {
      id: `pj-${Date.now()}`,
      userId: printJobData.userId,
      filename: printJobData.filename,
      fileUrl: printJobData.fileUrl,
      fileSize: printJobData.fileSize || 0,
      fileType: printJobData.fileType || 'application/pdf',
      pages: printJobData.pages || 1,
      copies: printJobData.copies || 1,
      colorMode: printJobData.colorMode || 'grayscale',
      paperSize: printJobData.paperSize || 'A4',
      paperType: printJobData.paperType || 'plain',
      doubleSided: printJobData.doubleSided || false,
      pageRange: printJobData.pageRange || 'all',
      status: printJobData.status || 'pending',
      progress: 0,
      queuePosition: this.printJobs.length + 1,
      cost: printJobData.cost || '0',
      pointsEarned: 0,
      priority: printJobData.priority || 'normal',
      createdAt: new Date(),
      completedAt: null
    };
    
    this.printJobs.push(printJob);
    console.log('📋 Created print job:', printJob.id, 'for', printJob.filename);
    return printJob;
  }
  
  async updatePrintJobStatus(id: string, status: string): Promise<PrintJob> { 
    const printJob = this.printJobs.find(pj => pj.id === id);
    if (!printJob) {
      throw new Error(`Print job not found: ${id}`);
    }
    
    printJob.status = status;
    if (status === 'completed') {
      printJob.completedAt = new Date();
      printJob.progress = 100;
    }
    
    console.log('📋 Updated print job status:', id, '->', status);
    return printJob;
  }
  
  // Admin stats
  async getAdminStats(): Promise<any> { 
    return {
      totalUsers: this.users.length,
      totalProducts: this.products.length,
      totalOrders: this.orders.length
    };
  }
  
  // Stubs for all other methods - to be implemented as needed
  async getAllTeacherPlans(): Promise<any[]> { return []; }
  async getAllTeacherSubscriptions(): Promise<any[]> { return []; }
  async getAllTeachers(): Promise<any[]> { return []; }
  async createTeacher(teacher: any): Promise<any> { throw new Error('Not implemented'); }
  async updateTeacher(id: string, updates: any): Promise<any> { throw new Error('Not implemented'); }
  async deleteTeacher(id: string): Promise<void> { throw new Error('Not implemented'); }
  
  createNotification(data: any): any { return { id: `notif-${Date.now()}`, ...data }; }
  getUserNotifications(userId: string): any[] { return []; }
  markNotificationAsRead(notificationId: string): void { }
  
  async getAllCoupons(): Promise<any[]> { return []; }
  async createCoupon(coupon: any): Promise<any> { throw new Error('Not implemented'); }
  async updateCoupon(id: string, updates: any): Promise<any> { throw new Error('Not implemented'); }
  async updateCouponStatus(id: string, isActive: boolean): Promise<any> { throw new Error('Not implemented'); }
  async deleteCoupon(id: string): Promise<boolean> { return false; }
  async validateCoupon(code: string, orderTotal: number, userId: string): Promise<any> { return null; }
  async applyCoupon(code: string, orderId: string, orderTotal: number, userId: string): Promise<any> { return null; }
  
  async getAllInquiries(): Promise<any[]> { return []; }
  async createInquiry(inquiry: any): Promise<any> { throw new Error('Not implemented'); }
  async sendInquiry(inquiryId: string): Promise<any> { throw new Error('Not implemented'); }
  async getInquiryResponses(inquiryId: string): Promise<any[]> { return []; }
  async createInquiryNotifications(notifications: any[]): Promise<void> { }
  
  async getAllDrivers(): Promise<any[]> { return []; }
  async getDriver(id: string): Promise<any | undefined> { return undefined; }
  async getDriverByEmail(email: string): Promise<any | undefined> { return undefined; }
  async getDriverByUsername(username: string): Promise<any | undefined> { return undefined; }
  async createDriver(driver: any): Promise<any> { throw new Error('Not implemented'); }
  async updateDriver(id: string, updates: any): Promise<any> { throw new Error('Not implemented'); }
  async updateDriverStatus(id: string, status: string): Promise<any> { throw new Error('Not implemented'); }
  async updateDriverLocation(id: string, location: any): Promise<any> { throw new Error('Not implemented'); }
  async updateDriverLastActive(id: string): Promise<void> { }
  async authenticateDriver(identifier: string, password: string): Promise<any> { return null; }
  async getAvailableDrivers(): Promise<any[]> { return []; }
  async getAvailableOrdersForDriver(driverId: string): Promise<any[]> { return []; }
  async assignOrderToDriver(orderId: string, driverId: string): Promise<any> { throw new Error('Not implemented'); }
  async getDriverOrders(driverId: string): Promise<any[]> { return []; }
  async deleteDriver(id: string): Promise<boolean> { return false; }
  
  async getCoupon(id: string): Promise<any> { return null; }
  async createCouponNotifications(notifications: any[]): Promise<void> { }
  async getCouponUsageAnalytics(couponId: string): Promise<any> { return {}; }
  
  // Partners
  async getFeaturedPartners(): Promise<Partner[]> { 
    return this.partners.filter(partner => partner.isFeatured && partner.isActive);
  }
  async getAllPartners(): Promise<Partner[]> { 
    return this.partners; 
  }
  async getPartnerById(id: string): Promise<Partner | undefined> { 
    return this.partners.find(partner => partner.id === id);
  }
  async createPartner(partner: any): Promise<Partner> {
    const newPartner: Partner = {
      id: `partner-${Date.now()}`,
      ...partner,
      rating: "0.00",
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.partners.push(newPartner);
    console.log(`🤝 New partner created: ${newPartner.name}`);
    return newPartner;
  }
  async updatePartner(id: string, updates: any): Promise<Partner> {
    const index = this.partners.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Partner not found');
    
    this.partners[index] = {
      ...this.partners[index],
      ...updates,
      updatedAt: new Date(),
    };
    console.log(`🤝 Partner updated: ${id}`);
    return this.partners[index];
  }
  async deletePartner(id: string): Promise<boolean> {
    const index = this.partners.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.partners.splice(index, 1);
    console.log(`🤝 Partner deleted: ${id}`);
    return true;
  }
  
  // Partner Products
  async getPartnerProducts(partnerId: string): Promise<any[]> { return []; }
  async getAllPartnerProducts(): Promise<any[]> { return []; }
  async createPartnerProduct(product: any): Promise<any> { throw new Error('Not implemented'); }
  async updatePartnerProduct(id: string, updates: any): Promise<any> { throw new Error('Not implemented'); }
  async deletePartnerProduct(id: string): Promise<boolean> { return false; }
  async getPartnerProductsByCategory(category: string): Promise<any[]> { return []; }
  
  // Announcements
  async getActiveAnnouncements(): Promise<Announcement[]> { 
    return this.announcements.filter(ann => ann.isActive && (!ann.expiresAt || new Date(ann.expiresAt) > new Date()));
  }
  async getHomepageAnnouncements(): Promise<Announcement[]> { 
    return this.announcements.filter(ann => ann.showOnHomepage && ann.isActive)
      .sort((a, b) => (b.homepagePriority || 0) - (a.homepagePriority || 0));
  }
  async getAllAnnouncements(): Promise<Announcement[]> { return this.announcements; }
  async getAnnouncement(id: string): Promise<Announcement | undefined> { 
    return this.announcements.find(ann => ann.id === id);
  }
  async createAnnouncement(announcementData: any): Promise<Announcement> { 
    const announcement: Announcement = {
      id: `ann-${Date.now()}`,
      ...announcementData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.announcements.push(announcement);
    return announcement;
  }
  async updateAnnouncement(id: string, updates: any): Promise<Announcement> { 
    const index = this.announcements.findIndex(ann => ann.id === id);
    if (index === -1) throw new Error('Announcement not found');
    this.announcements[index] = { ...this.announcements[index], ...updates, updatedAt: new Date().toISOString() };
    return this.announcements[index];
  }
  async deleteAnnouncement(id: string): Promise<boolean> { 
    const index = this.announcements.findIndex(ann => ann.id === id);
    if (index === -1) return false;
    this.announcements.splice(index, 1);
    return true;
  }
  
  // Security
  async getSecureAdminByCredentials(username: string, email: string): Promise<any | undefined> { return undefined; }
  async getSecureDriverByCredentials(username: string, email: string, driverCode?: string): Promise<any | undefined> { return undefined; }
  async createSecureAdmin(admin: any): Promise<any> { throw new Error('Not implemented'); }
  async createSecureDriver(driver: any): Promise<any> { throw new Error('Not implemented'); }
  async updateSecureAdmin(id: string, updates: any): Promise<any> { throw new Error('Not implemented'); }
  async updateSecureDriver(id: string, updates: any): Promise<any> { throw new Error('Not implemented'); }
  async getAllSecureAdmins(): Promise<any[]> { return []; }
  async getAllSecureDrivers(): Promise<any[]> { return []; }
  async createSecurityLog(log: any): Promise<any> { throw new Error('Not implemented'); }
  async getSecurityLogs(options: any): Promise<any[]> { return []; }
  async updateSecureAdminStatus(id: string, isActive: boolean): Promise<any> { throw new Error('Not implemented'); }
  async updateSecureDriverStatus(id: string, isActive: boolean): Promise<any> { throw new Error('Not implemented'); }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // First delete any related data like cart items, orders, etc.
      await db.delete(cartItems).where(eq(cartItems.userId, id));
      // Then delete the user
      const result = await db.delete(users).where(eq(users.id, id));
      return (result as any).rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async createProduct(productData: any): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async updateProduct(id: string, updates: any): Promise<Product> {
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    // First delete any cart items that reference this product
    await db.delete(cartItems).where(eq(cartItems.productId, id));
    // Then delete the product
    await db.delete(products).where(eq(products.id, id));
  }

  // Order operations
  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(orderData: any): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(orderData)
      .returning();
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getActiveOrders(): Promise<Order[]> {
    // Get orders that are not delivered or cancelled
    const activeOrders = await db
      .select()
      .from(orders)
      .where(sql`${orders.status} NOT IN ('delivered', 'cancelled')`)
      .orderBy(desc(orders.createdAt));
    return activeOrders;
  }

  async updateOrderRating(id: string, rating: number, review?: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ 
        rating,
        review,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async cancelOrder(id: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ 
        status: 'cancelled',
        statusText: 'ملغي',
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async addDriverNote(id: string, note: string): Promise<Order> {
    const [existingOrder] = await db.select().from(orders).where(eq(orders.id, id));
    const currentNotes = existingOrder.driverNotes || '';
    
    const [order] = await db
      .update(orders)
      .set({ 
        driverNotes: currentNotes + '\n' + note,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrder(id: string, updates: any): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt));
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      await db.delete(orders).where(eq(orders.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  // Print Job operations
  async getAllPrintJobs(): Promise<PrintJob[]> {
    return await db.select().from(printJobs).orderBy(desc(printJobs.createdAt));
  }

  async createPrintJob(printJobData: any): Promise<PrintJob> {
    const [printJob] = await db
      .insert(printJobs)
      .values(printJobData)
      .returning();
    return printJob;
  }

  async updatePrintJobStatus(id: string, status: string): Promise<PrintJob> {
    const [printJob] = await db
      .update(printJobs)
      .set({ status })
      .where(eq(printJobs.id, id))
      .returning();
    return printJob;
  }

  // Cart operations
  async addToCart(cartData: { userId: string; productId: string; quantity: number }): Promise<CartItem> {
    const [cartItem] = await db
      .insert(cartItems)
      .values(cartData)
      .returning();
    return cartItem;
  }

  // Admin statistics
  async getAdminStats(): Promise<any> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const [printJobCount] = await db.select({ count: sql<number>`count(*)` }).from(printJobs);

    return {
      totalUsers: userCount.count,
      totalProducts: productCount.count,
      totalOrders: orderCount.count,
      totalPrintJobs: printJobCount.count,
      revenue: 15000, // This would be calculated from actual orders
      monthlyGrowth: 25
    };
  }

  // Teacher plan operations  
  async getAllTeacherPlans(): Promise<any[]> {
    // Return mock teacher plans for now
    return [
      {
        id: '1',
        name: 'خطة المعلم الأساسية',
        nameEn: 'Basic Teacher Plan',
        description: 'خطة أساسية للمعلمين الجدد',
        price: '99.00',
        duration: 30,
        maxStudents: 30,
        maxMaterials: 100,
        active: true
      }
    ];
  }

  async getAllTeacherSubscriptions(): Promise<any[]> {
    // Return mock teacher subscriptions for now
    return [
      {
        id: '1',
        teacherName: 'أحمد محمد',
        planName: 'خطة المعلم الأساسية',
        status: 'active',
        endDate: '2024-12-31'
      }
    ];
  }

  async getAllTeachers(): Promise<any[]> {
    // Return sample teachers data for now
    return [
      {
        id: "1",
        fullName: "أحمد محمد علي",
        email: "ahmed.ali@school.edu.eg", 
        phone: "1012345678",
        countryCode: "+20",
        specialization: "math",
        school: "مدرسة النصر الابتدائية",
        educationLevel: "bachelor",
        university: "جامعة القاهرة",
        graduationYear: 2015,
        yearsOfExperience: 8,
        gradesTaught: ["primary_1", "primary_2", "primary_3"],
        subjectsSpecialty: ["math", "science"],
        bio: "معلم رياضيات متميز مع خبرة 8 سنوات في التدريس",
        isVerified: true,
        rating: 4.8,
        ratingCount: 45,
        studentsCount: 120,
        materialsCount: 25,
        status: "active"
      },
      {
        id: "2", 
        fullName: "فاطمة حسن محمود",
        email: "fatma.hassan@school.edu.eg",
        phone: "1098765432",
        countryCode: "+20",
        specialization: "arabic",
        school: "مدرسة الأمل الإعدادية", 
        educationLevel: "master",
        university: "جامعة الأزهر",
        graduationYear: 2012,
        yearsOfExperience: 12,
        gradesTaught: ["preparatory_1", "preparatory_2", "preparatory_3"],
        subjectsSpecialty: ["arabic", "islamic"],
        bio: "معلمة لغة عربية حاصلة على ماجستير في الأدب العربي",
        isVerified: true,
        rating: 4.9,
        ratingCount: 67,
        studentsCount: 180,
        materialsCount: 42,
        status: "active"
      },
      {
        id: "3",
        fullName: "محمد سمير إبراهيم", 
        email: "mohamed.samir@school.edu.eg",
        phone: "1123456789",
        countryCode: "+20",
        specialization: "english",
        school: "مدرسة المستقبل الثانوية",
        educationLevel: "bachelor",
        university: "جامعة عين شمس",
        graduationYear: 2018,
        yearsOfExperience: 5,
        gradesTaught: ["secondary_1", "secondary_2", "secondary_3"],
        subjectsSpecialty: ["english"],
        bio: "معلم لغة إنجليزية شاب ومتحمس للتعليم التفاعلي",
        isVerified: false,
        rating: 4.5,
        ratingCount: 28,
        studentsCount: 85,
        materialsCount: 18,
        status: "active"
      }
    ];
  }

  async createTeacher(teacherData: any): Promise<any> {
    // Would normally insert into teacherProfiles table
    const newTeacher = {
      id: Date.now().toString(),
      ...teacherData,
      rating: 0,
      ratingCount: 0,
      studentsCount: 0,
      materialsCount: 0,
      createdAt: new Date()
    };
    return newTeacher;
  }

  async updateTeacher(id: string, updates: any): Promise<any> {
    // Would normally update teacherProfiles table
    return { id, ...updates };
  }

  async deleteTeacher(id: string): Promise<void> {
    // Would normally delete from teacherProfiles table
    console.log(`Teacher ${id} deleted`);
  }

  // Coupon operations using global storage
  async getAllCoupons(): Promise<any[]> {
    return [...globalCouponStorage];
  }

  async createCoupon(couponData: any): Promise<any> {
    const newCoupon = {
      id: Date.now().toString(),
      ...couponData,
      createdAt: new Date()
    };
    globalCouponStorage.push(newCoupon);
    console.log('Created coupon:', newCoupon);
    return newCoupon;
  }

  async updateCoupon(id: string, updates: any): Promise<any> {
    const index = globalCouponStorage.findIndex(c => c.id === id);
    if (index !== -1) {
      globalCouponStorage[index] = { ...globalCouponStorage[index], ...updates, updatedAt: new Date() };
      return globalCouponStorage[index];
    }
    throw new Error('Coupon not found');
  }

  async updateCouponStatus(id: string, isActive: boolean): Promise<any> {
    const index = globalCouponStorage.findIndex(c => c.id === id);
    if (index !== -1) {
      globalCouponStorage[index].isActive = isActive;
      globalCouponStorage[index].updatedAt = new Date();
      return globalCouponStorage[index];
    }
    throw new Error('Coupon not found');
  }

  async deleteCoupon(id: string): Promise<boolean> {
    const index = globalCouponStorage.findIndex(c => c.id === id);
    if (index !== -1) {
      globalCouponStorage.splice(index, 1);
      console.log(`Coupon ${id} deleted`);
      return true;
    }
    return false;
  }

  async validateCoupon(code: string, orderTotal: number, userId: string): Promise<any> {
    // For now, return a mock validation result
    return { valid: true, discount: 10, type: 'percentage' };
  }

  async applyCoupon(code: string, orderId: string, orderTotal: number, userId: string): Promise<any> {
    // For now, return a mock application result
    return { applied: true, discount: 10, finalTotal: orderTotal * 0.9 };
  }

  // Inquiry operations using global storage
  async getAllInquiries(): Promise<any[]> {
    return [...globalInquiryStorage].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createInquiry(inquiryData: any): Promise<any> {
    const inquiry = {
      id: Date.now().toString(),
      ...inquiryData,
      status: 'draft',
      responseCount: 0,
      totalRecipients: 0,
      createdAt: new Date()
    };
    globalInquiryStorage.push(inquiry);
    console.log('Created inquiry:', inquiry);
    return inquiry;
  }

  async sendInquiry(inquiryId: string): Promise<any> {
    const index = globalInquiryStorage.findIndex(i => i.id === inquiryId);
    if (index !== -1) {
      globalInquiryStorage[index] = {
        ...globalInquiryStorage[index],
        status: 'sent',
        sentAt: new Date(),
        totalRecipients: this.calculateRecipients(globalInquiryStorage[index])
      };
      return globalInquiryStorage[index];
    }
    throw new Error('Inquiry not found');
  }

  async getInquiryResponses(inquiryId: string): Promise<any[]> {
    // Return mock responses for now
    return [
      {
        id: '1',
        inquiryId,
        userId: 'user1',
        userName: 'أحمد محمد',
        message: 'هذا رد تجريبي على الاستعلام',
        createdAt: new Date()
      }
    ];
  }

  private calculateRecipients(inquiry: any): number {
    // Calculate number of recipients based on target type
    switch (inquiry.targetType) {
      case 'all_customers':
        return 100; // Mock number
      case 'specific_customers':
        return inquiry.targetUserIds?.length || 0;
      case 'grade_level':
        return 25; // Mock number for grade level
      case 'location':
        return 50; // Mock number for location
      default:
        return 0;
    }
  }

  // Additional methods needed for compatibility
  async getCoupon(id: string): Promise<any> {
    const coupon = globalCouponStorage.find(c => c.id === id);
    return coupon || null;
  }

  async createCouponNotifications(notifications: any[]): Promise<void> {
    // Implementation would store notifications for each coupon
    console.log('Creating coupon notifications:', notifications);
  }

  async getCouponUsageAnalytics(couponId: string): Promise<any> {
    const coupon = globalCouponStorage.find(c => c.id === couponId);
    if (!coupon) return null;

    return {
      couponId,
      couponCode: coupon.code,
      couponName: coupon.name,
      totalUsage: coupon.usageCount || 0,
      usageLimit: coupon.usageLimit,
      clickThroughRate: '5.2',
      openRate: '12.5'
    };
  }

  async getCart(userId: string): Promise<any> {
    // Mock cart implementation
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      shipping: 0,
      availablePoints: 0
    };
  }

  getUserNotifications(userId: string): any[] {
    // Mock notifications
    return [];
  }

  markNotificationAsRead(notificationId: string): void {
    // Mock implementation
  }

  createNotification(data: any): any {
    // Mock implementation
    return { id: Date.now().toString(), ...data };
  }

  async createInquiryNotifications(notifications: any[]): Promise<void> {
    // Store notifications for inquiry system
    for (const notification of notifications) {
      const notificationId = `inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      globalNotificationStorage.push({
        id: notificationId,
        ...notification,
        createdAt: new Date().toISOString()
      });
    }
    console.log(`💾 Stored ${notifications.length} inquiry notifications`);
  }

  // Driver operations - Real implementation with Supabase
  async getAllDrivers(): Promise<any[]> {
    try {
      const result = await db.select().from(drivers).orderBy(desc(drivers.createdAt));
      return result;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return [];
    }
  }

  async getDriver(id: string): Promise<any> {
    try {
      const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
      return driver;
    } catch (error) {
      console.error('Error fetching driver:', error);
      return null;
    }
  }

  async getDriverByEmail(email: string): Promise<any> {
    try {
      const [driver] = await db.select().from(drivers).where(eq(drivers.email, email));
      return driver;
    } catch (error) {
      console.error('Error fetching driver by email:', error);
      return null;
    }
  }

  async getDriverByUsername(username: string): Promise<any> {
    try {
      const [driver] = await db.select().from(drivers).where(eq(drivers.username, username));
      return driver;
    } catch (error) {
      console.error('Error fetching driver by username:', error);
      return null;
    }
  }

  async createDriver(driverData: any): Promise<any> {
    try {
      const [newDriver] = await db.insert(drivers).values({
        ...driverData,
        id: sql`gen_random_uuid()`,
        driverCode: `DRV${Date.now()}`,
        status: 'offline',
        isAvailable: true,
        rating: '0.00',
        ratingCount: 0,
        totalDeliveries: 0,
        completedDeliveries: 0,
        cancelledDeliveries: 0,
        earnings: '0.00',
        isVerified: false,
        documentsVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log(`🚚 New driver created: ${newDriver.name} (@${newDriver.username})`);
      return newDriver;
    } catch (error) {
      console.error('Error creating driver:', error);
      throw error;
    }
  }

  async updateDriver(id: string, updates: any): Promise<any> {
    try {
      const [updatedDriver] = await db.update(drivers)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(drivers.id, id))
        .returning();
      
      console.log(`🚚 Driver updated: ${id}`);
      return updatedDriver;
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  }

  async updateDriverStatus(id: string, status: string): Promise<any> {
    try {
      const [updatedDriver] = await db.update(drivers)
        .set({ 
          status, 
          isAvailable: status === 'online',
          lastActiveAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(drivers.id, id))
        .returning();
      
      console.log(`🚚 Driver status updated: ${id} -> ${status}`);
      return updatedDriver;
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  }

  async updateDriverLocation(id: string, location: any): Promise<any> {
    try {
      const [updatedDriver] = await db.update(drivers)
        .set({
          currentLocation: location,
          lastLocationUpdate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(drivers.id, id))
        .returning();
      
      return updatedDriver;
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  }

  async authenticateDriver(identifier: string, password: string): Promise<any> {
    console.log(`🏢 DatabaseStorage: authenticateDriver called`);
    try {
      console.log(`🔍 Looking for driver with identifier: ${identifier}`);
      
      // Try to find driver by email first, then by username
      let driver = await this.getDriverByEmail(identifier);
      if (!driver) {
        console.log(`📧 No driver found by email, trying username...`);
        driver = await this.getDriverByUsername(identifier);
      }
      
      if (!driver) {
        console.log(`❌ No driver found with identifier: ${identifier}`);
        return null;
      }

      console.log(`✅ Driver found: ${driver.name} (${driver.username})`);
      console.log(`🔐 Comparing passwords: provided="${password}", stored="${driver.password}"`);

      // In production, you should hash and compare passwords
      if (driver.password === password) {
        console.log(`✅ Password match! Authenticating driver ${driver.name}`);
        // Update last active time
        await this.updateDriver(driver.id, { lastActiveAt: new Date() });
        return driver;
      }
      
      console.log(`❌ Password mismatch for driver ${driver.name}`);
      return null;
    } catch (error) {
      console.error('Error authenticating driver:', error);
      return null;
    }
  }

  async getAvailableDrivers(): Promise<any[]> {
    try {
      const result = await db.select().from(drivers)
        .where(eq(drivers.isAvailable, true))
        .orderBy(drivers.rating);
      return result;
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      return [];
    }
  }

  async assignOrderToDriver(orderId: string, driverId: string): Promise<any> {
    try {
      const driver = await this.getDriver(driverId);
      if (!driver) {
        throw new Error('Driver not found');
      }

      const [updatedOrder] = await db.update(orders)
        .set({
          driverId: driverId,
          driverName: driver.name,
          driverPhone: driver.phone,
          status: 'out_for_delivery',
          outForDeliveryAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();

      console.log(`🚚 Order ${orderId} assigned to driver ${driver.name}`);
      return updatedOrder;
    } catch (error) {
      console.error('Error assigning order to driver:', error);
      throw error;
    }
  }

  async getDriverOrders(driverId: string): Promise<any[]> {
    try {
      const result = await db.select().from(orders)
        .where(eq(orders.driverId, driverId))
        .orderBy(desc(orders.createdAt));
      return result;
    } catch (error) {
      console.error('Error fetching driver orders:', error);
      return [];
    }
  }

  async deleteDriver(id: string): Promise<boolean> {
    try {
      await db.delete(drivers).where(eq(drivers.id, id));
      console.log(`🚚 Driver deleted: ${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting driver:', error);
      return false;
    }
  }

  // Cart operations
  async getCart(userId: string): Promise<any> {
    try {
      const items = await db
        .select({
          id: cartItems.id,
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          price: cartItems.price,
          variant: cartItems.variant,
          notes: cartItems.notes,
          productName: products.name,
          productImage: products.imageUrl,
          productStock: products.stock,
          productPrice: products.price,
          createdAt: cartItems.createdAt,
        })
        .from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userId, userId))
        .orderBy(desc(cartItems.createdAt));

      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

      return {
        items,
        totalQuantity,
        subtotal,
        currency: 'جنيه',
      };
    } catch (error) {
      console.error('Error fetching cart:', error);
      return { items: [], totalQuantity: 0, subtotal: 0, currency: 'جنيه' };
    }
  }

  async addToCart(userId: string, productId: string, quantity: number, variant?: any): Promise<CartItem> {
    try {
      // Get product to check stock and price
      const [product] = await db.select().from(products).where(eq(products.id, productId));
      if (!product) {
        throw new Error('Product not found');
      }

      // Check if item already exists in cart
      const [existingItem] = await db
        .select()
        .from(cartItems)
        .where(and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId)
        ));

      if (existingItem) {
        // Update existing item
        const newQuantity = existingItem.quantity + quantity;
        const [updatedItem] = await db
          .update(cartItems)
          .set({ 
            quantity: newQuantity,
            updatedAt: new Date()
          })
          .where(eq(cartItems.id, existingItem.id))
          .returning();
        return updatedItem;
      } else {
        // Add new item
        const [newItem] = await db
          .insert(cartItems)
          .values({
            userId,
            productId,
            quantity,
            price: product.price,
            variant,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        return newItem;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async updateCartItem(itemId: string, quantity: number): Promise<CartItem> {
    try {
      const [updatedItem] = await db
        .update(cartItems)
        .set({ 
          quantity,
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, itemId))
        .returning();
      return updatedItem;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  async removeCartItem(itemId: string): Promise<boolean> {
    try {
      await db.delete(cartItems).where(eq(cartItems.id, itemId));
      return true;
    } catch (error) {
      console.error('Error removing cart item:', error);
      return false;
    }
  }

  async clearCart(userId: string): Promise<boolean> {
    try {
      await db.delete(cartItems).where(eq(cartItems.userId, userId));
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }

  async getCartItemCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(cartItems)
        .where(eq(cartItems.userId, userId));
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting cart item count:', error);
      return 0;
    }
  }

  // Security System operations - Database implementation
  async getSecureAdminByCredentials(username: string, email: string): Promise<any | undefined> {
    try {
      const [admin] = await db
        .select()
        .from(secureAdmins)
        .where(and(eq(secureAdmins.username, username), eq(secureAdmins.email, email)))
        .limit(1);
      return admin;
    } catch (error) {
      console.error('Error getting secure admin by credentials:', error);
      return undefined;
    }
  }

  async getSecureDriverByCredentials(username: string, email: string, driverCode?: string): Promise<any | undefined> {
    try {
      let query = db
        .select()
        .from(secureDrivers)
        .where(and(eq(secureDrivers.username, username), eq(secureDrivers.email, email)));
      
      if (driverCode) {
        query = query.where(eq(secureDrivers.driverCode, driverCode));
      }
      
      const [driver] = await query.limit(1);
      return driver;
    } catch (error) {
      console.error('Error getting secure driver by credentials:', error);
      return undefined;
    }
  }

  async createSecureAdmin(adminData: any): Promise<any> {
    try {
      const [newAdmin] = await db
        .insert(secureAdmins)
        .values({
          ...adminData,
          isActive: true,
          failedAttempts: 0,
          mustChangePassword: false,
          sessionTimeout: 900,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log(`🔐 New secure admin created: ${newAdmin.username}`);
      return newAdmin;
    } catch (error) {
      console.error('Error creating secure admin:', error);
      throw new Error('Failed to create secure admin');
    }
  }

  async createSecureDriver(driverData: any): Promise<any> {
    try {
      const [newDriver] = await db
        .insert(secureDrivers)
        .values({
          ...driverData,
          isActive: true,
          status: 'offline',
          failedAttempts: 0,
          totalDeliveries: 0,
          rating: 5.0,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log(`🚚 New secure driver created: ${newDriver.username}`);
      return newDriver;
    } catch (error) {
      console.error('Error creating secure driver:', error);
      throw new Error('Failed to create secure driver');
    }
  }

  async updateSecureAdmin(id: string, updates: any): Promise<any> {
    try {
      const [updatedAdmin] = await db
        .update(secureAdmins)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(secureAdmins.id, id))
        .returning();
      
      if (!updatedAdmin) {
        throw new Error('Secure admin not found');
      }
      
      console.log(`🔐 Secure admin updated: ${id}`);
      return updatedAdmin;
    } catch (error) {
      console.error('Error updating secure admin:', error);
      throw new Error('Failed to update secure admin');
    }
  }

  async updateSecureDriver(id: string, updates: any): Promise<any> {
    try {
      const [updatedDriver] = await db
        .update(secureDrivers)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(secureDrivers.id, id))
        .returning();
      
      if (!updatedDriver) {
        throw new Error('Secure driver not found');
      }
      
      console.log(`🚚 Secure driver updated: ${id}`);
      return updatedDriver;
    } catch (error) {
      console.error('Error updating secure driver:', error);
      throw new Error('Failed to update secure driver');
    }
  }

  async getAllSecureAdmins(): Promise<any[]> {
    try {
      const admins = await db
        .select({
          id: secureAdmins.id,
          username: secureAdmins.username,
          email: secureAdmins.email,
          fullName: secureAdmins.fullName,
          role: secureAdmins.role,
          permissions: secureAdmins.permissions,
          isActive: secureAdmins.isActive,
          lastLogin: secureAdmins.lastLogin,
          createdAt: secureAdmins.createdAt
        })
        .from(secureAdmins)
        .orderBy(desc(secureAdmins.createdAt));
      
      return admins;
    } catch (error) {
      console.error('Error getting all secure admins:', error);
      return [];
    }
  }

  async getAllSecureDrivers(): Promise<any[]> {
    try {
      const drivers = await db
        .select({
          id: secureDrivers.id,
          username: secureDrivers.username,
          email: secureDrivers.email,
          fullName: secureDrivers.fullName,
          driverCode: secureDrivers.driverCode,
          phone: secureDrivers.phone,
          vehicleType: secureDrivers.vehicleType,
          vehiclePlate: secureDrivers.vehiclePlate,
          isActive: secureDrivers.isActive,
          status: secureDrivers.status,
          lastLogin: secureDrivers.lastLogin,
          rating: secureDrivers.rating,
          totalDeliveries: secureDrivers.totalDeliveries,
          createdAt: secureDrivers.createdAt
        })
        .from(secureDrivers)
        .orderBy(desc(secureDrivers.createdAt));
      
      return drivers;
    } catch (error) {
      console.error('Error getting all secure drivers:', error);
      return [];
    }
  }

  async createSecurityLog(logData: any): Promise<any> {
    try {
      const [newLog] = await db
        .insert(securityLogs)
        .values({
          ...logData,
          createdAt: new Date()
        })
        .returning();
      
      return newLog;
    } catch (error) {
      console.error('Error creating security log:', error);
      throw new Error('Failed to create security log');
    }
  }

  async getSecurityLogs(options: any): Promise<any[]> {
    try {
      let query = db.select().from(securityLogs);
      
      if (options.userType) {
        query = query.where(eq(securityLogs.userType, options.userType));
      }
      
      if (options.action) {
        query = query.where(eq(securityLogs.action, options.action));
      }
      
      const logs = await query
        .orderBy(desc(securityLogs.createdAt))
        .limit(options.limit || 50);
      
      return logs;
    } catch (error) {
      console.error('Error getting security logs:', error);
      return [];
    }
  }

  // Initialize test accounts for security system
  async initializeTestAccounts(): Promise<void> {
    try {
      // Check if test admin exists
      const existingAdmin = await this.getSecureAdminByCredentials('testadmin', 'admin@test.com');
      if (!existingAdmin) {
        await this.createSecureAdmin({
          username: 'testadmin',
          email: 'admin@test.com',
          password: 'hashed_testpass123',
          fullName: 'مدير تجريبي',
          role: 'admin',
          permissions: ['read', 'write', 'admin']
        });
        console.log('🔐 Test admin account created in database');
      }

      // Check if test driver exists
      const existingDriver = await this.getSecureDriverByCredentials('testdriver', 'driver@test.com', 'DR001');
      if (!existingDriver) {
        await this.createSecureDriver({
          username: 'testdriver',
          email: 'driver@test.com',
          password: 'hashed_driverpass123',
          driverCode: 'DR001',
          fullName: 'سائق تجريبي',
          phone: '1234567890',
          licenseNumber: 'LIC123',
          vehicleType: 'motorcycle',
          vehiclePlate: 'ABC123'
        });
        console.log('🚚 Test driver account created in database');
      }
    } catch (error) {
      console.error('Error initializing test accounts:', error);
    }
  }
}

// In-memory storage to bypass database connection issues
class MemStorage implements IStorage {
  private users: User[] = [];
  private cartItems: any[] = [];
  private announcements: Announcement[] = [];
  private partners: Partner[] = [];
  private secureAdmins: any[] = [];
  private secureDrivers: any[] = [];
  private securityLogs: any[] = [];

  constructor() {
    // Initialize with test admin account
    this.secureAdmins.push({
      id: 'admin-1',
      username: 'testadmin',
      email: 'admin@test.com',
      password: 'hashed_testpass123',
      fullName: 'مدير تجريبي',
      role: 'admin',
      permissions: ['read', 'write', 'admin'],
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Initialize with test driver account
    this.secureDrivers.push({
      id: 'driver-1',
      username: 'testdriver',
      email: 'driver@test.com',
      password: 'hashed_driverpass123',
      driverCode: 'DR001',
      fullName: 'سائق تجريبي',
      phone: '1234567890',
      licenseNumber: 'LIC123',
      vehicleType: 'motorcycle',
      vehiclePlate: 'ABC123',
      isActive: true,
      status: 'offline',
      rating: 5.0,
      totalDeliveries: 0,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('🔐 Test admin created: username=testadmin, email=admin@test.com, password=testpass123');
    console.log('🚚 Test driver created: username=testdriver, email=driver@test.com, password=driverpass123, code=DR001');
  }

  // Method to clean up duplicate priorities in existing data
  private cleanupHomepagePriorities(): void {
    console.log('🧹 Cleaning up homepage priority conflicts...');
    
    const homepageAnnouncements = this.announcements.filter(ann => ann.showOnHomepage);
    const priorityMap: { [key: number]: Announcement[] } = {};
    
    // Group announcements by priority
    homepageAnnouncements.forEach(ann => {
      if (!priorityMap[ann.homepagePriority]) {
        priorityMap[ann.homepagePriority] = [];
      }
      priorityMap[ann.homepagePriority].push(ann);
    });
    
    // Fix conflicts
    Object.keys(priorityMap).forEach(priorityStr => {
      const priority = parseInt(priorityStr);
      const anns = priorityMap[priority];
      
      if (anns.length > 1) {
        console.log(`🚨 Found ${anns.length} announcements with priority ${priority}`);
        
        // Keep the first one, reassign others
        for (let i = 1; i < anns.length; i++) {
          const newPriority = this.getNextAvailablePriority(priority);
          anns[i].homepagePriority = newPriority;
          console.log(`📌 Reassigned "${anns[i].title}" from priority ${priority} to ${newPriority}`);
        }
      }
    });
    
    console.log('✅ Homepage priority cleanup completed');
  }

  private products: Product[] = [
    {
      id: '1',
      name: 'كتاب الرياضيات للصف الثالث الابتدائي',
      nameEn: 'Mathematics Book Grade 3',
      description: 'كتاب شامل لمنهج الرياضيات للصف الثالث الابتدائي',
      descriptionEn: 'Comprehensive mathematics book for grade 3',
      category: 'books',
      price: '45.00',
      originalPrice: '50.00',
      imageUrl: '',
      curriculumType: 'egyptian_arabic',
      subject: 'math',
      gradeLevel: 'primary_3',
      authorPublisher: 'وزارة التربية والتعليم',
      productTypes: ['book'],
      isDigital: false,
      downloadUrl: '',
      coverType: 'color',
      availableCopies: 25,
      downloadLimits: 'unlimited',
      canPrintDirectly: true,
      grade: 'الثالث الابتدائي',
      publisher: 'وزارة التربية والتعليم',
      curriculum: 'المنهج المصري',
      stock: 25,
      rating: '4.50',
      ratingCount: 15,
      tags: ['رياضيات', 'ابتدائي'],
      featured: true,
      teacherOnly: false,
      vip: false,
      variants: [],
      createdAt: new Date()
    }
  ];
  private orders: Order[] = [
    {
      id: 'ORD-001',
      userId: '48c03e72-d53b-4a3f-a729-c38276268315',
      customerName: 'أحمد محمد علي',
      customerPhone: '01012345678',
      customerEmail: 'ahmed@email.com',
      deliveryAddress: 'شارع المنصورة، حي المعادي، القاهرة',
      notes: 'يرجى التأكد من جودة الطباعة والألوان',
      adminNotes: '',
      items: [
        {
          id: 'item-1',
          type: 'document',
          name: 'ملزمة الرياضيات للثانوية العامة',
          description: 'ملزمة شاملة للمراجعة النهائية',
          quantity: 3,
          pages: 150,
          color: true,
          paperSize: 'A4',
          binding: 'spiral',
          estimatedPrice: 75,
          finalPrice: 75,
          fileUrl: 'https://example.com/math-booklet.pdf'
        },
        {
          id: 'item-2', 
          type: 'book',
          name: 'كتاب الفيزياء للصف الثاني الثانوي',
          description: 'كتاب وزارة التربية والتعليم',
          quantity: 2,
          pages: 200,
          color: false,
          paperSize: 'A4',
          binding: 'hardcover',
          estimatedPrice: 40,
          finalPrice: 40
        }
      ],
      totalAmount: 115,
      estimatedCost: 110,
      finalPrice: 115,
      status: 'pending',
      paymentMethod: 'نقدي عند الاستلام',
      priority: 'high',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 'ORD-002',
      userId: 'user-2',
      customerName: 'فاطمة حسن إبراهيم',
      customerPhone: '01098765432',
      customerEmail: 'fatma@email.com',
      deliveryAddress: 'شارع البترول، مدينة نصر، القاهرة',
      notes: 'طلب عاجل - امتحان غداً',
      adminNotes: 'تم التسعير والموافقة',
      items: [
        {
          id: 'item-3',
          type: 'document',
          name: 'أسئلة مراجعة اللغة الإنجليزية',
          description: 'مجموعة أسئلة للمراجعة النهائية',
          quantity: 1,
          pages: 25,
          color: false,
          paperSize: 'A4',
          binding: 'none',
          estimatedPrice: 15,
          finalPrice: 15
        }
      ],
      totalAmount: 15,
      estimatedCost: 12,
      finalPrice: 15,
      status: 'confirmed',
      paymentMethod: 'نقدي عند الاستلام',
      priority: 'urgent',
      createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      id: 'ORD-003',
      userId: 'user-3',
      customerName: 'محمد سعد أحمد',
      customerPhone: '01154321098',
      customerEmail: 'mohamed@email.com',
      deliveryAddress: 'شارع فيصل، الجيزة',
      notes: 'يفضل التسليم بعد الساعة 4 عصراً',
      adminNotes: 'جاري الطباعة',
      items: [
        {
          id: 'item-4',
          type: 'custom',
          name: 'بروشور إعلاني',
          description: 'تصميم بروشور ملون للشركة',
          quantity: 100,
          pages: 2,
          color: true,
          paperSize: 'A5',
          binding: 'none',
          estimatedPrice: 200,
          finalPrice: 180
        }
      ],
      totalAmount: 180,
      estimatedCost: 200,
      finalPrice: 180,
      status: 'printing',
      paymentMethod: 'تحويل بنكي',
      priority: 'medium',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      id: 'ORD-004',
      userId: 'user-4',
      customerName: 'نورا عبد الرحمن',
      customerPhone: '01276543210',
      customerEmail: 'nora@email.com',
      deliveryAddress: 'شارع الهرم، الجيزة',
      notes: '',
      adminNotes: 'تم التسليم بنجاح',
      items: [
        {
          id: 'item-5',
          type: 'document',
          name: 'مذكرة التاريخ',
          description: 'مذكرة شاملة لمنهج التاريخ',
          quantity: 1,
          pages: 80,
          color: false,
          paperSize: 'A4',
          binding: 'spiral',
          estimatedPrice: 35,
          finalPrice: 35
        }
      ],
      totalAmount: 35,
      estimatedCost: 35,
      finalPrice: 35,
      status: 'delivered',
      paymentMethod: 'نقدي عند الاستلام',
      priority: 'low',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    }
  ];
  private printJobs: PrintJob[] = [];
  private cartItems: CartItem[] = [];
  private notifications: any[] = [
    {
      id: 'notif-1',
      userId: '48c03e72-d53b-4a3f-a729-c38276268315',
      type: 'order',
      message: 'تم قبول طلبك رقم #ORD-001 وجاري التحضير الآن',
      read: false,
      createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      metadata: { orderId: 'ORD-001' }
    },
    {
      id: 'notif-2',
      userId: '48c03e72-d53b-4a3f-a729-c38276268315',
      type: 'delivery',
      message: 'السائق في الطريق إليك! متوقع الوصول خلال 15 دقيقة',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      metadata: { orderId: 'ORD-001', driverId: 'driver-123' }
    },
    {
      id: 'notif-3',
      userId: '48c03e72-d53b-4a3f-a729-c38276268315',
      type: 'print',
      message: 'تم الانتهاء من طباعة ملفك "كتاب الرياضيات" بجودة عالية',
      read: true,
      createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      metadata: { fileId: 'file-456' }
    }
  ];

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(userData: any): Promise<User> {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...userData,
      createdAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: string, updates: any): Promise<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      return this.users[index];
    }
    throw new Error('User not found');
  }

  async getAllUsers(): Promise<User[]> {
    try {
      // Get all users from Supabase database
      const dbUsers = await db.select().from(users);
      console.log(`Found ${dbUsers.length} users in database`);
      return dbUsers;
    } catch (error) {
      console.error('Error fetching users from database:', error);
      // Return empty array if database not available
      return [];
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      return false;
    }
    this.users.splice(index, 1);
    return true;
  }

  async upsertUser(userData: any): Promise<User> {
    const existing = await this.getUserByEmail(userData.email);
    if (existing) {
      return this.updateUser(existing.id, userData);
    }
    return this.createUser(userData);
  }

  async getAllProducts(): Promise<Product[]> {
    return [...this.products].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createProduct(productData: any): Promise<Product> {
    const product: Product = {
      id: Math.random().toString(36).substr(2, 9),
      ...productData,
      createdAt: new Date()
    };
    this.products.push(product);
    return product;
  }

  async updateProduct(id: string, updates: any): Promise<Product> {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updates };
      return this.products[index];
    }
    throw new Error('Product not found');
  }

  async deleteProduct(id: string): Promise<void> {
    this.products = this.products.filter(p => p.id !== id);
    this.cartItems = this.cartItems.filter(c => c.productId !== id);
  }

  async getAllOrders(): Promise<Order[]> {
    return [...this.orders].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createOrder(orderData: any): Promise<Order> {
    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      ...orderData,
      createdAt: new Date()
    };
    this.orders.push(order);
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.find(o => o.id === id);
  }

  async updateOrder(id: string, updates: any): Promise<Order> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      this.orders[index] = { ...this.orders[index], ...updates, updatedAt: new Date() };
      return this.orders[index];
    }
    throw new Error('Order not found');
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return this.updateOrder(id, { status });
  }

  async updateOrderRating(id: string, rating: number, review?: string): Promise<Order> {
    return this.updateOrder(id, { rating, review });
  }

  async cancelOrder(id: string): Promise<Order> {
    return this.updateOrder(id, { status: 'cancelled' });
  }

  async addDriverNote(id: string, note: string): Promise<Order> {
    const order = await this.getOrder(id);
    const currentNotes = order?.driverNotes || '';
    return this.updateOrder(id, { driverNotes: currentNotes + '\n' + note });
  }

  async getActiveOrders(): Promise<Order[]> {
    return this.orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return this.orders.filter(o => o.status === status);
  }

  async deleteOrder(id: string): Promise<boolean> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return false;
    this.orders.splice(index, 1);
    return true;
    this.orders.push(order);
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.find(o => o.id === id);
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      this.orders[index].status = status;
      return this.orders[index];
    }
    throw new Error('Order not found');
  }

  async updateOrderRating(id: string, rating: number, review?: string): Promise<Order> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      this.orders[index] = { ...this.orders[index], rating, review };
      return this.orders[index];
    }
    throw new Error('Order not found');
  }

  async cancelOrder(id: string): Promise<Order> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      this.orders[index].status = 'cancelled';
      return this.orders[index];
    }
    throw new Error('Order not found');
  }

  async addDriverNote(id: string, note: string): Promise<Order> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      this.orders[index] = { ...this.orders[index], driverNotes: note };
      return this.orders[index];
    }
    throw new Error('Order not found');
  }

  async getActiveOrders(): Promise<Order[]> {
    return this.orders.filter(o => 
      o.status !== 'delivered' && o.status !== 'cancelled'
    );
  }

  async getAllPrintJobs(): Promise<PrintJob[]> {
    return [...this.printJobs].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createPrintJob(printJobData: any): Promise<PrintJob> {
    const printJob: PrintJob = {
      id: Math.random().toString(36).substr(2, 9),
      ...printJobData,
      createdAt: new Date()
    };
    this.printJobs.push(printJob);
    return printJob;
  }

  async updatePrintJobStatus(id: string, status: string): Promise<PrintJob> {
    const index = this.printJobs.findIndex(p => p.id === id);
    if (index !== -1) {
      this.printJobs[index].status = status;
      return this.printJobs[index];
    }
    throw new Error('Print job not found');
  }

  async addToCart(userId: string, productId: string, quantity: number, variant?: any): Promise<any> {
    console.log(`🛒 Adding to cart: userId=${userId}, productId=${productId}, quantity=${quantity}`);
    
    // Check if product exists
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      console.error(`❌ Product not found: ${productId}`);
      throw new Error('Product not found');
    }

    console.log(`✅ Found product: ${product.name}`);

    // Check if item already exists in cart
    const existingItemIndex = this.cartItems.findIndex(item => 
      item.userId === userId && item.productId === productId
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      this.cartItems[existingItemIndex].quantity += quantity;
      console.log(`📝 Updated existing cart item: ${this.cartItems[existingItemIndex].id}, new quantity: ${this.cartItems[existingItemIndex].quantity}`);
      return this.cartItems[existingItemIndex];
    } else {
      // Add new item
      const cartItem = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        productId,
        quantity,
        price: product.price,
        variant,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.cartItems.push(cartItem);
      console.log(`➕ Added new cart item: ${cartItem.id}, total cart items: ${this.cartItems.length}`);
      return cartItem;
    }
  }

  async getCart(userId: string): Promise<any> {
    try {
      console.log(`🛒 Getting cart for user: ${userId}`);
      const userCartItems = this.cartItems.filter(item => item.userId === userId);
      console.log(`📦 Found ${userCartItems.length} cart items for user ${userId}`);
      
      const items = userCartItems.map(item => {
        const product = this.products.find(p => p.id === item.productId);
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant,
          notes: item.notes,
          productName: product?.name || 'منتج غير موجود',
          productImage: product?.imageUrl || '',
          productStock: product?.stock || 0,
          productPrice: product?.price || '0',
          createdAt: item.createdAt,
        };
      });

      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

      const cart = {
        items,
        totalQuantity,
        subtotal,
        currency: 'جنيه',
      };
      
      console.log(`🛒 Cart response:`, cart);
      return cart;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return { items: [], totalQuantity: 0, subtotal: 0, currency: 'جنيه' };
    }
  }

  async updateCartItem(itemId: string, quantity: number): Promise<any> {
    const itemIndex = this.cartItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Cart item not found');
    }
    
    this.cartItems[itemIndex].quantity = quantity;
    this.cartItems[itemIndex].updatedAt = new Date();
    return this.cartItems[itemIndex];
  }

  async removeCartItem(itemId: string): Promise<boolean> {
    const itemIndex = this.cartItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return false;
    }
    
    this.cartItems.splice(itemIndex, 1);
    return true;
  }

  async clearCart(userId: string): Promise<boolean> {
    this.cartItems = this.cartItems.filter(item => item.userId !== userId);
    return true;
  }

  async getCartItemCount(userId: string): Promise<number> {
    return this.cartItems.filter(item => item.userId === userId).length;
  }

  async getAdminStats(): Promise<any> {
    return {
      totalUsers: this.users.length,
      totalProducts: this.products.length,
      totalOrders: this.orders.length,
      totalPrintJobs: this.printJobs.length,
      revenue: 15000,
      monthlyGrowth: 25
    };
  }

  async getAllTeacherPlans(): Promise<any[]> {
    return [
      {
        id: '1',
        name: 'خطة المعلم الأساسية',
        nameEn: 'Basic Teacher Plan',
        description: 'خطة أساسية للمعلمين الجدد',
        price: '99.00',
        duration: 30,
        maxStudents: 30,
        maxMaterials: 100,
        active: true
      }
    ];
  }

  async getAllTeacherSubscriptions(): Promise<any[]> {
    return [
      {
        id: '1',
        teacherName: 'أحمد محمد',
        planName: 'خطة المعلم الأساسية',
        status: 'active',
        endDate: '2024-12-31'
      }
    ];
  }

  async getAllTeachers(): Promise<any[]> {
    return [
      {
        id: "1",
        fullName: "أحمد محمد علي",
        email: "ahmed.ali@school.edu.eg", 
        phone: "1012345678",
        countryCode: "+20",
        specialization: "math",
        school: "مدرسة النصر الابتدائية",
        educationLevel: "bachelor",
        university: "جامعة القاهرة",
        graduationYear: 2015,
        yearsOfExperience: 8,
        gradesTaught: ["primary_1", "primary_2", "primary_3"],
        subjectsSpecialty: ["math", "science"],
        bio: "معلم رياضيات متميز مع خبرة 8 سنوات في التدريس",
        isVerified: true,
        rating: 4.8,
        ratingCount: 45,
        studentsCount: 120,
        materialsCount: 25,
        status: "active"
      },
      {
        id: "2", 
        fullName: "فاطمة حسن محمود",
        email: "fatma.hassan@school.edu.eg",
        phone: "1098765432",
        countryCode: "+20",
        specialization: "arabic",
        school: "مدرسة الأمل الإعدادية", 
        educationLevel: "master",
        university: "جامعة الأزهر",
        graduationYear: 2012,
        yearsOfExperience: 12,
        gradesTaught: ["preparatory_1", "preparatory_2", "preparatory_3"],
        subjectsSpecialty: ["arabic", "islamic"],
        bio: "معلمة لغة عربية حاصلة على ماجستير في الأدب العربي",
        isVerified: true,
        rating: 4.9,
        ratingCount: 67,
        studentsCount: 180,
        materialsCount: 42,
        status: "active"
      }
    ];
  }

  async createTeacher(teacherData: any): Promise<any> {
    const newTeacher = {
      id: Date.now().toString(),
      ...teacherData,
      rating: 0,
      ratingCount: 0,
      studentsCount: 0,
      materialsCount: 0,
      createdAt: new Date()
    };
    return newTeacher;
  }

  async updateTeacher(id: string, updates: any): Promise<any> {
    return { id, ...updates };
  }

  async deleteTeacher(id: string): Promise<void> {
    console.log(`Teacher ${id} deleted`);
  }

  // Notification operations
  createNotification(data: any): any {
    const notification = { 
      id: Math.random().toString(36).substr(2, 9), 
      ...data, 
      read: false,
      createdAt: new Date() 
    };
    this.notifications.push(notification);
    return notification;
  }

  getUserNotifications(userId: string): any[] {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // ==================== COUPON OPERATIONS ====================
  
  async getAllCoupons(): Promise<any[]> {
    return [...globalCouponStorage].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createCoupon(couponData: any): Promise<any> {
    const coupon = {
      id: Date.now().toString(),
      ...couponData,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    globalCouponStorage.push(coupon);
    return coupon;
  }

  async updateCoupon(id: string, updates: any): Promise<any> {
    const index = globalCouponStorage.findIndex(c => c.id === id);
    if (index !== -1) {
      globalCouponStorage[index] = { 
        ...globalCouponStorage[index], 
        ...updates, 
        updatedAt: new Date() 
      };
      return globalCouponStorage[index];
    }
    return null;
  }

  async updateCouponStatus(id: string, isActive: boolean): Promise<any> {
    const index = globalCouponStorage.findIndex(c => c.id === id);
    if (index !== -1) {
      globalCouponStorage[index] = { 
        ...globalCouponStorage[index], 
        isActive, 
        updatedAt: new Date() 
      };
      return globalCouponStorage[index];
    }
    return null;
  }

  async deleteCoupon(id: string): Promise<boolean> {
    const index = globalCouponStorage.findIndex(c => c.id === id);
    if (index !== -1) {
      globalCouponStorage.splice(index, 1);
      return true;
    }
    return false;
  }

  async validateCoupon(code: string, orderTotal: number, userId: string): Promise<any> {
    const coupon = this.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());

    if (!coupon) {
      return { valid: false, error: 'كود القسيمة غير صحيح' };
    }

    if (!coupon.isActive) {
      return { valid: false, error: 'القسيمة غير نشطة' };
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return { valid: false, error: 'انتهت صلاحية القسيمة' };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: 'تم استنفاد عدد مرات استخدام القسيمة' };
    }

    const minOrder = parseFloat(coupon.minimumOrderValue || '0');
    if (orderTotal < minOrder) {
      return { 
        valid: false, 
        error: `الحد الأدنى للطلب ${minOrder} جنيه` 
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderTotal * parseFloat(coupon.discountValue)) / 100;
      if (coupon.maximumDiscount) {
        discountAmount = Math.min(discountAmount, parseFloat(coupon.maximumDiscount));
      }
    } else {
      discountAmount = parseFloat(coupon.discountValue);
    }

    return {
      valid: true,
      coupon,
      discountAmount: Math.round(discountAmount * 100) / 100
    };
  }

  async applyCoupon(code: string, orderId: string, orderTotal: number, userId: string): Promise<any> {
    const validation = await this.validateCoupon(code, orderTotal, userId);
    
    if (!validation.valid) {
      return validation;
    }

    // Update usage count
    const coupon = validation.coupon;
    coupon.usageCount = (coupon.usageCount || 0) + 1;
    coupon.updatedAt = new Date();

    return {
      success: true,
      discountAmount: validation.discountAmount,
      coupon: validation.coupon
    };
  }

  async getCoupon(id: string): Promise<any> {
    return this.coupons.find(c => c.id === id) || null;
  }

  // Notification storage for coupons
  private couponNotifications: any[] = [];

  async createCouponNotifications(notifications: any[]): Promise<void> {
    this.couponNotifications.push(...notifications);
  }

  async getCouponUsageAnalytics(couponId: string): Promise<any> {
    const coupon = this.coupons.find(c => c.id === couponId);
    if (!coupon) return null;

    const notifications = this.couponNotifications.filter(n => n.couponId === couponId);
    const clickedNotifications = notifications.filter(n => n.isClicked);
    const readNotifications = notifications.filter(n => n.isRead);

    return {
      couponId,
      couponCode: coupon.code,
      couponName: coupon.name,
      totalUsage: coupon.usageCount || 0,
      usageLimit: coupon.usageLimit,
      notificationsSent: notifications.length,
      notificationsRead: readNotifications.length,
      notificationsClicked: clickedNotifications.length,
      clickThroughRate: notifications.length > 0 ? (clickedNotifications.length / notifications.length * 100).toFixed(1) : '0.0',
      openRate: notifications.length > 0 ? (readNotifications.length / notifications.length * 100).toFixed(1) : '0.0',
      usageByDay: this.getCouponUsageByDay(couponId),
      topUsers: this.getTopCouponUsers(couponId)
    };
  }

  private getCouponUsageByDay(couponId: string): any[] {
    // Mock daily usage data for the last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        usage: Math.floor(Math.random() * 10),
        revenue: Math.floor(Math.random() * 500)
      });
    }
    return days;
  }

  private getTopCouponUsers(couponId: string): any[] {
    // Mock top users data
    return [
      { userId: "user1", username: "أحمد محمد", usageCount: 3, totalSavings: 75 },
      { userId: "user2", username: "فاطمة أحمد", usageCount: 2, totalSavings: 50 },
      { userId: "user3", username: "محمد علي", usageCount: 2, totalSavings: 40 }
    ];
  }

  // Inquiry operations using global storage
  async getAllInquiries(): Promise<any[]> {
    return [...globalInquiryStorage].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createInquiry(inquiryData: any): Promise<any> {
    const inquiry = {
      id: Date.now().toString(),
      ...inquiryData,
      status: 'draft',
      responseCount: 0,
      totalRecipients: 0,
      createdAt: new Date()
    };
    globalInquiryStorage.push(inquiry);
    console.log('Created inquiry:', inquiry);
    return inquiry;
  }

  async sendInquiry(inquiryId: string): Promise<any> {
    const index = globalInquiryStorage.findIndex(i => i.id === inquiryId);
    if (index !== -1) {
      globalInquiryStorage[index] = {
        ...globalInquiryStorage[index],
        status: 'sent',
        sentAt: new Date(),
        totalRecipients: this.calculateRecipients(globalInquiryStorage[index])
      };
      return globalInquiryStorage[index];
    }
    throw new Error('Inquiry not found');
  }

  async getInquiryResponses(inquiryId: string): Promise<any[]> {
    // Return mock responses for now
    return [
      {
        id: '1',
        inquiryId,
        userId: 'user1',
        userName: 'أحمد محمد',
        message: 'هذا رد تجريبي على الاستعلام',
        createdAt: new Date()
      }
    ];
  }

  private calculateRecipients(inquiry: any): number {
    // Calculate number of recipients based on target type
    switch (inquiry.targetType) {
      case 'all_customers':
        return 100; // Mock number
      case 'specific_customers':
        return inquiry.targetUserIds?.length || 0;
      case 'grade_level':
        return 25; // Mock number for grade level
      case 'location':
        return 50; // Mock number for location
      default:
        return 0;
    }
  }

  // Additional methods needed for compatibility
  async getCoupon(id: string): Promise<any> {
    const coupon = globalCouponStorage.find(c => c.id === id);
    return coupon || null;
  }

  async createCouponNotifications(notifications: any[]): Promise<void> {
    // Implementation would store notifications for each coupon
    console.log('Creating coupon notifications:', notifications);
  }

  async getCouponUsageAnalytics(couponId: string): Promise<any> {
    const coupon = globalCouponStorage.find(c => c.id === couponId);
    if (!coupon) return null;

    return {
      couponId,
      couponCode: coupon.code,
      couponName: coupon.name,
      totalUsage: coupon.usageCount || 0,
      usageLimit: coupon.usageLimit,
      clickThroughRate: '5.2',
      openRate: '12.5'
    };
  }

  async getCart(userId: string): Promise<any> {
    // Mock cart implementation
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      shipping: 0,
      availablePoints: 0
    };
  }

  getUserNotifications(userId: string): any[] {
    // Mock notifications
    return [];
  }

  markNotificationAsRead(notificationId: string): void {
    // Mock implementation
  }

  createNotification(data: any): any {
    // Mock implementation
    return { id: Date.now().toString(), ...data };
  }

  async createInquiryNotifications(notifications: any[]): Promise<void> {
    // Store notifications for inquiry system in MemStorage
    for (const notification of notifications) {
      const notificationId = `inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.notifications.push({
        id: notificationId,
        ...notification,
        read: false,
        createdAt: new Date()
      });
    }
    console.log(`💾 Stored ${notifications.length} inquiry notifications in MemStorage`);
  }

  // Driver operations - Mock data for fallback
  private drivers: any[] = [
    {
      id: 'driver1',
      name: 'أحمد السائق',
      username: 'Ahmed12',
      email: 'ahmed@driver.com',
      phone: '01012345678',
      password: 'S582038s123',
      vehicleType: 'motorcycle',
      vehiclePlate: 'ABC123',
      status: 'offline',
      isAvailable: true,
      rating: '4.5',
      totalDeliveries: 25,
      completedDeliveries: 23,
      cancelledDeliveries: 2,
      earnings: '1250.00',
      workingArea: 'القاهرة الكبرى',
      isVerified: true,
      documentsVerified: true,
      driverCode: 'DRV001',
      createdAt: new Date()
    },
    {
      id: 'driver2',
      name: 'محمد التوصيل',
      username: 'Mohammed99',
      email: 'mohamed@driver.com',
      phone: '01098765432',
      password: 'password123',
      vehicleType: 'car',
      vehiclePlate: 'XYZ789',
      status: 'online',
      isAvailable: true,
      rating: '4.8',
      totalDeliveries: 45,
      completedDeliveries: 42,
      cancelledDeliveries: 3,
      earnings: '2100.00',
      workingArea: 'الجيزة',
      isVerified: true,
      documentsVerified: true,
      driverCode: 'DRV002',
      createdAt: new Date()
    }
  ];

  async getAllDrivers(): Promise<any[]> {
    return [...this.drivers].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getDriver(id: string): Promise<any> {
    return this.drivers.find(d => d.id === id) || null;
  }

  async getDriverByEmail(email: string): Promise<any> {
    return this.drivers.find(d => d.email === email) || null;
  }

  async getDriverByUsername(username: string): Promise<any> {
    return this.drivers.find(d => d.username === username) || null;
  }

  async createDriver(driverData: any): Promise<any> {
    const newDriver = {
      id: `driver_${Date.now()}`,
      driverCode: `DRV${Date.now()}`,
      status: 'offline',
      isAvailable: true,
      rating: '0.00',
      ratingCount: 0,
      totalDeliveries: 0,
      completedDeliveries: 0,
      cancelledDeliveries: 0,
      earnings: '0.00',
      isVerified: false,
      documentsVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...driverData
    };
    this.drivers.push(newDriver);
    console.log(`🚚 New driver created: ${newDriver.name} (${newDriver.email})`);
    return newDriver;
  }

  async updateDriver(id: string, updates: any): Promise<any> {
    const index = this.drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      this.drivers[index] = { 
        ...this.drivers[index], 
        ...updates, 
        updatedAt: new Date() 
      };
      console.log(`🚚 Driver updated: ${id}`);
      return this.drivers[index];
    }
    throw new Error('Driver not found');
  }

  async updateDriverStatus(id: string, status: string): Promise<any> {
    const index = this.drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      this.drivers[index] = {
        ...this.drivers[index],
        status,
        isAvailable: status === 'online',
        lastActiveAt: new Date(),
        updatedAt: new Date()
      };
      console.log(`🚚 Driver status updated: ${id} -> ${status}`);
      return this.drivers[index];
    }
    throw new Error('Driver not found');
  }

  async updateDriverLocation(id: string, location: any): Promise<any> {
    const index = this.drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      this.drivers[index] = {
        ...this.drivers[index],
        currentLocation: location,
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      };
      return this.drivers[index];
    }
    throw new Error('Driver not found');
  }

  async authenticateDriver(identifier: string, password: string): Promise<any> {
    console.log(`[MEMSTORAGE] authenticateDriver CALLED!!! identifier=${identifier}, password=${password}`);
    console.log(`[MEMSTORAGE] drivers count: ${this.drivers.length}`);
    console.log(`[MEMSTORAGE] drivers:`, this.drivers.map(d => `${d.name}(user:${d.username},pass:${d.password})`));
    
    // Try to find driver by email or username
    const driver = this.drivers.find(d => 
      (d.email === identifier || d.username === identifier) && d.password === password
    );
    
    if (driver) {
      console.log(`✅ MemStorage: Driver found and authenticated: ${driver.name}`);
      // Update last active time
      await this.updateDriver(driver.id, { lastActiveAt: new Date() });
      return driver;
    }
    
    console.log(`❌ MemStorage: No matching driver found for: ${identifier}`);
    return null;
  }

  async getAvailableDrivers(): Promise<any[]> {
    return this.drivers.filter(d => d.isAvailable && d.status === 'online');
  }

  async assignOrderToDriver(orderId: string, driverId: string): Promise<any> {
    const driver = this.drivers.find(d => d.id === driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      this.orders[orderIndex] = {
        ...this.orders[orderIndex],
        driverId: driverId,
        driverName: driver.name,
        driverPhone: driver.phone,
        status: 'out_for_delivery',
        outForDeliveryAt: new Date(),
        updatedAt: new Date()
      };
      console.log(`🚚 Order ${orderId} assigned to driver ${driver.name}`);
      return this.orders[orderIndex];
    }
    throw new Error('Order not found');
  }

  async getDriverOrders(driverId: string): Promise<any[]> {
    return this.orders.filter(o => o.driverId === driverId);
  }

  async deleteDriver(id: string): Promise<boolean> {
    const index = this.drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      this.drivers.splice(index, 1);
      console.log(`🚚 Driver deleted: ${id}`);
      return true;
    }
    return false;
  }

  async getDriver(id: string): Promise<any | undefined> {
    return this.drivers.find(driver => driver.id === id);
  }

  async getDriverByEmail(email: string): Promise<any | undefined> {
    return this.drivers.find(driver => driver.email === email);
  }

  async getDriverByUsername(username: string): Promise<any | undefined> {
    return this.drivers.find(driver => driver.username === username);
  }

  async createDriver(driverData: any): Promise<any> {
    const newDriver = {
      id: `driver_${Date.now()}`,
      ...driverData,
      createdAt: new Date(),
      lastActiveAt: new Date()
    };
    this.drivers.push(newDriver);
    return newDriver;
  }

  async updateDriver(id: string, updates: any): Promise<any> {
    const driverIndex = this.drivers.findIndex(driver => driver.id === id);
    if (driverIndex === -1) {
      throw new Error('Driver not found');
    }

    this.drivers[driverIndex] = {
      ...this.drivers[driverIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.drivers[driverIndex];
  }

  async updateDriverStatus(id: string, status: string): Promise<any> {
    return this.updateDriver(id, { 
      status, 
      lastActiveAt: new Date() 
    });
  }

  async updateDriverLastActive(id: string): Promise<void> {
    const driverIndex = this.drivers.findIndex(driver => driver.id === id);
    if (driverIndex !== -1) {
      this.drivers[driverIndex].lastActiveAt = new Date();
    }
  }



  async getAvailableOrdersForDriver(driverId: string): Promise<any[]> {
    // Return orders that are pending or waiting for pickup
    const availableOrders = this.orders
      .filter(order => 
        ['pending', 'confirmed', 'preparing'].includes(order.status) &&
        !order.driverId
      )
      .map(order => ({
        id: order.id,
        orderNumber: order.orderNumber || `ORD${order.id}`,
        customerName: order.customerName || 'عميل',
        customerPhone: order.customerPhone || '01000000000',
        deliveryAddress: order.deliveryAddress || order.shippingAddress || 'القاهرة',
        items: order.items || [
          { name: 'منتج', quantity: 1, price: order.total || '0' }
        ],
        totalAmount: order.total || '0.00',
        status: order.status,
        deliveryNotes: order.deliveryNotes,
        estimatedDelivery: 30,
        createdAt: order.createdAt || new Date().toISOString()
      }));

    return availableOrders;
  }

  async assignOrderToDriver(orderId: string, driverId: string): Promise<void> {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex !== -1) {
      this.orders[orderIndex] = {
        ...this.orders[orderIndex],
        driverId,
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      };
    }
  }

  async updateOrderStatus(orderId: string, status: string, driverId?: string): Promise<void> {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex !== -1) {
      const updates: any = { status };
      
      if (status === 'picked_up') {
        updates.pickedUpAt = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.deliveredAt = new Date().toISOString();
        
        // Update driver earnings when order is delivered
        if (driverId) {
          const driverIndex = this.drivers.findIndex(d => d.id === driverId);
          if (driverIndex !== -1) {
            const order = this.orders[orderIndex];
            const deliveryFee = parseFloat(order.total) * 0.1; // 10% commission
            const currentEarnings = parseFloat(this.drivers[driverIndex].earnings || '0');
            
            this.drivers[driverIndex] = {
              ...this.drivers[driverIndex],
              earnings: (currentEarnings + deliveryFee).toFixed(2),
              totalDeliveries: (this.drivers[driverIndex].totalDeliveries || 0) + 1,
              completedDeliveries: (this.drivers[driverIndex].completedDeliveries || 0) + 1
            };
          }
        }
      }

      this.orders[orderIndex] = {
        ...this.orders[orderIndex],
        ...updates
      };
    }
  }

  // Announcement operations
  async getAllAnnouncements(): Promise<Announcement[]> {
    return [...this.announcements].sort((a, b) => a.position - b.position);
  }

  async getHomepageAnnouncements(): Promise<Announcement[]> {
    return this.announcements
      .filter(ann => ann.isActive && ann.showOnHomepage)
      .sort((a, b) => a.homepagePriority - b.homepagePriority)
      .slice(0, 4); // Limit to 4 announcements
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return this.announcements
      .filter(ann => ann.isActive)
      .sort((a, b) => a.position - b.position);
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    return this.announcements.find(ann => ann.id === id);
  }

  async createAnnouncement(announcementData: InsertAnnouncement): Promise<Announcement> {
    // Handle priority conflicts for homepage announcements
    if (announcementData.showOnHomepage && announcementData.homepagePriority > 0) {
      this.adjustHomepagePriorities(announcementData.homepagePriority);
    }

    const announcement: Announcement = {
      id: Math.random().toString(36).substr(2, 9),
      ...announcementData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.announcements.push(announcement);
    return announcement;
  }

  async updateAnnouncement(id: string, updates: Partial<InsertAnnouncement>): Promise<Announcement> {
    const index = this.announcements.findIndex(ann => ann.id === id);
    if (index === -1) {
      throw new Error('Announcement not found');
    }
    
    const currentAnnouncement = this.announcements[index];
    
    // Handle priority conflicts for homepage announcements
    if (updates.showOnHomepage && updates.homepagePriority && updates.homepagePriority > 0) {
      // Only adjust if the priority is actually changing
      if (currentAnnouncement.homepagePriority !== updates.homepagePriority) {
        this.adjustHomepagePriorities(updates.homepagePriority, id);
      }
    }
    
    this.announcements[index] = {
      ...this.announcements[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    return this.announcements[index];
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const index = this.announcements.findIndex(ann => ann.id === id);
    if (index === -1) {
      return false;
    }
    
    this.announcements.splice(index, 1);
    return true;
  }

  // Helper method to adjust homepage priorities and avoid conflicts
  private adjustHomepagePriorities(newPriority: number, excludeId?: string): void {
    console.log(`🔄 Checking priority conflicts for priority ${newPriority}, excluding ${excludeId}`);
    
    // Find announcements with conflicting priority
    const conflictingAnnouncements = this.announcements.filter(ann => 
      ann.showOnHomepage && 
      ann.homepagePriority === newPriority &&
      ann.id !== excludeId
    );

    console.log(`🚨 Found ${conflictingAnnouncements.length} conflicting announcements`);

    // Shift conflicting announcements to next available priority
    conflictingAnnouncements.forEach(ann => {
      const oldPriority = ann.homepagePriority;
      const nextAvailablePriority = this.getNextAvailablePriority(newPriority, excludeId);
      ann.homepagePriority = nextAvailablePriority;
      ann.updatedAt = new Date();
      
      console.log(`📌 Moved announcement "${ann.title}" from priority ${oldPriority} to ${nextAvailablePriority}`);
    });
  }

  private getNextAvailablePriority(startFrom: number, excludeId?: string): number {
    for (let priority = startFrom + 1; priority <= 4; priority++) {
      const exists = this.announcements.some(ann => 
        ann.showOnHomepage && 
        ann.homepagePriority === priority &&
        ann.id !== excludeId
      );
      if (!exists) {
        console.log(`✅ Next available priority found: ${priority}`);
        return priority;
      }
    }
    
    // If all priorities 1-4 are taken, try to find any available slot from 1-4
    for (let priority = 1; priority <= 4; priority++) {
      const exists = this.announcements.some(ann => 
        ann.showOnHomepage && 
        ann.homepagePriority === priority &&
        ann.id !== excludeId
      );
      if (!exists) {
        console.log(`✅ Available priority slot found: ${priority}`);
        return priority;
      }
    }
    
    console.warn(`⚠️ All priority slots 1-4 are taken, assigning priority 5 (will not display)`);
    return 5;
  }

  // ==================== PARTNERS OPERATIONS ====================

  async getFeaturedPartners(): Promise<Partner[]> {
    return this.partners.filter(partner => partner.isFeatured && partner.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getAllPartners(): Promise<Partner[]> {
    return this.partners.filter(partner => partner.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getPartnerById(id: string): Promise<Partner | undefined> {
    return this.partners.find(partner => partner.id === id);
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const newPartner: Partner = {
      id: `partner-${Date.now()}`,
      ...partner,
      rating: "0.00",
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.partners.push(newPartner);
    console.log(`🤝 New partner created: ${newPartner.name}`);
    return newPartner;
  }

  async updatePartner(id: string, updates: Partial<Partner>): Promise<Partner | undefined> {
    const index = this.partners.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    this.partners[index] = {
      ...this.partners[index],
      ...updates,
      updatedAt: new Date(),
    };
    console.log(`🤝 Partner updated: ${id}`);
    return this.partners[index];
  }

  async deletePartner(id: string): Promise<boolean> {
    const index = this.partners.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.partners.splice(index, 1);
    console.log(`🤝 Partner deleted: ${id}`);
    return true;
  }

  // Partner Products operations - In-memory implementation
  private partnerProducts: SelectPartnerProduct[] = [];

  async getPartnerProducts(partnerId: string): Promise<SelectPartnerProduct[]> {
    return this.partnerProducts.filter(p => p.partnerId === partnerId);
  }

  async getAllPartnerProducts(): Promise<SelectPartnerProduct[]> {
    return [...this.partnerProducts];
  }

  async createPartnerProduct(productData: InsertPartnerProduct): Promise<SelectPartnerProduct> {
    const newProduct: SelectPartnerProduct = {
      id: `pp-${Date.now()}`,
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.partnerProducts.push(newProduct);
    console.log(`📦 New partner product created: ${newProduct.name} for partner ${newProduct.partnerId}`);
    return newProduct;
  }

  async updatePartnerProduct(id: string, updates: Partial<InsertPartnerProduct>): Promise<SelectPartnerProduct> {
    const index = this.partnerProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      this.partnerProducts[index] = { 
        ...this.partnerProducts[index], 
        ...updates, 
        updatedAt: new Date() 
      };
      console.log(`📦 Partner product updated: ${id}`);
      return this.partnerProducts[index];
    }
    throw new Error('Partner product not found');
  }

  async deletePartnerProduct(id: string): Promise<boolean> {
    const index = this.partnerProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      this.partnerProducts.splice(index, 1);
      console.log(`📦 Partner product deleted: ${id}`);
      return true;
    }
    return false;
  }

  async getPartnerProductsByCategory(partnerId: string, category: string): Promise<SelectPartnerProduct[]> {
    return this.partnerProducts.filter(p => 
      p.partnerId === partnerId && p.category === category
    );
  }

  // Security System operations are initialized in constructor

  async getSecureAdminByCredentials(username: string, email: string): Promise<any | undefined> {
    return this.secureAdmins.find(admin => 
      admin.username === username && admin.email === email
    );
  }

  async getSecureDriverByCredentials(username: string, email: string, driverCode?: string): Promise<any | undefined> {
    return this.secureDrivers.find(driver => 
      driver.username === username && 
      driver.email === email && 
      (!driverCode || driver.driverCode === driverCode)
    );
  }

  async createSecureAdmin(adminData: any): Promise<any> {
    const newAdmin = {
      id: `admin-${Date.now()}`,
      ...adminData,
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: null,
      mustChangePassword: false,
      sessionTimeout: 900, // 15 minutes
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.secureAdmins.push(newAdmin);
    console.log(`🔐 New secure admin created: ${newAdmin.username}`);
    return newAdmin;
  }

  async createSecureDriver(driverData: any): Promise<any> {
    const newDriver = {
      id: `driver-${Date.now()}`,
      ...driverData,
      isActive: true,
      status: 'offline',
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: null,
      totalDeliveries: 0,
      rating: 5.00,
      ratingCount: 0,
      sessionTimeout: 900, // 15 minutes
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.secureDrivers.push(newDriver);
    console.log(`🚚 New secure driver created: ${newDriver.username}`);
    return newDriver;
  }

  async updateSecureAdmin(id: string, updates: any): Promise<any> {
    const index = this.secureAdmins.findIndex(admin => admin.id === id);
    if (index !== -1) {
      this.secureAdmins[index] = {
        ...this.secureAdmins[index],
        ...updates,
        updatedAt: new Date()
      };
      console.log(`🔐 Secure admin updated: ${id}`);
      return this.secureAdmins[index];
    }
    throw new Error('Secure admin not found');
  }

  async updateSecureDriver(id: string, updates: any): Promise<any> {
    const index = this.secureDrivers.findIndex(driver => driver.id === id);
    if (index !== -1) {
      this.secureDrivers[index] = {
        ...this.secureDrivers[index],
        ...updates,
        updatedAt: new Date()
      };
      console.log(`🚚 Secure driver updated: ${id}`);
      return this.secureDrivers[index];
    }
    throw new Error('Secure driver not found');
  }

  async getAllSecureAdmins(): Promise<any[]> {
    return [...this.secureAdmins];
  }

  async getAllSecureDrivers(): Promise<any[]> {
    return [...this.secureDrivers];
  }

  async createSecurityLog(logData: any): Promise<any> {
    const newLog = {
      id: `log-${Date.now()}`,
      ...logData,
      createdAt: new Date()
    };
    this.securityLogs.push(newLog);
    
    // Keep only last 1000 logs to prevent memory overflow
    if (this.securityLogs.length > 1000) {
      this.securityLogs = this.securityLogs.slice(-1000);
    }
    
    return newLog;
  }

  async getSecurityLogs(options: any): Promise<any[]> {
    let logs = [...this.securityLogs];
    
    // Filter by user type if specified
    if (options.userType) {
      logs = logs.filter(log => log.userType === options.userType);
    }
    
    // Filter by action if specified
    if (options.action) {
      logs = logs.filter(log => log.action === options.action);
    }
    
    // Sort by date (newest first)
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Limit results
    const limit = options.limit || 100;
    return logs.slice(0, limit);
  }
}

// Use MemStorage temporarily due to database connection issues
// Will switch to DatabaseStorage when database is ready
// تبديل إلى Memory Storage مؤقتاً
export const storage = new MemoryStorage();