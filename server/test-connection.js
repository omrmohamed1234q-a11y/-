// Test Supabase Connection
// Run: node test-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔌 Testing Supabase connection...');
console.log('URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
    try {
        console.log('\n📊 Testing database query...');

        // Try to query users table
        const { data, error, count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection failed:', error.message);
            console.log('\n💡 This is expected if you haven\'t run the SQL migration yet.');
            console.log('👉 Go to Supabase dashboard and run migrations/001_initial_schema.sql');
            return false;
        }

        console.log('✅ Connection successful!');
        console.log(`📝 Users table exists (${count || 0} records)`);
        return true;

    } catch (err) {
        console.error('❌ Error:', err.message);
        return false;
    }
}

testConnection()
    .then(success => {
        if (success) {
            console.log('\n🎉 Database is ready to use!');
        } else {
            console.log('\n⚠️  Database needs setup. Run the SQL migration first.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
