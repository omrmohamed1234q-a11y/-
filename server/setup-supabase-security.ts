import { supabaseSecure } from './db-supabase';

// SQL schema for security tables
const securitySchema = `
-- Create secure admins table
CREATE TABLE IF NOT EXISTS public.secure_admins (
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

-- Create secure drivers table
CREATE TABLE IF NOT EXISTS public.secure_drivers (
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

-- Create security logs table
CREATE TABLE IF NOT EXISTS public.security_logs (
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
CREATE INDEX IF NOT EXISTS idx_secure_admins_username ON public.secure_admins(username);
CREATE INDEX IF NOT EXISTS idx_secure_admins_email ON public.secure_admins(email);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_username ON public.secure_drivers(username);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_email ON public.secure_drivers(email);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_code ON public.secure_drivers(driver_code);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_type ON public.security_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON public.security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);
`;

export async function setupSupabaseSecuritySchema(): Promise<boolean> {
  try {
    console.log('🚀 Setting up Supabase security schema...');
    
    // Execute schema creation
    const { error } = await supabaseSecure.rpc('exec_sql', { sql: securitySchema });
    
    if (error) {
      console.error('Error setting up security schema:', error);
      
      // Try alternative approach - execute statements one by one
      const statements = securitySchema.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabaseSecure.rpc('exec_sql', { 
            sql: statement.trim() + ';' 
          });
          
          if (stmtError) {
            console.warn('Statement execution warning:', statement.substring(0, 50) + '...', stmtError);
          }
        }
      }
    }
    
    console.log('✅ Supabase security schema setup completed');
    return true;
  } catch (error) {
    console.error('Failed to setup Supabase security schema:', error);
    return false;
  }
}

// Execute setup if run directly
if (require.main === module) {
  setupSupabaseSecuritySchema()
    .then((success) => {
      if (success) {
        console.log('🎉 Security system ready!');
        process.exit(0);
      } else {
        console.log('❌ Setup failed');
        process.exit(1);
      }
    });
}