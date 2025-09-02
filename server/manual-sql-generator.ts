// Generate SQL scripts for manual execution
export class ManualSQLGenerator {
  
  static getFullSetupSQL(): string {
    return `-- اطبعلي - Security Tables Setup
-- انسخ والصق هذا الكود في Supabase Dashboard > SQL Editor

-- جدول المدراء الآمن
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

-- جدول السائقين الآمن
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

-- جدول السجلات الأمنية
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

-- إنشاء فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_secure_admins_username ON secure_admins(username);
CREATE INDEX IF NOT EXISTS idx_secure_admins_email ON secure_admins(email);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_username ON secure_drivers(username);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_email ON secure_drivers(email);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_code ON secure_drivers(driver_code);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_type ON security_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);

-- إدراج بيانات تجريبية
INSERT INTO secure_admins (username, email, password, full_name, role, permissions, is_active)
VALUES (
  'testadmin',
  'admin@test.com',
  '$2b$10$rMZ1qF0EsJQQcl1QoP8N9eCqRRXn5.M9Y4b1kJ7vNDzUqGaAbN6Sy', -- testpass123
  'مدير تجريبي',
  'admin',
  ARRAY['read', 'write', 'admin'],
  true
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO secure_drivers (username, email, password, driver_code, full_name, phone, license_number, vehicle_type, vehicle_plate, is_active, status)
VALUES (
  'testdriver',
  'driver@test.com',
  '$2b$10$rMZ1qF0EsJQQcl1QoP8N9eCqRRXn5.M9Y4b1kJ7vNDzUqGaAbN6Sy', -- driverpass123
  'DR001',
  'سائق تجريبي',
  '1234567890',
  'LIC123',
  'motorcycle',
  'ABC123',
  true,
  'offline'
)
ON CONFLICT (username) DO NOTHING;

-- رسالة نجاح
SELECT 'تم إنشاء جداول الأمان وإدراج البيانات التجريبية بنجاح! 🎉' as setup_status;`;
  }

  static getTestAccountsSQL(): string {
    return `-- إنشاء حسابات تجريبية فقط
-- تأكد من إنشاء الجداول أولاً

INSERT INTO secure_admins (username, email, password, full_name, role, permissions, is_active)
VALUES (
  'testadmin',
  'admin@test.com',
  '$2b$10$rMZ1qF0EsJQQcl1QoP8N9eCqRRXn5.M9Y4b1kJ7vNDzUqGaAbN6Sy', -- testpass123
  'مدير تجريبي',
  'admin',
  ARRAY['read', 'write', 'admin'],
  true
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO secure_drivers (username, email, password, driver_code, full_name, phone, license_number, vehicle_type, vehicle_plate, is_active, status)
VALUES (
  'testdriver',
  'driver@test.com',
  '$2b$10$rMZ1qF0EsJQQcl1QoP8N9eCqRRXn5.M9Y4b1kJ7vNDzUqGaAbN6Sy', -- driverpass123
  'DR001',
  'سائق تجريبي',
  '1234567890',
  'LIC123',
  'motorcycle',
  'ABC123',
  true,
  'offline'
)
ON CONFLICT (username) DO NOTHING;

SELECT 'تم إنشاء الحسابات التجريبية بنجاح!' as result;`;
  }

  static getTablesOnlySQL(): string {
    return `-- إنشاء الجداول فقط بدون بيانات تجريبية

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

SELECT 'تم إنشاء الجداول بنجاح!' as result;`;
  }
}