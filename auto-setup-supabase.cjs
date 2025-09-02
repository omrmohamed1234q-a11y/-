// أداة إعداد Supabase التلقائية للنظام الأمني
const https = require('https');
const fs = require('fs');

// قراءة متغيرات البيئة
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ متغيرات Supabase مفقودة');
  console.log('تأكد من وجود SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في ملف .env');
  process.exit(1);
}

// SQL لإنشاء جميع الجداول
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

function makeHttpRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: body,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function createTablesViaRest() {
  try {
    console.log('🚀 محاولة إنشاء الجداول عبر Supabase REST API...');
    
    const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    };
    
    const payload = JSON.stringify({
      sql: createTablesSQL
    });
    
    const response = await makeHttpRequest(url, options, payload);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✅ تم إنشاء الجداول بنجاح!');
      return true;
    } else {
      console.log('⚠️ لم يتم إنشاء الجداول عبر API، سنحتاج للطريقة اليدوية');
      return false;
    }
  } catch (error) {
    console.log('⚠️ فشل في إنشاء الجداول عبر API:', error.message);
    return false;
  }
}

function generateSQLFile() {
  console.log('📄 إنشاء ملف SQL للإعداد اليدوي...');
  
  const sqlContent = `-- Supabase Security Tables Setup
-- انسخ والصق هذا الكود في Supabase Dashboard > SQL Editor

${createTablesSQL}

-- الخطوة التالية: تشغيل الأمر التالي لإنشاء الحسابات التجريبية
-- node setup-supabase.cjs
`;
  
  fs.writeFileSync('create-security-tables.sql', sqlContent);
  console.log('✅ تم إنشاء ملف create-security-tables.sql');
}

async function main() {
  console.log('🔧 إعداد جداول الأمان في Supabase');
  console.log('================================\n');
  
  // محاولة إنشاء الجداول تلقائياً
  const autoCreated = await createTablesViaRest();
  
  if (!autoCreated) {
    // إنشاء ملف SQL للإعداد اليدوي
    generateSQLFile();
    
    console.log('\n📋 الإعداد اليدوي مطلوب:');
    console.log('======================');
    console.log('1. اذهب إلى Supabase Dashboard');
    console.log('2. انتقل إلى SQL Editor');
    console.log('3. افتح ملف create-security-tables.sql واقطعه والصقه');
    console.log('4. اضغط Run لتنفيذ الكود');
    console.log('5. شغل الأمر: node setup-supabase.cjs');
    console.log('======================\n');
  }
  
  console.log('🎯 الخطوات التالية:');
  console.log('- إنشاء الحسابات التجريبية');
  console.log('- اختبار تسجيل الدخول');
  console.log('- التحقق من عمل النظام الأمني');
}

main().catch(console.error);