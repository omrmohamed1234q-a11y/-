const { createClient } = require('@supabase/supabase-js');
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

async function testTableCreation() {
  try {
    console.log('🧪 Testing if security tables exist...');
    
    const { data, error } = await supabase
      .from('secure_admins')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('Could not find the table')) {
        console.log('❌ Tables do not exist yet');
        return false;
      }
    }
    
    console.log('✅ Tables exist and working!');
    return true;
  } catch (error) {
    console.log('❌ Tables do not exist:', error.message);
    return false;
  }
}

async function createTestAccount() {
  try {
    const bcrypt = require('bcrypt');
    
    // Hash test passwords
    const hashedAdminPassword = await bcrypt.hash('testpass123', 10);
    const hashedDriverPassword = await bcrypt.hash('driverpass123', 10);
    
    console.log('🔧 Creating test admin account...');
    
    // Check if admin exists
    const { data: existingAdmin } = await supabase
      .from('secure_admins')
      .select('id')
      .eq('username', 'testadmin')
      .eq('email', 'admin@test.com')
      .single();
    
    if (!existingAdmin) {
      const { data: admin, error: adminError } = await supabase
        .from('secure_admins')
        .insert({
          username: 'testadmin',
          email: 'admin@test.com',
          password: hashedAdminPassword,
          full_name: 'مدير تجريبي',
          role: 'admin',
          permissions: ['read', 'write', 'admin']
        })
        .select()
        .single();
      
      if (adminError) {
        console.error('Error creating admin:', adminError);
      } else {
        console.log('✅ Test admin account created:', admin.username);
      }
    } else {
      console.log('✅ Test admin account already exists');
    }
    
    console.log('🚗 Creating test driver account...');
    
    // Check if driver exists
    const { data: existingDriver } = await supabase
      .from('secure_drivers')
      .select('id')
      .eq('username', 'testdriver')
      .eq('email', 'driver@test.com')
      .single();
    
    if (!existingDriver) {
      const { data: driver, error: driverError } = await supabase
        .from('secure_drivers')
        .insert({
          username: 'testdriver',
          email: 'driver@test.com',
          password: hashedDriverPassword,
          driver_code: 'DR001',
          full_name: 'سائق تجريبي',
          phone: '1234567890',
          license_number: 'LIC123',
          vehicle_type: 'motorcycle',
          vehicle_plate: 'ABC123'
        })
        .select()
        .single();
      
      if (driverError) {
        console.error('Error creating driver:', driverError);
      } else {
        console.log('✅ Test driver account created:', driver.username);
      }
    } else {
      console.log('✅ Test driver account already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating test accounts:', error);
    return false;
  }
}

async function main() {
  console.log('🔧 Supabase Security System Setup');
  console.log('=================================\n');
  
  // Test if tables exist
  const tablesExist = await testTableCreation();
  
  if (!tablesExist) {
    console.log('\n📋 MANUAL TABLE CREATION REQUIRED:');
    console.log('===================================');
    console.log('Go to Supabase Dashboard → SQL Editor and run:');
    console.log('\nCREATE TABLE secure_admins (');
    console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('  username TEXT NOT NULL UNIQUE,');
    console.log('  email TEXT NOT NULL UNIQUE,');
    console.log('  password TEXT NOT NULL,');
    console.log('  full_name TEXT NOT NULL,');
    console.log('  role TEXT NOT NULL DEFAULT \'admin\',');
    console.log('  permissions TEXT[] DEFAULT ARRAY[\'read\', \'write\'],');
    console.log('  is_active BOOLEAN DEFAULT true,');
    console.log('  last_login TIMESTAMP WITH TIME ZONE,');
    console.log('  failed_attempts INTEGER DEFAULT 0,');
    console.log('  locked_until TIMESTAMP WITH TIME ZONE,');
    console.log('  must_change_password BOOLEAN DEFAULT false,');
    console.log('  created_by UUID,');
    console.log('  ip_whitelist TEXT[],');
    console.log('  session_timeout INTEGER DEFAULT 900,');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('CREATE TABLE secure_drivers (');
    console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('  username TEXT NOT NULL UNIQUE,');
    console.log('  email TEXT NOT NULL UNIQUE,');
    console.log('  password TEXT NOT NULL,');
    console.log('  driver_code TEXT NOT NULL UNIQUE,');
    console.log('  full_name TEXT NOT NULL,');
    console.log('  phone TEXT NOT NULL,');
    console.log('  license_number TEXT NOT NULL,');
    console.log('  vehicle_type TEXT NOT NULL,');
    console.log('  vehicle_plate TEXT NOT NULL,');
    console.log('  is_active BOOLEAN DEFAULT true,');
    console.log('  status TEXT NOT NULL DEFAULT \'offline\',');
    console.log('  last_login TIMESTAMP WITH TIME ZONE,');
    console.log('  failed_attempts INTEGER DEFAULT 0,');
    console.log('  locked_until TIMESTAMP WITH TIME ZONE,');
    console.log('  total_deliveries INTEGER DEFAULT 0,');
    console.log('  rating DECIMAL(3,2) DEFAULT 5.0,');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('CREATE TABLE security_logs (');
    console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('  user_id TEXT NOT NULL,');
    console.log('  user_type TEXT NOT NULL,');
    console.log('  action TEXT NOT NULL,');
    console.log('  ip_address TEXT,');
    console.log('  user_agent TEXT,');
    console.log('  success BOOLEAN NOT NULL,');
    console.log('  error_message TEXT,');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('\n===================================');
    console.log('After creating tables, run this script again to create test accounts.');
    process.exit(1);
  }
  
  // Create test accounts
  const accountsCreated = await createTestAccount();
  
  if (accountsCreated) {
    console.log('\n🎉 Supabase security system is ready!');
    console.log('Test credentials:');
    console.log('Admin: testadmin / admin@test.com / testpass123');
    console.log('Driver: testdriver / driver@test.com / driverpass123');
    process.exit(0);
  } else {
    console.log('❌ Failed to create test accounts');
    process.exit(1);
  }
}

main().catch(console.error);