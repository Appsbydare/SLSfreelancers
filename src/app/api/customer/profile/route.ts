import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
    try {
        // Create authenticated Supabase client
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            first_name,
            last_name,
            calling_name,
            phone,
            location,
            city,
            district,
            address_line1,
            address_line2,
            postal_code,
        } = body;

        // Update users table
        const { error: userError } = await supabase
            .from('users')
            .update({
                first_name,
                last_name,
                calling_name,
                phone,
                location,
                city,
                district,
                updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', user.id);

        if (userError) {
            console.error('Error updating user:', userError);
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        // Get user ID from users table
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update or create customers record
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('user_id', userData.id)
            .maybeSingle();

        if (existingCustomer) {
            // Update existing customer
            const { error: customerError } = await supabase
                .from('customers')
                .update({
                    address_line1,
                    address_line2,
                    city,
                    district,
                    postal_code,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userData.id);

            if (customerError) {
                console.error('Error updating customer:', customerError);
            }
        } else {
            // Create new customer record
            const { error: customerError } = await supabase
                .from('customers')
                .insert({
                    user_id: userData.id,
                    address_line1,
                    address_line2,
                    city,
                    district,
                    postal_code,
                });

            if (customerError) {
                console.error('Error creating customer:', customerError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in profile update:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
