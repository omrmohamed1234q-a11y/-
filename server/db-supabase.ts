import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

// Supabase configuration for security system
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for security system');
}

// Create Supabase client with service role key for admin operations
export const supabaseSecure = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database interface for security operations with Supabase
export class SupabaseSecurityStorage {
  
  async getSecureAdminByCredentials(username: string, email: string): Promise<any | undefined> {
    try {
      const { data, error } = await supabaseSecure
        .from('secure_admins')
        .select('*')
        .eq('username', username)
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error getting secure admin:', error);
        return undefined;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting secure admin by credentials:', error);
      return undefined;
    }
  }

  async getSecureDriverByCredentials(username: string, email: string, driverCode?: string): Promise<any | undefined> {
    try {
      let query = supabaseSecure
        .from('secure_drivers')
        .select('*')
        .eq('username', username)
        .eq('email', email);
      
      if (driverCode) {
        query = query.eq('driver_code', driverCode);
      }
      
      const { data, error } = await query.single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error getting secure driver:', error);
        return undefined;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting secure driver by credentials:', error);
      return undefined;
    }
  }

  async createSecureAdmin(adminData: any): Promise<any> {
    try {
      const { data, error } = await supabaseSecure
        .from('secure_admins')
        .insert({
          ...adminData,
          is_active: true,
          failed_attempts: 0,
          must_change_password: false,
          session_timeout: 900,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating secure admin:', error);
        throw new Error('Failed to create secure admin');
      }
      
      console.log(`🔐 New secure admin created: ${data.username}`);
      return data;
    } catch (error) {
      console.error('Error creating secure admin:', error);
      throw new Error('Failed to create secure admin');
    }
  }

  async createSecureDriver(driverData: any): Promise<any> {
    try {
      const { data, error } = await supabaseSecure
        .from('secure_drivers')
        .insert({
          ...driverData,
          is_active: true,
          status: 'offline',
          failed_attempts: 0,
          total_deliveries: 0,
          rating: 5.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating secure driver:', error);
        throw new Error('Failed to create secure driver');
      }
      
      console.log(`🚚 New secure driver created: ${data.username}`);
      return data;
    } catch (error) {
      console.error('Error creating secure driver:', error);
      throw new Error('Failed to create secure driver');
    }
  }

  async updateSecureAdmin(id: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabaseSecure
        .from('secure_admins')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating secure admin:', error);
        throw new Error('Failed to update secure admin');
      }
      
      console.log(`🔐 Secure admin updated: ${id}`);
      return data;
    } catch (error) {
      console.error('Error updating secure admin:', error);
      throw new Error('Failed to update secure admin');
    }
  }

  async updateSecureDriver(id: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabaseSecure
        .from('secure_drivers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating secure driver:', error);
        throw new Error('Failed to update secure driver');
      }
      
      console.log(`🚚 Secure driver updated: ${id}`);
      return data;
    } catch (error) {
      console.error('Error updating secure driver:', error);
      throw new Error('Failed to update secure driver');
    }
  }

  async getAllSecureAdmins(): Promise<any[]> {
    try {
      const { data, error } = await supabaseSecure
        .from('secure_admins')
        .select(`
          id, username, email, full_name, role, permissions, 
          is_active, last_login, created_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting all secure admins:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting all secure admins:', error);
      return [];
    }
  }

  async getAllSecureDrivers(): Promise<any[]> {
    try {
      const { data, error } = await supabaseSecure
        .from('secure_drivers')
        .select(`
          id, username, email, full_name, driver_code, phone,
          vehicle_type, vehicle_plate, is_active, status, 
          last_login, rating, total_deliveries, created_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting all secure drivers:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting all secure drivers:', error);
      return [];
    }
  }

  async createSecurityLog(logData: any): Promise<any> {
    try {
      const { data, error } = await supabaseSecure
        .from('security_logs')
        .insert({
          ...logData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating security log:', error);
        throw new Error('Failed to create security log');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating security log:', error);
      throw new Error('Failed to create security log');
    }
  }

  async getSecurityLogs(options: any = {}): Promise<any[]> {
    try {
      let query = supabaseSecure.from('security_logs').select('*');
      
      if (options.userType) {
        query = query.eq('user_type', options.userType);
      }
      
      if (options.action) {
        query = query.eq('action', options.action);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50);
      
      if (error) {
        console.error('Error getting security logs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting security logs:', error);
      return [];
    }
  }

  // Initialize test accounts for security system
  async initializeTestAccounts(): Promise<void> {
    try {
      // Hash passwords properly  
      const hashedAdminPassword = await bcrypt.hash('testpass123', 10);
      const hashedDriverPassword = await bcrypt.hash('driverpass123', 10);

      // Check if test admin exists
      const existingAdmin = await this.getSecureAdminByCredentials('testadmin', 'admin@test.com');
      if (!existingAdmin) {
        await this.createSecureAdmin({
          username: 'testadmin',
          email: 'admin@test.com',
          password: hashedAdminPassword,
          full_name: 'مدير تجريبي',
          role: 'admin',
          permissions: ['read', 'write', 'admin']
        });
        console.log('🔐 Test admin account created in Supabase');
      }

      // Check if test driver exists
      const existingDriver = await this.getSecureDriverByCredentials('testdriver', 'driver@test.com', 'DR001');
      if (!existingDriver) {
        await this.createSecureDriver({
          username: 'testdriver',
          email: 'driver@test.com',
          password: hashedDriverPassword,
          driver_code: 'DR001',
          full_name: 'سائق تجريبي',
          phone: '1234567890',
          license_number: 'LIC123',
          vehicle_type: 'motorcycle',
          vehicle_plate: 'ABC123'
        });
        console.log('🚚 Test driver account created in Supabase');
      }
    } catch (error) {
      console.error('Error initializing test accounts:', error);
    }
  }
}

// Function to check if security tables exist in Supabase
export async function checkSecurityTablesExist(): Promise<boolean> {
  try {
    // Try to query each table to see if it exists
    const { error: adminError } = await supabaseSecure
      .from('secure_admins')
      .select('id')
      .limit(1);
    
    const { error: driverError } = await supabaseSecure
      .from('secure_drivers')
      .select('id')
      .limit(1);
    
    const { error: logsError } = await supabaseSecure
      .from('security_logs')
      .select('id')
      .limit(1);
    
    // Tables exist if queries don't return table not found errors
    const tablesExist = !adminError?.message.includes('Could not find the table') &&
                      !driverError?.message.includes('Could not find the table') &&
                      !logsError?.message.includes('Could not find the table');
    
    if (tablesExist) {
      console.log('✅ Security tables already exist in Supabase');
    } else {
      console.log('❌ Security tables do not exist in Supabase');
      console.log('📋 Please create the tables manually in Supabase Dashboard:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Run the SQL script found in supabase-schema.sql');
      console.log('3. Or create tables: secure_admins, secure_drivers, security_logs');
    }
    
    return tablesExist;
  } catch (error) {
    console.error('Error checking security tables:', error);
    return false;
  }
}

// Export singleton instance
export const supabaseSecurityStorage = new SupabaseSecurityStorage();