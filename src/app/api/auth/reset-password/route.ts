import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

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

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user
        const { error: updateError } = await supabaseServer
            .from('users')
            .update({
                password_hash: hashedPassword,
                password_reset_token: null,
                password_reset_expires: null,
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating password:', updateError);
            return NextResponse.json(
                { message: 'Failed to reset password' },
                { status: 500 }
            );
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
