import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseServer } from '@/lib/supabase-server';
import {
  USER_BASE_SELECT,
  buildClientUser,
  fetchTaskerProfile,
  fetchUserWithProfileByEmail,
  TaskerProfileRow,
  DbUserRow,
  UserType,
} from '@/lib/user-service';

interface CreateUserPayload {
  firstName: string;
  lastName: string;
  callingName?: string;
  email: string;
  phone: string;
  location?: string;
  city?: string;
  district?: string;
  preferredLanguage?: string;
  userType: UserType;
  password: string;
  bio?: string;
  skills?: string[] | string;
}

function normalizeSkills(skills?: string[] | string): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) {
    return skills.map(skill => skill.trim()).filter(Boolean);
  }
  return skills
    .split(',')
    .map(skill => skill.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const payload: CreateUserPayload = await request.json();

    const requiredFields: Array<keyof CreateUserPayload> = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'userType',
      'password',
    ];

    for (const field of requiredFields) {
      if (!payload[field] || (typeof payload[field] === 'string' && !payload[field]?.trim())) {
        return NextResponse.json({ message: `${field} is required` }, { status: 400 });
      }
    }

    if (payload.password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const sanitizedEmail = payload.email.trim().toLowerCase();

    const { data: existingUser, error: existingUserError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (existingUserError) {
      throw new Error(existingUserError.message);
    }

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email address is already registered' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    const userInsert = {
      first_name: payload.firstName.trim(),
      last_name: payload.lastName.trim(),
      calling_name: payload.callingName?.trim() || null,
      email: sanitizedEmail,
      phone: payload.phone.trim(),
      location: payload.location?.trim() || null,
      city: payload.city?.trim() || payload.location?.trim() || null,
      district: payload.district?.trim() || null,
      preferred_language: payload.preferredLanguage || 'en',
      user_type: payload.userType,
      password_hash: passwordHash,
    };

    const { data: insertedUser, error: insertError } = await supabaseServer
      .from('users')
      .insert(userInsert)
      .select(USER_BASE_SELECT)
      .single();

    if (insertError || !insertedUser) {
      throw new Error(insertError?.message || 'Failed to create user');
    }

    if (payload.userType === 'customer') {
      const { error: customerError } = await supabaseServer.from('customers').insert({
        user_id: insertedUser.id,
        address_line1: payload.location?.trim() || null,
      });

      if (customerError) {
        throw new Error(customerError.message);
      }
    } else if (payload.userType === 'tasker') {
      const { error: taskerError } = await supabaseServer.from('taskers').insert({
        user_id: insertedUser.id,
        bio: payload.bio?.trim() || '',
        skills: normalizeSkills(payload.skills),
      });

      if (taskerError) {
        throw new Error(taskerError.message);
      }
    }

    const taskerProfile =
      payload.userType === 'tasker' ? await fetchTaskerProfile(insertedUser.id) : null;

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: await buildClientUser(insertedUser, taskerProfile),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (email) {
      const user = await fetchUserWithProfileByEmail(email.toLowerCase());
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(user);
    }

    const { data, error } = await supabaseServer
      .from('users')
      .select(`${USER_BASE_SELECT}, tasker:taskers!taskers_user_id_fkey(bio, skills, rating, completed_tasks, profile_image_url)`);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data || []) as Array<
      DbUserRow & { tasker?: TaskerProfileRow | TaskerProfileRow[] | null }
    >;

    const users = await Promise.all(
      rows.map(async (user) => {
        const relation = user.tasker;
        const taskerProfile = Array.isArray(relation) ? relation[0] : relation;
        return await buildClientUser(user, taskerProfile);
      })
    );

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
