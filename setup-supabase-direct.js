const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL to create all security tables
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

async function createSecurityTables() {
  try {
    console.log('🚀 Creating security tables in Supabase...');
    
    // Try using the sql function if available
    const { data, error } = await supabase.rpc('sql', { query: createTablesSQL });
    
    if (error) {
      console.log('Direct SQL execution not available. Manual setup required.');
      console.log('\n📋 MANUAL SETUP INSTRUCTIONS:');
      console.log('===============================');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Create a new query and paste this SQL:\n');
      console.log(createTablesSQL);
      console.log('\n4. Click "Run" to execute the SQL');
      console.log('===============================\n');
      return false;
    }
    
    console.log('✅ Security tables created successfully!');
    return true;
  } catch (error) {
    console.error('Error creating tables:', error.message);
    
    // Fallback: Show manual instructions
    console.log('\n📋 MANUAL SETUP INSTRUCTIONS:');
    console.log('===============================');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create a new query and paste this SQL:\n');
    console.log(createTablesSQL);
    console.log('\n4. Click "Run" to execute the SQL');
    console.log('===============================\n');
    
    return false;
  }
}

// Test table creation via direct insert attempt
async function testTableCreation() {
  try {
    console.log('🧪 Testing table creation by attempting insert...');
    
    // Try to insert a test record to see if table exists
    const { data, error } = await supabase
      .from('secure_admins')
      .insert([
        {
          username: 'test',
          email: 'test@example.com',
          password: 'test',
          full_name: 'Test User'
        }
      ]);
    
    if (error) {
      if (error.message.includes('Could not find the table')) {
        console.log('❌ Tables do not exist yet');
        return false;
      } else {
        console.log('⚠️ Tables exist but insert failed (this is expected):', error.message);
        return true;
      }
    }
    
    // Clean up test record
    await supabase
      .from('secure_admins')
      .delete()
      .eq('username', 'test');
    
    console.log('✅ Tables exist and working!');
    return true;
  } catch (error) {
    console.log('❌ Tables do not exist:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Supabase Security Tables Setup');
  console.log('==================================\n');
  
  // First test if tables already exist
  const tablesExist = await testTableCreation();
  
  if (tablesExist) {
    console.log('✅ Security tables already exist in Supabase!');
    process.exit(0);
  }
  
  // Try to create tables
  const created = await createSecurityTables();
  
  if (created) {
    console.log('🎉 Setup completed successfully!');
    process.exit(0);
  } else {
    console.log('📝 Manual setup required - follow the instructions above');
    process.exit(1);
  }
}

main().catch(console.error);