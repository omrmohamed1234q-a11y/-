import { supabase } from "../client/src/lib/supabase";
import type { 
  User, 
  InsertUser, 
  Product, 
  InsertProduct, 
  PrintJob, 
  InsertPrintJob,
  Order,
  InsertOrder,
  CartItem,
  InsertCartItem,
  Reward,
  Challenge,
  UserChallenge
} from "@shared/schema";

// Since we're using Supabase as our primary database, this storage interface
// serves as a wrapper around Supabase operations. Most operations will be
// performed directly from the frontend, but these methods can be used for
// server-side operations when needed.

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  upsertUser(user: { id: string; email?: string; firstName?: string; lastName?: string; profileImageUrl?: string }): Promise<User>;

  // Product operations
  getProducts(filters?: {
    category?: string;
    search?: string;
    featured?: boolean;
  }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Print job operations
  getPrintJobs(userId: string): Promise<PrintJob[]>;
  createPrintJob(printJob: InsertPrintJob): Promise<PrintJob>;
  updatePrintJob(id: string, updates: Partial<PrintJob>): Promise<PrintJob>;

  // Order operations
  getUserOrders(userId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order>;

  // Cart operations
  getCartItems(userId: string): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;

  // Reward operations
  getAvailableRewards(): Promise<Reward[]>;
  getUserChallenges(userId: string): Promise<UserChallenge[]>;
  updateChallengeProgress(userId: string, challengeId: string, progress: number): Promise<void>;
}

export class SupabaseStorage implements IStorage {
  
  async getUser(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return null;
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create user: ${error?.message}`);
    }

    return data as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update user: ${error?.message}`);
    }

    return data as User;
  }

  async upsertUser(userData: { id: string; email?: string; firstName?: string; lastName?: string; profileImageUrl?: string }): Promise<User> {
    // Map Replit Auth data to our user schema
    const userRecord = {
      id: userData.id,
      email: userData.email || '',
      username: userData.email?.split('@')[0] || `user_${userData.id}`,
      full_name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email?.split('@')[0] || 'مستخدم',
      first_name: userData.firstName || null,
      last_name: userData.lastName || null,
      profile_image_url: userData.profileImageUrl || null,
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(userRecord, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to upsert user: ${error?.message}`);
    }

    return data as User;
  }

  async getProducts(filters?: {
    category?: string;
    search?: string;
    featured?: boolean;
  }): Promise<Product[]> {
    let query = supabase.from('products').select('*');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.featured) {
      query = query.eq('featured', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data as Product[];
  }

  async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create product: ${error?.message}`);
    }

    return data as Product;
  }

  async getPrintJobs(userId: string): Promise<PrintJob[]> {
    const { data, error } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch print jobs: ${error.message}`);
    }

    return data as PrintJob[];
  }

  async createPrintJob(printJob: InsertPrintJob): Promise<PrintJob> {
    const { data, error } = await supabase
      .from('print_jobs')
      .insert([printJob])
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create print job: ${error?.message}`);
    }

    return data as PrintJob;
  }

  async updatePrintJob(id: string, updates: Partial<PrintJob>): Promise<PrintJob> {
    const { data, error } = await supabase
      .from('print_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update print job: ${error?.message}`);
    }

    return data as PrintJob;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data as Order[];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create order: ${error?.message}`);
    }

    return data as Order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update order: ${error?.message}`);
    }

    return data as Order;
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch cart items: ${error.message}`);
    }

    return data as CartItem[];
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', cartItem.user_id)
      .eq('product_id', cartItem.product_id)
      .single();

    if (existing) {
      // Update quantity if item exists
      return this.updateCartItem(existing.id, existing.quantity + (cartItem.quantity || 1));
    }

    const { data, error } = await supabase
      .from('cart_items')
      .insert([cartItem])
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to add to cart: ${error?.message}`);
    }

    return data as CartItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem> {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update cart item: ${error?.message}`);
    }

    return data as CartItem;
  }

  async removeFromCart(id: string): Promise<void> {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to remove from cart: ${error.message}`);
    }
  }

  async getAvailableRewards(): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('available', true)
      .order('points_cost');

    if (error) {
      throw new Error(`Failed to fetch rewards: ${error.message}`);
    }

    return data as Reward[];
  }

  async getUserChallenges(userId: string): Promise<UserChallenge[]> {
    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenges (*)
      `)
      .eq('user_id', userId)
      .eq('date::date', new Date().toISOString().split('T')[0]);

    if (error) {
      throw new Error(`Failed to fetch user challenges: ${error.message}`);
    }

    return data as UserChallenge[];
  }

  async updateChallengeProgress(userId: string, challengeId: string, progress: number): Promise<void> {
    const { error } = await supabase
      .from('user_challenges')
      .upsert({
        user_id: userId,
        challenge_id: challengeId,
        current_progress: progress,
        completed: progress >= 100,
        completed_at: progress >= 100 ? new Date().toISOString() : null,
        date: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to update challenge progress: ${error.message}`);
    }
  }
}

export const storage = new SupabaseStorage();
