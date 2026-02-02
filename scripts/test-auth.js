const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manual env parsing
const envPath = path.resolve(__dirname, '../.env');
let envVars = {};
try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^\s*([^=]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                let key = match[1].trim();
                let value = (match[2] || '').trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                envVars[key] = value;
            }
        });
    }
} catch (e) {
    console.error('Could not read .env file:', e);
    process.exit(1);
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Auth...');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
    console.log('\n1. Testing signInWithPassword...');

    const timeout = setTimeout(() => {
        console.error('❌ Auth request timed out after 5 seconds');
        console.log('\nPossible causes:');
        console.log('- Email auth is disabled in Supabase dashboard');
        console.log('- Site URL restrictions blocking localhost');
        console.log('- Email provider not configured');
        console.log('- Network/firewall blocking Supabase');
        process.exit(1);
    }, 5000);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'gsahindu@gmail.com',
            password: 'Sahi@448866'
        });

        clearTimeout(timeout);

        if (error) {
            console.error('❌ Auth error:', error);
        } else if (data.user) {
            console.log('✅ Login successful!');
            console.log('User ID:', data.user.id);
            console.log('Email:', data.user.email);

            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('auth_user_id', data.user.id)
                .single();

            if (profileError) {
                console.error('❌ Profile fetch error:', profileError);
            } else {
                console.log('✅ User Profile found:', profile);

                // Check taskers table
                const { data: tasker, error: taskerError } = await supabase
                    .from('taskers')
                    .select('*')
                    .eq('user_id', profile.id)
                    .single();

                if (taskerError) {
                    console.log('ℹ️ No tasker profile found (or error):', taskerError.message);
                } else {
                    console.log('✅ Tasker Profile found:', tasker);
                }
            }
        } else {
            console.log('⚠️  No error but no user returned');
        }
    } catch (err) {
        clearTimeout(timeout);
        console.error('❌ Exception:', err);
    }
}

testAuth();
