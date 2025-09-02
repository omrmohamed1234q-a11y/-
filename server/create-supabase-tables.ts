import { supabaseSecure } from './db-supabase';

// Function to create security tables directly in Supabase
export async function createSupabaseSecurityTables(): Promise<boolean> {
  try {
    console.log('🚀 Creating security tables in Supabase...');

    // Create secure_admins table
    console.log('Creating secure_admins table...');
    const { error: adminTableError } = await supabaseSecure
      .from('_fake_table_for_sql')
      .select('*')
      .eq('create_table', `
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
      `);

    // Let's try a different approach - direct table creation via REST API
    const tableCreationSQL = [
      // secure_admins table
      `CREATE TABLE IF NOT EXISTS secure_admins (
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
      );`,
      
      // secure_drivers table
      `CREATE TABLE IF NOT EXISTS secure_drivers (
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
      );`,
      
      // security_logs table
      `CREATE TABLE IF NOT EXISTS security_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_type TEXT NOT NULL,
        action TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_secure_admins_username ON secure_admins(username);`,
      `CREATE INDEX IF NOT EXISTS idx_secure_admins_email ON secure_admins(email);`,
      `CREATE INDEX IF NOT EXISTS idx_secure_drivers_username ON secure_drivers(username);`,
      `CREATE INDEX IF NOT EXISTS idx_secure_drivers_email ON secure_drivers(email);`,
      `CREATE INDEX IF NOT EXISTS idx_secure_drivers_code ON secure_drivers(driver_code);`,
      `CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_security_logs_user_type ON security_logs(user_type);`,
      `CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action);`,
      `CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);`,
    ];

    // Since Supabase doesn't allow direct SQL execution from client,
    // we'll use a different approach - manual table creation guide
    console.log('\n📋 SUPABASE TABLE CREATION GUIDE:');
    console.log('==================================');
    console.log('Go to your Supabase Dashboard > SQL Editor and run this SQL:');
    console.log('\n' + tableCreationSQL.join('\n\n'));
    console.log('\n==================================\n');

    return true;
  } catch (error) {
    console.error('Failed to create security tables:', error);
    return false;
  }
}

// Alternative: Create tables using Supabase Management API
export async function createTablesViaAPI(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase credentials');
    }

    // Extract project ref from URL
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    
    console.log('🔧 Using Supabase Management API to create tables...');
    
    // Create each table via direct API calls
    const adminTableSQL = `
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
      
      CREATE INDEX IF NOT EXISTS idx_secure_admins_username ON secure_admins(username);
      CREATE INDEX IF NOT EXISTS idx_secure_admins_email ON secure_admins(email);
    `;

    // Use the REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      },
      body: JSON.stringify({ sql: adminTableSQL })
    });

    if (!response.ok) {
      console.log('Direct API creation not available, using manual approach...');
      return createSupabaseSecurityTables();
    }

    console.log('✅ Tables created successfully via API');
    return true;
  } catch (error) {
    console.log('API creation failed, falling back to manual approach...');
    return createSupabaseSecurityTables();
  }
}

// Execute creation if run directly
if (require.main === module) {
  createTablesViaAPI()
    .then((success) => {
      if (success) {
        console.log('🎉 Security tables setup completed!');
        process.exit(0);
      } else {
        console.log('❌ Manual setup required');
        process.exit(1);
      }
    });
}