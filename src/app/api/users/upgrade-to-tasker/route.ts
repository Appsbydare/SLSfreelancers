import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * API endpoint to upgrade an existing customer to a tasker
 * This allows customers to become sellers without creating a new account
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId && !email) {
      return NextResponse.json(
        { message: 'User ID or email is required' },
        { status: 400 }
      );
    }

    // Find the user
    let query = supabaseServer.from('users').select('*');
    
    if (userId) {
      query = query.eq('id', userId);
    } else {
      query = query.eq('email', email.trim().toLowerCase());
    }

    const { data: user, error: userError } = await query.maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has a tasker record
    const { data: existingTasker } = await supabaseServer
      .from('taskers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingTasker) {
      return NextResponse.json(
        { 
          message: 'User already has a tasker account',
          hasTaskerAccount: true,
          userId: user.id
        },
        { status: 200 }
      );
    }

    // Check if user has a customer record (they should, if they're a customer)
    const { data: customerRecord } = await supabaseServer
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json(
      {
        message: 'User eligible for tasker upgrade',
        canUpgrade: true,
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        isEmailVerified: user.email_verified,
        hasCustomerAccount: !!customerRecord,
        hasTaskerAccount: false
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check upgrade eligibility error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
