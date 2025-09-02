import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SecurityUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'driver';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  driver_code?: string;
  vehicle_type?: string;
  working_area?: string;
  last_login?: string;
}

interface SecurityLog {
  id: string;
  user_id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  timestamp: string;
  details?: string;
}

export class MemorySecurityStorage {
  private users: SecurityUser[] = [];
  private logs: SecurityLog[] = [];

  constructor() {
    // Load data from Supabase only - no test accounts
    this.loadDataFromSupabase();
  }

  // Supabase Synchronization
  private async loadDataFromSupabase() {
    try {
      // Load users from Supabase
      const { data: users, error: usersError } = await supabase
        .from('secure_admins')
        .select('*');
      
      if (usersError) {
        console.log('⚠️ Could not load users from Supabase (this is normal on first run)');
        return;
      }

      // Load drivers from Supabase
      const { data: drivers, error: driversError } = await supabase
        .from('secure_drivers')
        .select('*');
      
      if (driversError) {
        console.log('⚠️ Could not load drivers from Supabase (this is normal on first run)');
        return;
      }

      // Merge data from Supabase into memory, avoiding duplicates
      const supabaseUsers = [...(users || []), ...(drivers || [])];
      
      // Create a map to track unique usernames and keep only the latest version
      const uniqueUsers = new Map<string, any>();
      
      for (const dbUser of supabaseUsers) {
        // Skip test accounts
        if (dbUser.username === 'testadmin' || dbUser.username === 'testdriver') {
          console.log(`🗑️ Skipping test account: ${dbUser.username}`);
          continue;
        }
        
        // Keep only the latest version of each user (by created_at)
        const existing = uniqueUsers.get(dbUser.username);
        if (!existing || new Date(dbUser.created_at) > new Date(existing.created_at)) {
          uniqueUsers.set(dbUser.username, dbUser);
        }
      }
      
      // Add unique users to memory
      for (const dbUser of uniqueUsers.values()) {
        const memoryUser: SecurityUser = {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          password_hash: dbUser.password_hash,
          full_name: dbUser.full_name,
          role: dbUser.role,
          is_active: dbUser.is_active,
          created_at: dbUser.created_at,
          updated_at: dbUser.updated_at,
          driver_code: dbUser.driver_code,
          vehicle_type: dbUser.vehicle_type,
          working_area: dbUser.working_area,
          last_login: dbUser.last_login
        };
        this.users.push(memoryUser);
      }

      console.log(`✅ Loaded ${uniqueUsers.size} unique users from Supabase (filtered out test accounts and duplicates)`);
    } catch (error) {
      console.log('⚠️ Supabase sync failed (using memory-only mode):', error.message);
    }
  }

  private async syncUserToSupabase(user: SecurityUser) {
    try {
      const tableName = user.role === 'admin' ? 'secure_admins' : 'secure_drivers';
      
      const { error } = await supabase
        .from(tableName)
        .upsert({
          id: user.id,
          username: user.username,
          email: user.email,
          password_hash: user.password_hash,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
          driver_code: user.driver_code,
          vehicle_type: user.vehicle_type,
          working_area: user.working_area,
          last_login: user.last_login
        });

      if (error) {
        console.log(`⚠️ Failed to sync ${user.username} to Supabase:`, error.message);
      } else {
        console.log(`✅ Synced ${user.username} to Supabase`);
      }
    } catch (error) {
      console.log(`⚠️ Supabase sync error for ${user.username}:`, error.message);
    }
  }

  private async syncLogToSupabase(log: SecurityLog) {
    try {
      const { error } = await supabase
        .from('security_logs')
        .insert({
          id: log.id,
          user_id: log.user_id,
          action: log.action,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          success: log.success,
          timestamp: log.timestamp,
          details: log.details
        });

      if (error) {
        console.log('⚠️ Failed to sync log to Supabase:', error.message);
      }
    } catch (error) {
      console.log('⚠️ Supabase log sync error:', error.message);
    }
  }

  // User Management
  async createSecurityUser(userData: any): Promise<SecurityUser> {
    try {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      const newUser: SecurityUser = {
        id: userData.id || uuidv4(),
        username: userData.username,
        email: userData.email,
        password_hash: passwordHash,
        full_name: userData.fullName || userData.full_name,
        role: userData.role,
        is_active: userData.isActive !== undefined ? userData.isActive : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(userData.role === 'driver' && {
          driver_code: userData.driverCode,
          vehicle_type: userData.vehicleType,
          working_area: userData.workingArea
        })
      };

      this.users.push(newUser);
      
      // Sync to Supabase
      await this.syncUserToSupabase(newUser);
      
      // Log the creation
      await this.createSecurityLog({
        user_id: newUser.id,
        action: `تم إنشاء ${userData.role === 'admin' ? 'مدير' : 'سائق'} جديد`,
        ip_address: '127.0.0.1',
        user_agent: 'Security System',
        success: true,
        details: `Username: ${newUser.username}, Email: ${newUser.email}`
      });

      console.log(`✅ Created new ${userData.role}:`, newUser.username);
      console.log(`🔑 Password for ${newUser.username}: ${userData.password}`);
      return newUser;
    } catch (error) {
      console.error('Error creating security user:', error);
      throw new Error('Failed to create user');
    }
  }

