# دليل إعداد Supabase للنظام الأمني 

## الخطوة 1: إنشاء الجداول في Supabase

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. انتقل إلى **SQL Editor** من القائمة الجانبية
4. انشئ استعلام جديد (New Query)
5. انسخ والصق الكود التالي:

```sql
-- إنشاء جدول المدراء الآمن
CREATE TABLE secure_admins (
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

-- إنشاء جدول السائقين الآمن
CREATE TABLE secure_drivers (
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

-- إنشاء جدول السجلات الأمنية
CREATE TABLE security_logs (
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

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_secure_admins_username ON secure_admins(username);
CREATE INDEX IF NOT EXISTS idx_secure_admins_email ON secure_admins(email);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_username ON secure_drivers(username);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_email ON secure_drivers(email);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_code ON secure_drivers(driver_code);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_type ON security_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
```

6. اضغط على **Run** لتنفيذ الكود

## الخطوة 2: إنشاء الحسابات التجريبية

بعد إنشاء الجداول، نفذ الأمر التالي في Terminal:

```bash
node setup-supabase.cjs
```

هذا سينشئ:
- حساب مدير تجريبي: `testadmin` / `admin@test.com` / `testpass123`
- حساب سائق تجريبي: `testdriver` / `driver@test.com` / `driverpass123`

## الخطوة 3: التحقق من النجاح

- اعد تشغيل الخادم
- اختبر تسجيل الدخول في `/secure-admin-login`
- تحقق من عمل النظام في `/security-test`

## استكشاف الأخطاء

إذا ظهرت رسائل خطأ:
1. تأكد من وجود متغيرات البيئة: `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY`
2. تأكد من أن الجداول تم إنشاؤها بنجاح في Supabase Dashboard
3. تحقق من الأذونات في Supabase (Row Level Security)

## أمان إضافي (اختياري)

يمكنك تفعيل Row Level Security عبر إضافة:

```sql
-- تفعيل الحماية على مستوى الصف
ALTER TABLE secure_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات للخدمة
CREATE POLICY "Service role access" ON secure_admins
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access" ON secure_drivers
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access" ON security_logs
    FOR ALL USING (auth.role() = 'service_role');
```