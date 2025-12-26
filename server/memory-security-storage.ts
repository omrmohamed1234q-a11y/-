import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

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
  currentToken?: string;
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

interface TwoFactorAuth {
  id: string;
  userId: string;
  userType: 'admin' | 'driver';
  secret: string;
  isEnabled: boolean;
  qrCodeUrl?: string;
  backupCodes: string[];
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export class MemorySecurityStorage {
  private users: SecurityUser[] = [];
  private logs: SecurityLog[] = [];
  private twoFactorAuth: TwoFactorAuth[] = [];
  private dataFilePath = path.join(process.cwd(), 'security-data.json');

  constructor() {
    // Load data from local JSON file first, then sync with Supabase
    this.loadDataFromLocalFile();
    this.loadDataFromSupabase().then(() => {
      // Initialize super admin if not exists
      this.initializeSuperAdmin();
    });
  }

  // Encryption utilities for local storage
  private getEncryptionKey(): string {
    return process.env.SECURITY_ENCRYPTION_KEY || 'default-local-key-change-in-production';
  }

  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
      const textParts = encryptedText.split(':');

      if (textParts.length !== 3) {
        return encryptedText;
      }

      const iv = Buffer.from(textParts[0], 'hex');
      const authTag = Buffer.from(textParts[1], 'hex');
      const encrypted = textParts[2];

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('❌ Decryption error:', error);
      return encryptedText;
    }
  }

  // Local JSON File Operations (with encryption)
  private loadDataFromLocalFile() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.dataFilePath, 'utf8'));
        this.users = data.users || [];
        this.logs = data.logs || [];
        this.twoFactorAuth = data.twoFactorAuth || [];
        console.log(`✅ Loaded ${this.users.length} users, ${this.logs.length} logs, and ${this.twoFactorAuth.length} 2FA records from local file`);
      } else {
        console.log('📄 No local security data file found, starting fresh');
      }
    } catch (error) {
      console.log('⚠️ Error loading local security data:', error.message);
    }
  }

  private saveDataToLocalFile() {
    try {
      const data = {
        users: this.users,
        logs: this.logs,
        twoFactorAuth: this.twoFactorAuth,
        lastSaved: new Date().toISOString()
      };

      // Encrypt sensitive data before saving
      const jsonData = JSON.stringify(data, null, 2);
      const encryptedData = this.encrypt(jsonData);

      fs.writeFileSync(this.dataFilePath, encryptedData);
      console.log(`💾 Security data encrypted and saved locally (${this.users.length} users, ${this.logs.length} logs)`);
    } catch (error) {
      console.log('⚠️ Error saving security data locally:', error.message);
    }
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

      // Save to local file immediately
      this.saveDataToLocalFile();

      // Sync to Supabase (best effort)
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

  async getUserByUsernameOrEmail(username: string, email: string): Promise<SecurityUser | undefined> {
    return this.users.find(user =>
      user.username === username || user.email === email
    );
  }

  async getSecurityUserByToken(token: string): Promise<SecurityUser | undefined> {
    return this.users.find(user => user.currentToken === token);
  }

  async getSecurityUserById(id: string): Promise<SecurityUser | undefined> {
    return this.users.find(user => user.id === id);
  }

  async updateSecurityUserStatus(id: string, isActive: boolean): Promise<SecurityUser | undefined> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return undefined;

    this.users[userIndex].is_active = isActive;
    this.users[userIndex].updated_at = new Date().toISOString();

    // Save to local file
    this.saveDataToLocalFile();

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

      // Save to local file
      this.saveDataToLocalFile();

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

      // Save to local file
      this.saveDataToLocalFile();

      // Sync to Supabase (best effort)
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

    // Save to local file immediately
    this.saveDataToLocalFile();

    // Sync to Supabase (best effort)
    await this.syncLogToSupabase(log);

    // Keep only last 1000 logs to prevent memory overflow
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
      this.saveDataToLocalFile(); // Save again after trimming
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

  // Update user token
  async updateSecurityUserToken(id: string, token: string): Promise<void> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      this.users[userIndex].currentToken = token;
      this.users[userIndex].last_login = new Date().toISOString();
      this.saveDataToLocalFile();
      await this.syncUserToSupabase(this.users[userIndex]);
    }
  }

  // Additional CRUD operations
  async getUserById(id: string): Promise<SecurityUser | null> {
    try {
      const user = this.users.find(u => u.id === id);
      return user || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async updateUser(id: string, updateData: any): Promise<SecurityUser | null> {
    try {
      const userIndex = this.users.findIndex(u => u.id === id);
      if (userIndex === -1) {
        return null;
      }

      // Update user data
      this.users[userIndex] = { ...this.users[userIndex], ...updateData };

      // Save to local file
      this.saveDataToLocalFile();

      // Sync to Supabase
      await this.syncUserToSupabase(this.users[userIndex]);

      console.log(`✅ Updated user: ${this.users[userIndex].username}`);
      return this.users[userIndex];
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const userIndex = this.users.findIndex(u => u.id === id);
      if (userIndex === -1) {
        return false;
      }

      const user = this.users[userIndex];

      // Remove from memory
      this.users.splice(userIndex, 1);

      // Save to local file
      this.saveDataToLocalFile();

      // Remove from Supabase
      await this.deleteUserFromSupabase(user);

      console.log(`🗑️ Deleted user: ${user.username}`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  private async deleteUserFromSupabase(user: SecurityUser) {
    try {
      const tableName = user.role === 'admin' ? 'secure_admins' : 'secure_drivers';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', user.id);

      if (error) {
        console.log(`⚠️ Failed to delete ${user.username} from Supabase:`, error.message);
      } else {
        console.log(`✅ Deleted ${user.username} from Supabase`);
      }
    } catch (error) {
      console.log('⚠️ Supabase delete failed:', error.message);
    }
  }
  // Initialize super admin with delete permissions
  private async initializeSuperAdmin() {
    // Check if super admin already exists
    const superAdmin = this.users.find(user => user.username === 'superadmin');
    if (superAdmin) {
      console.log('🔐 Super admin already exists, skipping initialization');
      return;
    }

    console.log('🔐 Creating super admin account...');

    const adminAccount = {
      id: uuidv4(),
      username: 'superadmin',
      email: 'superadmin@atbaali.com',
      password_hash: await bcrypt.hash('SuperAdmin2025!', 10),
      full_name: 'مدير النظام الرئيسي',
      role: 'admin' as const,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null
    };

    // Add super admin to memory
    this.users.push(adminAccount);

    // Create a log for super admin creation
    await this.createSecurityLog({
      user_id: adminAccount.id,
      action: 'إنشاء حساب المدير الرئيسي',
      ip_address: '127.0.0.1',
      user_agent: 'System/Auto-Generated',
      success: true,
      timestamp: new Date()
    });

    // Create single test driver
    console.log('🚚 Creating test driver account...');

    const testDriver = {
      id: uuidv4(),
      username: 'captain',
      email: 'captain@atbaali.com',
      password_hash: await bcrypt.hash('123456', 10),
      full_name: 'كابتن التوصيل الرئيسي',
      role: 'driver' as const,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      driver_code: 'CAP001',
      vehicle_type: 'دراجة نارية',
      working_area: 'جميع المناطق',
      last_login: null
    };

    this.users.push(testDriver);

    // Create a log for test driver creation
    await this.createSecurityLog({
      user_id: testDriver.id,
      action: 'إنشاء حساب سائق تجريبي',
      ip_address: '127.0.0.1',
      user_agent: 'System/Auto-Generated',
      success: true,
      timestamp: new Date()
    });

    // Save the updated data
    this.saveDataToLocalFile();
    console.log('🔐 Super admin created successfully');
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Super admin and test driver created successfully (credentials available in secure storage)');
    }
  }

  // ==================== TWO-FACTOR AUTHENTICATION METHODS ====================

  // Create 2FA record
  async createTwoFactorAuth(twoFAData: TwoFactorAuth): Promise<TwoFactorAuth> {
    // Remove existing record for this user if exists
    this.twoFactorAuth = this.twoFactorAuth.filter(
      record => !(record.userId === twoFAData.userId && record.userType === twoFAData.userType)
    );

    this.twoFactorAuth.push(twoFAData);
    this.saveDataToLocalFile();
    return twoFAData;
  }

  // Get 2FA record
  async getTwoFactorAuth(userId: string, userType: 'admin' | 'driver'): Promise<TwoFactorAuth | undefined> {
    return this.twoFactorAuth.find(
      record => record.userId === userId && record.userType === userType
    );
  }

  // Enable 2FA with backup codes
  async enableTwoFactorAuth(userId: string, userType: 'admin' | 'driver', backupCodes: string[]): Promise<void> {
    const record = await this.getTwoFactorAuth(userId, userType);
    if (record) {
      record.isEnabled = true;
      record.backupCodes = backupCodes;
      record.updatedAt = new Date().toISOString();
      this.saveDataToLocalFile();
    }
  }

  // Disable 2FA
  async disableTwoFactorAuth(userId: string, userType: 'admin' | 'driver'): Promise<void> {
    this.twoFactorAuth = this.twoFactorAuth.filter(
      record => !(record.userId === userId && record.userType === userType)
    );
    this.saveDataToLocalFile();
  }

  // Update last used timestamp
  async updateTwoFactorAuthLastUsed(userId: string, userType: 'admin' | 'driver'): Promise<void> {
    const record = await this.getTwoFactorAuth(userId, userType);
    if (record) {
      record.lastUsed = new Date().toISOString();
      record.updatedAt = new Date().toISOString();
      this.saveDataToLocalFile();
    }
  }

  // Use backup code (removes it from available codes)
  async useBackupCode(userId: string, userType: 'admin' | 'driver', code: string): Promise<void> {
    const record = await this.getTwoFactorAuth(userId, userType);
    if (record && record.backupCodes) {
      record.backupCodes = record.backupCodes.filter(backupCode => backupCode !== code);
      record.lastUsed = new Date().toISOString();
      record.updatedAt = new Date().toISOString();
      this.saveDataToLocalFile();
    }
  }

  // Get all 2FA records (admin only)
  async getAllTwoFactorAuth(): Promise<TwoFactorAuth[]> {
    return this.twoFactorAuth.map(record => ({
      ...record,
      secret: '***HIDDEN***', // Never expose secrets in list view
      backupCodes: []
    }));
  }

  // ==================== TOKEN VERIFICATION METHODS ====================

  // Verify admin token - Missing method that's causing 401 errors
  async verifyAdminToken(token: string): Promise<SecurityUser | null> {
    try {
      console.log(`🔍 Verifying admin token: ${token.substring(0, 8)}...`);

      // Find user with matching token
      const user = this.users.find(u =>
        u.role === 'admin' &&
        u.is_active === true &&
        u.currentToken === token
      );

      if (user) {
        console.log(`✅ Valid admin token for: ${user.username}`);
        return user;
      } else {
        console.log(`❌ Invalid or expired admin token`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error verifying admin token:', error);
      return null;
    }
  }

  // Get admin by email (for Supabase JWT verification)
  async getAdminByEmail(email: string): Promise<SecurityUser | null> {
    try {
      const user = this.users.find(u =>
        u.role === 'admin' &&
        u.is_active === true &&
        u.email === email
      );
      return user || null;
    } catch (error) {
      console.error('❌ Error getting admin by email:', error);
      return null;
    }
  }

  // Get secure admin by credentials (for login)
  async getSecureAdminByCredentials(username: string, email: string): Promise<SecurityUser | null> {
    try {
      const user = this.users.find(u =>
        u.role === 'admin' &&
        u.is_active === true &&
        (u.username === username || u.email === email)
      );
      return user || null;
    } catch (error) {
      console.error('❌ Error getting admin by credentials:', error);
      return null;
    }
  }

  // Get secure captain by credentials (for driver login)
  async getSecureCaptainByCredentials(username: string, email: string): Promise<SecurityUser | null> {
    try {
      const user = this.users.find(u =>
        u.role === 'driver' &&
        u.is_active === true &&
        (u.username === username || u.email === email)
      );
      return user || null;
    } catch (error) {
      console.error('❌ Error getting captain by credentials:', error);
      return null;
    }
  }

  // Get user by username or email (for conflict checking)
  async getUserByUsernameOrEmail(username: string, email: string): Promise<SecurityUser | null> {
    try {
      const user = this.users.find(u =>
        u.username === username || u.email === email
      );
      return user || null;
    } catch (error) {
      console.error('❌ Error getting user by username or email:', error);
      return null;
    }
  }
}

// Export singleton instance
export const memorySecurityStorage = new MemorySecurityStorage();