  async getAllSecurityUsers(): Promise<any[]> {
    return this.users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      driverCode: user.driver_code,
      vehicleType: user.vehicle_type,
      workingArea: user.working_area
    }));
  }

  async getSecurityUsersByRole(role: 'admin' | 'driver'): Promise<SecurityUser[]> {
    return this.users.filter(user => user.role === role);
  }

  async getSecurityUserByCredentials(username: string, email: string): Promise<SecurityUser | undefined> {
    return this.users.find(user => 
      user.username === username && user.email === email
    );
  }

  async getSecurityUserById(id: string): Promise<SecurityUser | undefined> {
    return this.users.find(user => user.id === id);
  }

  async updateSecurityUserStatus(id: string, isActive: boolean): Promise<SecurityUser | undefined> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return undefined;

    this.users[userIndex].is_active = isActive;
    this.users[userIndex].updated_at = new Date().toISOString();

    // Log the status change
    await this.createSecurityLog({
      user_id: id,
      action: `تم ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم`,
      ip_address: '127.0.0.1',
      user_agent: 'Security System',
      success: true,
      details: `User: ${this.users[userIndex].username}`
    });

    return this.users[userIndex];
  }

  async validateUserCredentials(username: string, email: string, password: string, driverCode?: string): Promise<SecurityUser | null> {
    try {
      let user = this.users.find(u => u.username === username && u.email === email);
      
      // For drivers, also check driver code if provided
      if (driverCode && user?.role === 'driver') {
        if (user.driver_code !== driverCode) {
          user = undefined;
        }
      }

      if (!user || !user.is_active) {
        await this.createSecurityLog({
          user_id: user?.id || 'unknown',
          action: 'محاولة دخول فاشلة',
          ip_address: '127.0.0.1',
          user_agent: 'Login System',
          success: false,
          details: `Username: ${username}, Reason: ${!user ? 'User not found' : 'User inactive'}`
        });
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        await this.createSecurityLog({
          user_id: user.id,
          action: 'محاولة دخول فاشلة',
          ip_address: '127.0.0.1',
          user_agent: 'Login System',
          success: false,
          details: `Username: ${username}, Reason: Invalid password`
        });
        return null;
      }

      // Update last login
      user.last_login = new Date().toISOString();

      await this.createSecurityLog({
        user_id: user.id,
        action: 'تسجيل دخول ناجح',
        ip_address: '127.0.0.1',
        user_agent: 'Login System',
        success: true,
        details: `Username: ${username}, Role: ${user.role}`
      });

      return user;
    } catch (error) {
      console.error('Error validating credentials:', error);
      return null;
    }
  }

  // Password Management
  async resetUserPassword(username: string, newPassword: string): Promise<boolean> {
    try {
      const userIndex = this.users.findIndex(u => u.username === username);
      if (userIndex === -1) return false;
      
      const passwordHash = await bcrypt.hash(newPassword, 10);
      this.users[userIndex].password_hash = passwordHash;
      this.users[userIndex].updated_at = new Date().toISOString();
      
      // Sync to Supabase
      await this.syncUserToSupabase(this.users[userIndex]);
      
      console.log(`🔑 Password reset for ${username}: ${newPassword}`);
      
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<boolean> {
    try {
      const userIndex = this.users.findIndex(u => u.id === userId);
      if (userIndex === -1) return false;
      
      this.users[userIndex].is_active = isActive;
      this.users[userIndex].updated_at = new Date().toISOString();
      
      // Sync to Supabase
      await this.syncUserToSupabase(this.users[userIndex]);
      
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      return false;
    }
  }

  // Security Logs
  async createSecurityLog(logData: Partial<SecurityLog>): Promise<SecurityLog> {
    const log: SecurityLog = {
      id: uuidv4(),
      user_id: logData.user_id || 'system',
      action: logData.action || 'Unknown action',
      ip_address: logData.ip_address || '127.0.0.1',
      user_agent: logData.user_agent || 'Unknown',
      success: logData.success !== undefined ? logData.success : true,
      timestamp: new Date().toISOString(),
      details: logData.details
    };

    this.logs.push(log);
    
    // Sync to Supabase
    await this.syncLogToSupabase(log);

    // Keep only last 1000 logs to prevent memory overflow
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    return log;
  }

  async getAllSecurityLogs(): Promise<SecurityLog[]> {
    return this.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getSecurityLogsByUser(userId: string): Promise<SecurityLog[]> {
    return this.logs
      .filter(log => log.user_id === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Statistics
  async getSecurityStats(): Promise<any> {
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter(u => u.is_active).length;
    const adminCount = this.users.filter(u => u.role === 'admin').length;
    const driverCount = this.users.filter(u => u.role === 'driver').length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = this.logs.filter(log => log.timestamp.startsWith(today));
    
    return {
      totalUsers,
      activeUsers,
      adminCount,
      driverCount,
      todayEvents: todayLogs.length,
      successfulLogins: todayLogs.filter(log => log.action.includes('تسجيل دخول ناجح')).length,
      failedLogins: todayLogs.filter(log => log.action.includes('محاولة دخول فاشلة')).length
    };
  }
}

// Export singleton instance
export const memorySecurityStorage = new MemorySecurityStorage();