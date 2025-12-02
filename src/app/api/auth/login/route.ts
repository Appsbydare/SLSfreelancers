import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseServer } from '@/lib/supabase-server';
import {
  USER_BASE_SELECT,
  buildClientUser,
  fetchTaskerProfile,
  DbUserRow,
} from '@/lib/user-service';

type DbUserWithPassword = DbUserRow & { password_hash: string };

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const { data: userRow, error } = await supabaseServer
      .from('users')
      .select(`${USER_BASE_SELECT}, password_hash`)
      .ilike('email', sanitizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!userRow) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userWithPassword = userRow as DbUserWithPassword;
    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const taskerProfile =
      userWithPassword.user_type === 'tasker'
        ? await fetchTaskerProfile(userWithPassword.id)
        : null;

    const clientUser = buildClientUser(userWithPassword, taskerProfile);

    return NextResponse.json({
      message: 'Login successful',
      user: clientUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
