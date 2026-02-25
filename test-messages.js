const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    const { data, error } = await supabase
        .from('users')
        .select('id, taskers(id)')
        // Get any user
        .limit(1);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Error:', error);
}

test();
