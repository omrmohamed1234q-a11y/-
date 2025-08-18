import { users, products, orders, printJobs, type User, type Product, type Order, type PrintJob } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: any): Promise<User>;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  createProduct(product: any): Promise<Product>;
  updateProduct(id: string, updates: any): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Order operations
  getAllOrders(): Promise<Order[]>;
  createOrder(order: any): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  
  // Print Job operations
  getAllPrintJobs(): Promise<PrintJob[]>;
  createPrintJob(printJob: any): Promise<PrintJob>;
  updatePrintJobStatus(id: string, status: string): Promise<PrintJob>;
  
  // Admin statistics
  getAdminStats(): Promise<any>;
  
  // Teacher plan operations  
  getAllTeacherPlans(): Promise<any[]>;
  getAllTeacherSubscriptions(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
}

export const storage = new DatabaseStorage();