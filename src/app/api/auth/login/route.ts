import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  userType: 'customer' | 'tasker';
  password: string;
  createdAt: string;
  isVerified: boolean;
  profile: {
    bio: string;
    skills: string[];
    rating: number;
    completedTasks: number;
    profileImage: string | null;
  };
}

function readUsers(): User[] {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Read users from file
    const users = readUsers();

    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password (in production, this should use proper password hashing)
    if (user.password !== password) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
