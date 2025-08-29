import { users, products, orders, printJobs, cartItems, type User, type Product, type Order, type PrintJob, type CartItem } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

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
  updateOrderStatus(id: string, status: string): Promise<Order>;
  updateOrderRating(id: string, rating: number, review?: string): Promise<Order>;
  cancelOrder(id: string): Promise<Order>;
  addDriverNote(id: string, note: string): Promise<Order>;
  getActiveOrders(): Promise<Order[]>;
  
  // Print Job operations
  getAllPrintJobs(): Promise<PrintJob[]>;
  createPrintJob(printJob: any): Promise<PrintJob>;
  updatePrintJobStatus(id: string, status: string): Promise<PrintJob>;
  
  // Cart operations
  addToCart(cartData: { userId: string; productId: string; quantity: number }): Promise<CartItem>;
  
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
}

// In-memory storage to bypass database connection issues
class MemStorage implements IStorage {
  private users: User[] = [];
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
  private orders: Order[] = [];
  private printJobs: PrintJob[] = [];
  private cartItems: CartItem[] = [];
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
    return [...this.users];
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

  async addToCart(cartData: { userId: string; productId: string; quantity: number }): Promise<CartItem> {
    // Check if product exists
    const product = this.products.find(p => p.id === cartData.productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    const cartItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...cartData,
      createdAt: new Date()
    };
    this.cartItems.push(cartItem);
    return cartItem;
  }

  async getCart(userId: string): Promise<any> {
    const userCartItems = this.cartItems.filter(item => item.userId === userId);
    
    // Filter out items with non-existent products
    const validCartItems = userCartItems.filter(item => {
      const product = this.products.find(p => p.id === item.productId);
      return product !== undefined;
    });
    
    // Remove invalid items from storage
    this.cartItems = this.cartItems.filter(item => 
      item.userId !== userId || this.products.find(p => p.id === item.productId)
    );
    
    const items = validCartItems.map(item => {
      const product = this.products.find(p => p.id === item.productId);
      return {
        ...item,
        product
      };
    });
    
    const subtotal = items.reduce((sum, item) => {
      const price = typeof item.product.price === 'string' ? 
        parseFloat(item.product.price) : item.product.price;
      return sum + (price * item.quantity);
    }, 0);
    
    return {
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: 0,
      total: Math.round(subtotal * 100) / 100
    };
  }

  async clearCart(userId: string): Promise<void> {
    this.cartItems = this.cartItems.filter(item => item.userId !== userId);
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
}

// Use MemStorage instead of DatabaseStorage due to database connection issues
export const storage = new MemStorage();