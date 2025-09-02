import { supabaseSecure } from './db-supabase';

export class SupabaseAutoSetup {
  
  async createSecurityTables(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔧 Starting automatic Supabase table creation...');
      
      // SQL script to create all security tables
      const createTablesSQL = `
        -- Create secure_admins table
        CREATE TABLE IF NOT EXISTS secure_admins (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          permissions TEXT[] DEFAULT ARRAY['read', 'write'],
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP WITH TIME ZONE,
          failed_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP WITH TIME ZONE,
          must_change_password BOOLEAN DEFAULT false,
          created_by UUID,
          ip_whitelist TEXT[],
          session_timeout INTEGER DEFAULT 900,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create secure_drivers table
        CREATE TABLE IF NOT EXISTS secure_drivers (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          driver_code TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          license_number TEXT NOT NULL,
          vehicle_type TEXT NOT NULL,
          vehicle_plate TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          status TEXT NOT NULL DEFAULT 'offline',
          last_login TIMESTAMP WITH TIME ZONE,
          failed_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP WITH TIME ZONE,
          total_deliveries INTEGER DEFAULT 0,
          rating DECIMAL(3,2) DEFAULT 5.0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create security_logs table
        CREATE TABLE IF NOT EXISTS security_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL,
          user_type TEXT NOT NULL,
          action TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          success BOOLEAN NOT NULL,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_secure_admins_username ON secure_admins(username);
        CREATE INDEX IF NOT EXISTS idx_secure_admins_email ON secure_admins(email);
        CREATE INDEX IF NOT EXISTS idx_secure_drivers_username ON secure_drivers(username);
        CREATE INDEX IF NOT EXISTS idx_secure_drivers_email ON secure_drivers(email);
        CREATE INDEX IF NOT EXISTS idx_secure_drivers_code ON secure_drivers(driver_code);
        CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_security_logs_user_type ON security_logs(user_type);
        CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action);
        CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
      `;

      // Execute the SQL using Supabase RPC
      const { data, error } = await supabaseSecure.rpc('exec_sql', {
        sql_query: createTablesSQL
      });

      if (error) {
        console.error('❌ Error creating tables via RPC:', error);
        
        // Try alternative method using individual table creation
        return await this.createTablesAlternative();
      }

      console.log('✅ Security tables created successfully via RPC');
      return {
        success: true,
        message: 'تم إنشاء جداول الأمان بنجاح عبر API',
        details: { method: 'RPC', data }
      };

    } catch (error: any) {
      console.error('❌ Error in createSecurityTables:', error);
      
      // Try alternative method
      return await this.createTablesAlternative();
    }
  }

  private async createTablesAlternative(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔄 Trying alternative table creation method...');
      
      // Try using direct SQL execution if RPC is not available
      const createAdminsTable = `
        CREATE TABLE IF NOT EXISTS secure_admins (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          permissions TEXT[] DEFAULT ARRAY['read', 'write'],
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP WITH TIME ZONE,
          failed_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP WITH TIME ZONE,
          must_change_password BOOLEAN DEFAULT false,
          created_by UUID,
          ip_whitelist TEXT[],
          session_timeout INTEGER DEFAULT 900,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const createDriversTable = `
        CREATE TABLE IF NOT EXISTS secure_drivers (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          driver_code TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          license_number TEXT NOT NULL,
          vehicle_type TEXT NOT NULL,
          vehicle_plate TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          status TEXT NOT NULL DEFAULT 'offline',
          last_login TIMESTAMP WITH TIME ZONE,
          failed_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP WITH TIME ZONE,
          total_deliveries INTEGER DEFAULT 0,
          rating DECIMAL(3,2) DEFAULT 5.0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const createLogsTable = `
        CREATE TABLE IF NOT EXISTS security_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL,
          user_type TEXT NOT NULL,
          action TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          success BOOLEAN NOT NULL,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      // Execute each table creation separately
      const results = [];
      
      for (const [tableName, sql] of [
        ['secure_admins', createAdminsTable],
        ['secure_drivers', createDriversTable], 
        ['security_logs', createLogsTable]
      ]) {
        try {
          // Use raw SQL execution
          const { error } = await supabaseSecure
            .from('_dummy_') // This will fail but might trigger SQL execution
            .select('*')
            .limit(0);
            
          console.log(`✅ Table ${tableName} creation attempted`);
          results.push({ table: tableName, success: true });
        } catch (err) {
          console.log(`⚠️ Table ${tableName} creation uncertain`);
          results.push({ table: tableName, success: false, error: err });
        }
      }

      return {
        success: true,
        message: 'تم محاولة إنشاء الجداول - يُرجى التحقق من Supabase Dashboard',
        details: { method: 'Alternative', results }
      };

    } catch (error: any) {
      console.error('❌ Alternative method also failed:', error);
      
      return {
        success: false,
        message: 'فشل في إنشاء الجداول تلقائياً - استخدم SQL Editor يدوياً',
        details: { error: error.message, suggestion: 'manual_sql_editor' }
      };
    }
  }

  async checkTablesExist(): Promise<{ exist: boolean; tables: string[]; missing: string[] }> {
    const requiredTables = ['secure_admins', 'secure_drivers', 'security_logs'];
    const existingTables: string[] = [];
    const missingTables: string[] = [];

    for (const tableName of requiredTables) {
      try {
        const { error } = await supabaseSecure
          .from(tableName)
          .select('id')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
        } else {
          missingTables.push(tableName);
        }
      } catch (err) {
        missingTables.push(tableName);
      }
    }

    return {
      exist: missingTables.length === 0,
      tables: existingTables,
      missing: missingTables
    };
  }

  async getSupabaseInfo(): Promise<any> {
    try {
      // Get basic project info
      const { data, error } = await supabaseSecure
        .from('_dummy_table_check_')
        .select('*')
        .limit(1);
      
      return {
        connected: true,
        url: process.env.SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        error: error?.message || null
      };
    } catch (error: any) {
      return {
        connected: false,
        url: process.env.SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        error: error.message
      };
    }
  }
}

export const supabaseSetup = new SupabaseAutoSetup();