import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { email, locale } = await request.json();
        const safeLocale = locale || 'en';

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        const sanitizedEmail = email.trim().toLowerCase();

        // Check if user exists
        const { data: user, error: fetchError } = await supabaseServer
            .from('users')
            .select('id')
            .ilike('email', sanitizedEmail)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching user:', fetchError);
            return NextResponse.json(
                { message: 'Internal server error' },
                { status: 500 }
            );
        }

        // Even if user doesn't exist, we generally don't want to reveal that info security-wise,
        // but for this implementation we'll simulate success or handle it gracefully.
        // If we want to return success even if email not found:
        if (!user) {
            // Return success to avoid email enumeration, but log internally
            console.log(`Password reset requested for non-existent email: ${sanitizedEmail}`);
            return NextResponse.json({
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600 * 1000); // 1 hour from now

        // Save token to DB
        const { error: updateError } = await supabaseServer
            .from('users')
            .update({
                password_reset_token: token,
                password_reset_expires: expires.toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating user token:', updateError);
            throw new Error('Failed to generate reset token');
        }

        // Construct reset link
        const origin = request.nextUrl.origin;
        const resetLink = `${origin}/${safeLocale}/reset-password?token=${token}`;

        // Simulate sending email (Log to console)
        console.log('========================================================');
        console.log(`Password Reset Link for ${sanitizedEmail}:`);
        console.log(resetLink);
        console.log('========================================================');

        return NextResponse.json({
            message: 'If an account exists with this email, a password reset link has been sent.',
            resetLink, // Returning this for testing purposes since no email service
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
