/**
 * PostgreSQL Storage Implementation
 * اطبعلي - Database Storage Layer using Supabase
 */

import type { IStorage, User, Product, Order, CartItem } from '../storage';
import { ProductRepository } from './ProductRepository';
import { UserRepository } from './UserRepository';
import { OrderRepository } from './OrderRepository';
import { CartRepository } from './CartRepository';
import { PendingUploadsRepository } from './PendingUploadsRepository';
import { testConnection } from './client';

export class PostgresStorage implements IStorage {
    private productRepo = new ProductRepository();
    private userRepo = new UserRepository();
    private orderRepo = new OrderRepository();
    private cartRepo = new CartRepository();
    private pendingUploadsRepo = new PendingUploadsRepository();
    private initialized = false;

    async initialize(): Promise<void> {
        if (this.initialized) return;

        console.log('🔌 Initializing PostgreSQL storage...');
        const connected = await testConnection();

        if (!connected) {
            throw new Error('Failed to connect to Supabase');
        }

        this.initialized = true;
        console.log('✅ PostgreSQL storage initialized');
    }

    // ============================================
    // PRODUCT METHODS
    // ============================================

    async getAllProducts(): Promise<Product[]> {
        return this.productRepo.findAll();
    }

    async getProduct(id: string): Promise<Product | undefined> {
        const product = await this.productRepo.findById(id);
        return product || undefined;
    }

    async createProduct(product: Partial<Product>): Promise<Product> {
        return this.productRepo.create(product);
    }

