import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth Handler
 * 
 * This is a basic implementation. For production, you should:
 * 1. Use next-auth or a proper OAuth library
 * 2. Store Google OAuth credentials in environment variables
 * 3. Implement proper token validation and user creation
 * 
 * To set up Google OAuth:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable Google+ API
 * 4. Create OAuth 2.0 credentials
 * 5. Add authorized redirect URIs
 * 6. Store CLIENT_ID and CLIENT_SECRET in .env.local
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userType = searchParams.get('userType') || 'customer';
  
  // Get Google OAuth credentials from environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/google/callback`;
  
  if (!clientId) {
    // If Google OAuth is not configured, redirect to signup with a message
    return NextResponse.redirect(
      new URL(`/signup?error=google_not_configured&userType=${userType}`, request.url)
    );
  }

  // Google OAuth URL parameters
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: JSON.stringify({ userType }), // Pass userType through OAuth flow
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  return NextResponse.redirect(googleAuthUrl);
}

