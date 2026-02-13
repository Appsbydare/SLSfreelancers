import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/';
    const userTypeParam = searchParams.get('userType');

    if (code) {
        const cookieStore = await cookies();
        const supabaseName = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createServerClient(
            supabaseName,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.session?.user) {
            const user = data.session.user;

            // Check if user profile exists using query (using anon key with RLS)
            const { data: profile } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', user.id)
                .single();

            if (!profile) {
                // Safe check for service role key
                const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                if (!serviceRoleKey) {
                    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
                    return NextResponse.redirect(`${origin}/login?error=configuration_error`);
                }

                // Create user profile if it doesn't exist using service role
                const supabaseAdmin = createClient(supabaseName, serviceRoleKey);

                const { user_metadata, email } = user;
                const fullName = user_metadata.full_name || '';
                const givenName = user_metadata.given_name || fullName.split(' ')[0] || 'User';
                const familyName = user_metadata.family_name || fullName.split(' ').slice(1).join(' ') || '';

                // Determine user type
                const userType = userTypeParam === 'tasker' ? 'tasker' : 'customer';

                // Insert into public.users with required fields
                const { data: newUser, error: createError } = await supabaseAdmin
                    .from('users')
                    .insert({
                        auth_user_id: user.id,
                        email: email || '',
                        first_name: givenName,
                        last_name: familyName,
                        phone: '', // Placeholder, should be updated by user
                        password_hash: 'google-oauth', // Placeholder
                        user_type: userType,
                        is_verified: true, // Email is verified by Google
                        email_verified: true,
                    })
                    .select('id')
                    .single();

                if (createError) {
                    console.error('Error creating user profile in callback:', createError);
                    return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`);
                } else if (newUser) {
                    // Always create customer record
                    await supabaseAdmin
                        .from('customers')
                        .insert({
                            user_id: newUser.id,
                        });

                    // Tasker record creation is deferred to the onboarding flow
                    // to prevent conflicts with the "Upgrade" logic in stage-1.
                }
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // return the user to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