    async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
        try {
            return await this.productRepo.update(id, updates);
        } catch (error) {
            return undefined;
        }
    }

    async deleteProduct(id: string): Promise<void> {
        await this.productRepo.delete(id);
    }

    async getProductsByCategory(category: string): Promise<Product[]> {
        return this.productRepo.findByCategory(category);
    }

    async searchProducts(query: string): Promise<Product[]> {
        return this.productRepo.search(query);
    }

    // ============================================
    // USER METHODS
    // ============================================

    async getAllUsers(): Promise<User[]> {
        return this.userRepo.findAll();
    }

    async getUser(id: string): Promise<User | undefined> {
        const user = await this.userRepo.findById(id);
        return user || undefined;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        const user = await this.userRepo.findByEmail(email);
        return user || undefined;
    }

    async createUser(user: Partial<User>): Promise<User> {
        return this.userRepo.create(user);
    }

    async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
        try {
            return await this.userRepo.update(id, updates);
        } catch (error) {
            return undefined;
        }
    }

    async deleteUser(id: string): Promise<boolean> {
        await this.userRepo.delete(id);
        return true;
    }

    // ============================================
    // ORDER METHODS
    // ============================================

    async getAllOrders(): Promise<Order[]> {
        return this.orderRepo.findAll();
    }

    async getOrder(id: string): Promise<Order | undefined> {
        const order = await this.orderRepo.findById(id);
        return order || undefined;
    }

    async getOrdersByUserId(userId: string): Promise<Order[]> {
        return this.orderRepo.findByUserId(userId);
    }

    async getOrdersByStatus(status: string): Promise<Order[]> {
        return this.orderRepo.findByStatus(status);
    }

    async createOrder(order: Partial<Order>, items?: any[]): Promise<Order> {
        return this.orderRepo.create(order, items || []);
    }

    async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
        try {
            return await this.orderRepo.update(id, updates);
        } catch (error) {
            return undefined;
        }
    }

    async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
        try {
            return await this.orderRepo.updateStatus(id, status);
        } catch (error) {
            return undefined;
        }
    }

    async deleteOrder(id: string): Promise<boolean> {
        await this.orderRepo.delete(id);
        return true;
    }

    // ============================================
    // CART METHODS
    // ============================================

    async getCartItems(userId: string): Promise<CartItem[]> {
        return this.cartRepo.findByUserId(userId);
    }

    async addToCart(item: Partial<CartItem>): Promise<CartItem> {
        return this.cartRepo.addItem(item);
    }

    async updateCartItemQuantity(id: string, quantity: number): Promise<CartItem | undefined> {
        try {
            return await this.cartRepo.updateQuantity(id, quantity);
        } catch (error) {
            return undefined;
        }
    }

    async removeFromCart(id: string): Promise<void> {
        await this.cartRepo.removeItem(id);
    }

    async clearCart(userId: string): Promise<boolean> {
        await this.cartRepo.clearCart(userId);
        return true;
    }

    // ============================================
    // PENDING UPLOADS (Print Service)
    // ============================================

    async getPendingUploads(userId: string): Promise<any[]> {
        return this.pendingUploadsRepo.findByUserId(userId);
    }

    async addPendingUpload(upload: any): Promise<any> {
        return this.pendingUploadsRepo.create(upload);
    }

    async updatePendingUpload(id: string, updates: any): Promise<any> {
        return this.pendingUploadsRepo.update(id, updates);
    }

    async deletePendingUpload(id: string): Promise<boolean> {
        await this.pendingUploadsRepo.delete(id);
        return true;
    }

    async clearPendingUploads(userId: string): Promise<boolean> {
        await this.pendingUploadsRepo.deleteByUserId(userId);
        return true;
    }

    async deletePartner(id: string): Promise<boolean> {
        return true;
    }

    // ============================================
    // NOTIFICATION METHODS (Stubs - return safe defaults)
    // ============================================

    async getAllNotifications(userId?: string): Promise<any[]> {
        return [];
    }

    async getUserNotifications(userId: string): Promise<any[]> {
        return [];
    }

    async getUserUnreadNotificationsCount(userId: string): Promise<number> {
        return 0;
    }

    async getNotification(id: string): Promise<any | undefined> {
        return undefined;
    }

    async createNotification(notification: any): Promise<any> {
        return { id: 'stub-' + Date.now(), ...notification };
    }

    async updateNotification(id: string, updates: any): Promise<any> {
        return { id, ...updates };
    }

    async markNotificationAsRead(id: string): Promise<any> {
        return { id, read: true };
    }

    async markNotificationAsClicked(id: string): Promise<any> {
        return { id, clicked: true };
    }

    async deleteNotification(id: string): Promise<boolean> {
        return true;
    }

    async getUserNotificationPreferences(userId: string): Promise<any | undefined> {
        return undefined;
    }

    async updateUserNotificationPreferences(userId: string, preferences: any): Promise<any> {
        return preferences;
    }

    async createUserNotificationPreferences(preferences: any): Promise<any> {
        return preferences;
    }

    // ============================================
    // DRIVER METHODS (Stubs)
    // ============================================

    async getAllDrivers(): Promise<any[]> {
        return [];
    }

    async getDriver(id: string): Promise<any | undefined> {
        return undefined;
    }

    async getDriverByEmail(email: string): Promise<any | undefined> {
        return undefined;
    }

    async getDriverByUsername(username: string): Promise<any | undefined> {
        return undefined;
    }

    async createDriver(driver: any): Promise<any> {
        return { id: 'stub-' + Date.now(), ...driver };
    }

    async updateDriver(id: string, updates: any): Promise<any | undefined> {
        return { id, ...updates };
    }

    async updateDriverStatus(id: string, status: string): Promise<any> {
        return { id, status };
    }

    async updateDriverLocation(id: string, location: any): Promise<void> {
        // Stub - no-op
    }

    async updateDriverLastActive(id: string): Promise<void> {
        // Stub - no-op
    }

    async authenticateDriver(identifier: string, password: string): Promise<any> {
        return undefined;
    }

    async getAvailableDrivers(): Promise<any[]> {
        return [];
    }

    async getAvailableOrdersForDriver(driverId: string): Promise<any[]> {
        return [];
    }

    async assignOrderToDriver(orderId: string, driverId: string): Promise<any> {
        return this.updateOrder(orderId, { driverId });
    }

    async getDriverOrders(driverId: string): Promise<any[]> {
        return [];
    }

    async deleteDriver(id: string): Promise<boolean> {
        return true;
    }

    // ============================================
    // PARTNER METHODS (Stubs)
    // ============================================

    async getAllPartners(): Promise<any[]> {
        return [];
    }

    async getFeaturedPartners(): Promise<any[]> {
        return [];
    }

    async getPartner(id: string): Promise<any | undefined> {
        return undefined;
    }

    async getPartnerById(id: string): Promise<any | undefined> {
        return undefined;
    }

    async createPartner(partner: any): Promise<any> {
        return { id: 'stub-' + Date.now(), ...partner };
    }

    async updatePartner(id: string, updates: any): Promise<any | undefined> {
        return { id, ...updates };
    }

    async deletePartner(id: string): Promise<boolean> {
        return true;
    }

    async getPartnerProducts(partnerId: string): Promise<any[]> {
        return [];
    }

    async getAllPartnerProducts(): Promise<any[]> {
        return [];
    }

    async createPartnerProduct(product: any): Promise<any> {
        return { id: 'stub-' + Date.now(), ...product };
    }

    async updatePartnerProduct(id: string, updates: any): Promise<any> {
        return { id, ...updates };
    }

    async deletePartnerProduct(id: string): Promise<boolean> {
        return true;
    }

    async getPartnerProductsByCategory(partnerId: string, category: string): Promise<any[]> {
        return [];
    }

    // ============================================
    // ANNOUNCEMENT METHODS (Stubs)
    // ============================================

    async getAllAnnouncements(): Promise<any[]> {
        return [];
    }

    async getActiveAnnouncements(): Promise<any[]> {
        return [];
    }

    async getHomepageAnnouncements(): Promise<any[]> {
        return [];
    }

    async getAnnouncement(id: string): Promise<any | undefined> {
        return undefined;
    }

    async createAnnouncement(announcement: any): Promise<any> {
        return { id: 'stub-' + Date.now(), ...announcement };
    }

    async updateAnnouncement(id: string, updates: any): Promise<any | undefined> {
        return { id, ...updates };
    }

    async deleteAnnouncement(id: string): Promise<boolean> {
        return true;
    }

    // ============================================
    // ADDITIONAL USER METHODS (Stubs)
    // ============================================

    async getUserById(id: string): Promise<any | undefined> {
        return this.getUser(id);
    }

    async upsertUser(user: any): Promise<any> {
        if (user.email) {
            const existing = await this.getUserByEmail(user.email);
            if (existing) {
                return this.updateUser(existing.id, user);
            }
        }
        return this.createUser(user);
    }

    // ============================================
    // ADDITIONAL ORDER METHODS (Stubs)
    // ============================================

    async updateOrderRating(id: string, rating: number, review?: string): Promise<any> {
        return this.updateOrder(id, { rating, review });
    }

    async cancelOrder(id: string): Promise<any> {
        return this.updateOrderStatus(id, 'cancelled');
    }

    async addDriverNote(id: string, note: string): Promise<any> {
        const order = await this.getOrder(id);
        if (!order) return undefined;
        return this.updateOrder(id, { driverNotes: note });
    }

    async addOrderTimelineEvent(orderId: string, event: any): Promise<void> {
        // Stub - no-op for now
    }

    async getActiveOrders(): Promise<any[]> {
        return this.getOrdersByStatus('pending');
    }

    async getOrdersByCaptain(captainId: string): Promise<any[]> {
        return [];
    }

    // ============================================
    // ADDITIONAL CART METHODS (Stubs)
    // ============================================

    async getCart(userId: string): Promise<any> {
        const items = await this.getCartItems(userId);
        return { items, count: items.length };
    }

    async getCartItemCount(userId: string): Promise<number> {
        const items = await this.getCartItems(userId);
        return items.length;
    }

    async removeCartItem(itemId: string): Promise<boolean> {
        await this.removeFromCart(itemId);
        return true;
    }

    async updateCartItem(itemId: string, quantity: number): Promise<any> {
        return this.updateCartItemQuantity(itemId, quantity);
    }

    // ============================================
    // PENDING UPLOADS ADDITIONAL METHODS (Stubs)
    // ============================================

    async createPendingUpload(upload: any): Promise<any> {
        return this.addPendingUpload(upload);
    }

    async updatePendingUploadSettings(id: string, printSettings: any): Promise<any> {
        return this.updatePendingUpload(id, { printSettings });
    }

    // ============================================
    // PRINT JOB METHODS (Stubs)
    // ============================================

    async getAllPrintJobs(): Promise<any[]> {
        return [];
    }

    async getPrintJobsByUserId(userId: string): Promise<any[]> {
        return [];
    }

    async createPrintJob(printJob: any): Promise<any> {
        return { id: 'stub-' + Date.now(), ...printJob };
    }

    async updatePrintJobStatus(id: string, status: string): Promise<any> {
        return { id, status };
    }

    // ============================================
    // ADMIN STATS (Stub)
    // ============================================

    async getAdminStats(): Promise<any> {
        const products = await this.getAllProducts();
        const users = await this.getAllUsers();
        const orders = await this.getAllOrders();

        return {
            totalProducts: products.length,
            totalUsers: users.length,
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
        };
    }

    // ============================================
    // CART ORDER METHODS (Stubs)
    // ============================================

    async createCartOrder(order: any): Promise<any> {
        return { id: 'stub-' + Date.now(), ...order };
    }

    async getAllCartOrders(): Promise<any[]> {
        return [];
    }

    async getCartOrder(orderId: string): Promise<any | undefined> {
        return undefined;
    }

    async updateCartOrder(orderId: string, updates: any): Promise<any> {
        return { id: orderId, ...updates };
    }

    async getUserCartOrders(userId: string): Promise<any[]> {
        return [];
    }

    // ============================================
    // SMART TARGETING (Stubs - return empty)
    // ============================================

    async getUsersByGradeLevel(gradeLevels: string[]): Promise<any[]> {
        return [];
    }

    async getUsersByRole(roles: string[]): Promise<any[]> {
        return [];
    }

    async getUsersByBehavior(criteria: any): Promise<any[]> {
        return [];
    }

    async getUsersByActivity(daysInactive?: number): Promise<any[]> {
        return [];
    }

    async getActiveTeachers(): Promise<any[]> {
        return [];
    }

    async getHighValueUsers(): Promise<any[]> {
        return [];
    }

    // ============================================
    // TEACHER METHODS (Stubs)
    // ============================================

    async getAllTeachers(): Promise<any[]> {
        return [];
    }

    async createTeacher(teacher: any): Promise<any> {
        return { id: 'stub-' + Date.now(), ...teacher };
    }

    async updateTeacher(id: string, updates: any): Promise<any> {
        return { id, ...updates };
    }

    async deleteTeacher(id: string): Promise<void> {
        // Stub - no-op
    }

    async getAllTeacherPlans(): Promise<any[]> {
        return [];
    }

    async getAllTeacherSubscriptions(): Promise<any[]> {
        return [];
    }
}

// Export singleton instance
export const postgresStorage = new PostgresStorage();
