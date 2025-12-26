/**
 * PostgreSQL Storage Implementation
 * اطبعلي - Database Storage Layer using Supabase
 */

import type { IStorage, User, Product, Order, CartItem } from '../storage';
import { ProductRepository } from './ProductRepository';
import { UserRepository } from './UserRepository';
import { OrderRepository } from './OrderRepository';
import { CartRepository } from './CartRepository';
import { testConnection } from './client';

export class PostgresStorage implements IStorage {
    private productRepo = new ProductRepository();
    private userRepo = new UserRepository();
    private orderRepo = new OrderRepository();
    private cartRepo = new CartRepository();
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

    async deleteUser(id: string): Promise<void> {
        await this.userRepo.delete(id);
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

    async deleteOrder(id: string): Promise<void> {
        await this.orderRepo.delete(id);
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

    async clearCart(userId: string): Promise<void> {
        await this.cartRepo.clearCart(userId);
    }

    // ============================================
    // PLACEHOLDER METHODS (to be implemented)
    // ============================================

    async getAllPartners(): Promise<any[]> {
        // TODO: Implement partner repository
        return [];
    }

    async getPartner(id: string): Promise<any | undefined> {
        // TODO: Implement
        return undefined;
    }

    async createPartner(partner: any): Promise<any> {
        // TODO: Implement
        throw new Error('Not implemented');
    }

    async updatePartner(id: string, updates: any): Promise<any | undefined> {
        // TODO: Implement
        return undefined;
    }

    async deletePartner(id: string): Promise<void> {
        // TODO: Implement
    }

    async getAllDrivers(): Promise<any[]> {
        // TODO: Implement driver repository
        return [];
    }

    async getDriver(id: string): Promise<any | undefined> {
        // TODO: Implement
        return undefined;
    }

    async createDriver(driver: any): Promise<any> {
        // TODO: Implement
        throw new Error('Not implemented');
    }

    async updateDriver(id: string, updates: any): Promise<any | undefined> {
        // TODO: Implement
        return undefined;
    }

    async deleteDriver(id: string): Promise<void> {
        // TODO: Implement
    }

    async getAllNotifications(userId?: string): Promise<any[]> {
        // TODO: Implement notification repository
        return [];
    }

    async createNotification(notification: any): Promise<any> {
        // TODO: Implement
        throw new Error('Not implemented');
    }

    async markNotificationAsRead(id: string): Promise<void> {
        // TODO: Implement
    }

    async deleteNotification(id: string): Promise<void> {
        // TODO: Implement
    }

    async getAllAnnouncements(): Promise<any[]> {
        // TODO: Implement announcement repository
        return [];
    }

    async getActiveAnnouncements(): Promise<any[]> {
        // TODO: Implement
        return [];
    }

    async createAnnouncement(announcement: any): Promise<any> {
        // TODO: Implement
        throw new Error('Not implemented');
    }

    async updateAnnouncement(id: string, updates: any): Promise<any | undefined> {
        // TODO: Implement
        return undefined;
    }

    async deleteAnnouncement(id: string): Promise<void> {
        // TODO: Implement
    }
}

// Export singleton instance
export const postgresStorage = new PostgresStorage();
