// Test Supabase Connection (ES Module)
// Run: node test-connection.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔌 Testing Supabase connection...');
console.log('URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Key:', supabaseServiceKey ? '✅ Found (hidden)' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('\n❌ Missing Supabase credentials in .env file');
    console.log('Expected variables:');
    console.log('  - SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testConnection() {
    try {
        console.log('\n📊 Testing database query...');

        // Try to query users table
        const { data, error, count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) {
            if (error.message.includes('relation "users" does not exist')) {
                console.log('⚠️  Tables not created yet');
                console.log('\n💡 Next steps:');
                console.log('1. Go to https://supabase.com/dashboard');
                console.log('2. Open SQL Editor');
                console.log('3. Run migrations/001_initial_schema.sql');
                return false;
            }

            console.error('❌ Connection failed:', error.message);
            return false;
        }

        console.log('✅ Connection successful!');
        console.log(`📝 Users table exists (${count || 0} records)`);

        // Try to query products table
        const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        console.log(`📦 Products table exists (${productCount || 0} records)`);

        // Try to query orders table
        const { count: orderCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        console.log(`📋 Orders table exists (${orderCount || 0} records)`);

        return true;

    } catch (err) {
        console.error('❌ Error:', err.message);
        return false;
    }
}

console.log('\n' + '='.repeat(50));
testConnection()
    .then(success => {
        console.log('='.repeat(50));
        if (success) {
            console.log('\n🎉 Database is ready to use!');
            console.log('✅ All tables created successfully');
            console.log('\n📝 Next steps:');
            console.log('1. Test creating a product');
            console.log('2. Switch to PostgresStorage in your app');
            console.log('3. Start using the database!');
        } else {
            console.log('\n⚠️  Database needs setup');
            console.log('👉 Run the SQL migration first');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(err => {
        console.error('\n💥 Fatal error:', err);
        process.exit(1);
    });
