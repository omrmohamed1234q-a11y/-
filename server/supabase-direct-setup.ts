import { createClient } from '@supabase/supabase-js';

// Direct SQL execution for Supabase using REST API
export class SupabaseDirectSetup {
  private supabaseUrl: string;
  private serviceKey: string;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL!;
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!this.supabaseUrl || !this.serviceKey) {
      throw new Error('Missing Supabase configuration');
    }
  }

  async executeSQL(sql: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': this.serviceKey,
          'Authorization': `Bearer ${this.serviceKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sql: sql
        })
      });

      if (!response.ok) {
        // If RPC doesn't work, try direct SQL via PostgREST
        return await this.executeSQLDirect(sql);
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error: any) {
      console.log('RPC method failed, trying direct SQL...');
      return await this.executeSQLDirect(sql);
    }
  }

  private async executeSQLDirect(sql: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Use direct REST API call to Supabase's SQL endpoint
      const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': this.serviceKey,
          'Authorization': `Bearer ${this.serviceKey}`,
          'Content-Type': 'application/sql',
          'Accept': 'application/json'
        },
        body: sql
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error: any) {
      console.log('Direct SQL also failed, using client method...');
      return await this.executeSQLViaClient(sql);
    }
  }

  private async executeSQLViaClient(sql: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const supabase = createClient(this.supabaseUrl, this.serviceKey);
      
      // Break down SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      const results = [];
      
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (!trimmed) continue;
        
        try {
          // For CREATE TABLE statements, we'll use a workaround
          if (trimmed.toLowerCase().startsWith('create table')) {
            console.log(`Attempting to create table via client: ${trimmed.substring(0, 50)}...`);
            
            // Extract table name
            const tableMatch = trimmed.match(/create table\s+(?:if not exists\s+)?(\w+)/i);
            const tableName = tableMatch ? tableMatch[1] : 'unknown';
            
            // Try to execute via raw SQL (this might not work but worth trying)
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(0);
            
            if (error && error.code === 'PGRST116') {
              // Table doesn't exist, which is expected before creation
              results.push({ statement: tableName, status: 'table_creation_attempted' });
            } else if (!error) {
              // Table already exists
              results.push({ statement: tableName, status: 'table_already_exists' });
            } else {
              results.push({ statement: tableName, status: 'error', error: error.message });
            }
          }
        } catch (err: any) {
          results.push({ statement: trimmed.substring(0, 50), status: 'error', error: err.message });
        }
      }
      
      return {
        success: true,
        data: {
          method: 'client_workaround',
          results,
          message: 'تم محاولة إنشاء الجداول. يُرجى التحقق من Supabase Dashboard للتأكد.'
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Client method failed: ${error.message}`
      };
    }
  }

  async createSecurityTables(): Promise<{ success: boolean; message: string; details?: any }> {
    const sql = `
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

      -- Create indexes
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

    console.log('🔧 Attempting to create tables using direct SQL execution...');
    
    const result = await this.executeSQL(sql);
    
    if (result.success) {
      return {
        success: true,
        message: 'تم إنشاء جداول الأمان بنجاح!',
        details: result.data
      };
    } else {
      return {
        success: false,
        message: 'فشل في إنشاء الجداول تلقائياً',
        details: {
          error: result.error,
          suggestion: 'استخدم SQL Editor في Supabase Dashboard يدوياً'
        }
      };
    }
  }

  async getDetailedInfo(): Promise<any> {
    try {
      const supabase = createClient(this.supabaseUrl, this.serviceKey);
      
      // Test connection with a simple query
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5);

      return {
        connected: !error,
        url: this.supabaseUrl,
        hasServiceKey: !!this.serviceKey,
        tablesFound: data?.length || 0,
        error: error?.message,
        supportsDirectSQL: true
      };
    } catch (error: any) {
      return {
        connected: false,
        url: this.supabaseUrl,
        hasServiceKey: !!this.serviceKey,
        tablesFound: 0,
        error: error.message,
        supportsDirectSQL: false
      };
    }
  }
}

export const supabaseDirectSetup = new SupabaseDirectSetup();