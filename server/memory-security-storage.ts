import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

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
    // Initialize with default test accounts
    this.initializeDefaultAccounts();
  }

  private async initializeDefaultAccounts() {
    try {
      // Create default admin
      const adminPasswordHash = await bcrypt.hash('testpass123', 10);
      const defaultAdmin: SecurityUser = {
        id: uuidv4(),
        username: 'testadmin',
        email: 'admin@test.com',
        password_hash: adminPasswordHash,
        full_name: 'مدير النظام',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create default driver
      const driverPasswordHash = await bcrypt.hash('driverpass123', 10);
      const defaultDriver: SecurityUser = {
        id: uuidv4(),
        username: 'testdriver',
        email: 'driver@test.com',
        password_hash: driverPasswordHash,
        full_name: 'سائق تجريبي',
        role: 'driver',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        driver_code: 'DR001',
        vehicle_type: 'دراجة نارية',
        working_area: 'القاهرة'
      };

      this.users.push(defaultAdmin, defaultDriver);
      console.log('✅ Default security accounts initialized');
    } catch (error) {
      console.error('Error initializing default accounts:', error);
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