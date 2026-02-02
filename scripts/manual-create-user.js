
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
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                envVars[key] = value;
            }
        });
    } else {
        console.error('.env file not found at', envPath);
    }
} catch (e) {
    console.error('Could not read .env file:', e);
    process.exit(1);
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createCustomer() {
    const email = 'gsahindu@gmail.com';
    const password = 'Sahi@448866';
    const firstName = 'Sahindu';
    const lastName = 'User';

    console.log(`Creating user ${email}...`);

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm
        user_metadata: {
            first_name: firstName,
            last_name: lastName
        }
    });

    if (authError) {
        if (authError.message.includes('already been registered')) {
            console.log('User already registered in Auth. Proceeding to force verify and check profile...');
            // We need to fetch the user to get the ID
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existing = users.find(u => u.email === email);
            if (existing) {
                console.log(`User exists (ID: ${existing.id}). Force verifying email...`);
                const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
                    password: password, // Reset password just in case
                    email_confirm: true,
                    user_metadata: { first_name: firstName, last_name: lastName }
                });

                if (updateError) console.error('Error verifying user:', updateError);
                else console.log('User verified successfully.');

                await ensureProfile(existing.id, email, firstName, lastName);
                return;
            }
        }
        console.error('Error creating auth user:', authError);
        return;
    }

    if (authUser?.user) {
        console.log('Auth user created:', authUser.user.id);
        await ensureProfile(authUser.user.id, email, firstName, lastName);
    } else {
        console.log('No auth user returned');
    }
}

async function ensureProfile(id, email, firstName, lastName) {
    // 2. Create Public User
    const { error: profileError } = await supabase.from('users').insert({
        id: id,
        auth_user_id: id, // Vital for linking
        email,
        first_name: firstName,
        last_name: lastName,
        phone: '+94 77 123 4567', // Dummy phone
        location: 'Colombo, Sri Lanka', // Dummy location
        password_hash: 'managed_by_supabase_auth',
        user_type: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    if (profileError) {
        if (profileError.code === '23505') { // Unique violation
            console.log('Public profile already exists. Ensuring link...');
            await supabase.from('users').update({ auth_user_id: id }).eq('id', id);
        } else {
            console.error('Error creating public profile:', profileError);
        }
    } else {
        console.log('Public profile created successfully.');
    }
}

createCustomer();
