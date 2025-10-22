import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

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

function writeUsers(users: User[]): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
    throw new Error('Failed to save user data');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData: Omit<User, 'id' | 'createdAt'> = await request.json();

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'userType', 'password'];
    for (const field of requiredFields) {
      if (!userData[field as keyof typeof userData]) {
        return NextResponse.json(
          { message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Read existing users
    const users = readUsers();

    // Check if email already exists
    const existingUser = users.find(user => user.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email address is already registered' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString(),
    };

    // Add user to the list
    users.push(newUser);

    // Save to file
    writeUsers(users);

    // Return success response (without password)
    const { password, ...userWithoutPassword } = newUser;
    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userWithoutPassword 
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

    const users = readUsers();

    if (email) {
      // Find user by email
      const user = users.find(user => user.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword);
    }

    // Return all users (without passwords)
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    return NextResponse.json(usersWithoutPasswords);

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
