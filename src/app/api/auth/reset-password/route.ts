import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { message: 'Token and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { message: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Find user with valid token and not expired
        const now = new Date().toISOString();
        const { data: user, error: fetchError } = await supabaseServer
            .from('users')
            .select('id')
            .eq('password_reset_token', token)
            .gt('password_reset_expires', now)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching user for reset:', fetchError);
            return NextResponse.json(
                { message: 'Internal server error' },
                { status: 500 }
            );
        }

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid or expired password reset link' },
                { status: 400 }
            );
        }

        // Update password in Supabase Auth (using Admin API via service role)
        // We first try to update the user. If they don't exist in auth.users (orphan public.users record),
        // we create them.
        try {
            const { error: authError } = await supabaseServer.auth.admin.updateUserById(
                user.id,
                { password: password, email_confirm: true } // Ensure email is marked confirmed on reset
            );

            if (authError) {
                // If user not found, we need to create them (restore execution)
                if (authError.message.includes('User not found') || authError.code === 'user_not_found') {
                    console.log(`Auth user not found for ID ${user.id}, creating new auth user...`);

                    // We need the email to create the user
                    const { data: userData, error: userError } = await supabaseServer
                        .from('users')
                        .select('email')
                        .eq('id', user.id)
                        .single();

                    if (userError || !userData) {
                        throw new Error('Could not fetch email for orphan user creation');
                    }

                    // Try to create the user
                    const { error: createError } = await supabaseServer.auth.admin.createUser({
                        id: user.id, // Keep the same ID to maintain relational integrity
                        email: userData.email,
                        password: password,
                        email_confirm: true
                    });

                    if (createError) {
                        // If user already exists (orphan Auth user with different ID), delete it and recreate
                        if (createError.message.includes('already been registered') || (createError as any).code === 'email_exists') {
                            console.log(`Auth user exists but with different ID (orphan). Cleaning up...`);

                            // We need to find the ID of the conflicting Auth user
                            const { data: { users }, error: listError } = await supabaseServer.auth.admin.listUsers();

                            if (listError) throw listError;

                            const conflictingUser = users.find(u => u.email?.toLowerCase() === userData.email.toLowerCase());

                            if (conflictingUser) {
                                console.log(`Deleting conflicting Auth user ${conflictingUser.id}...`);
                                await supabaseServer.auth.admin.deleteUser(conflictingUser.id);

                                // Retry creation
                                console.log(`Retrying creation with correct ID ${user.id}...`);
                                const { error: retryError } = await supabaseServer.auth.admin.createUser({
                                    id: user.id,
                                    email: userData.email,
                                    password: password,
                                    email_confirm: true
                                });

                                if (retryError) throw retryError;

                                // Update public.users to link auth_user_id just in case
                                await supabaseServer
                                    .from('users')
                                    .update({ auth_user_id: user.id })
                                    .eq('id', user.id);

                            } else {
                                throw new Error('Could not find conflicting Auth user to delete');
                            }
                        } else {
                            throw createError;
                        }
                    } else {
                        // Creation succeeded immediately, update public link
                        await supabaseServer
                            .from('users')
                            .update({ auth_user_id: user.id })
                            .eq('id', user.id);
                    }
                } else {
                    throw authError;
                }
            }
        } catch (error: any) {
            console.error('Error updating/creating auth user:', error);
            return NextResponse.json(
                { message: 'Failed to update authentication credentials' },
                { status: 500 }
            );
        }

        // Clear reset token in public users table
        // We do NOT update password_hash here as it's legacy/unused with Supabase Auth
        const { error: updateError } = await supabaseServer
            .from('users')
            .update({
                password_reset_token: null,
                password_reset_expires: null,
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error clearing reset token:', updateError);
            // We don't fail the request here because the password WAS reset successfully
        }

        return NextResponse.json({
            message: 'Password reset successfully',
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
