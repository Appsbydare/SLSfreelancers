import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth Callback Handler
 * 
 * This handles the callback from Google OAuth
 * In production, you should:
 * 1. Exchange the authorization code for tokens
 * 2. Validate the tokens
 * 3. Get user info from Google
 * 4. Create or update user in your database
 * 5. Set up session/auth
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/signup?error=oauth_cancelled`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/signup?error=oauth_failed`, request.url)
    );
  }

  try {
    // Parse state to get userType
    let userType = 'customer';
    if (state) {
      try {
        const stateData = JSON.parse(state);
        userType = stateData.userType || 'customer';
      } catch (e) {
        // If state parsing fails, use default
      }
    }

    // Exchange code for tokens (simplified - in production use proper OAuth flow)
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      // If not configured, show a message that Google Sign In needs to be set up
      return NextResponse.redirect(
        new URL(`/signup?error=google_not_configured&userType=${userType}`, request.url)
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const googleUser = await userInfoResponse.json();

    // Create or update user in your database
    // For now, we'll redirect to signup with pre-filled data
    // In production, you should create the user here and log them in
    
    const signupParams = new URLSearchParams({
      google: 'true',
      email: googleUser.email || '',
      firstName: googleUser.given_name || '',
      lastName: googleUser.family_name || '',
      picture: googleUser.picture || '',
      userType: userType,
    });

    // Redirect to signup page with Google data
    // In production, you should create the user and redirect to dashboard
    return NextResponse.redirect(
      new URL(`/signup?${signupParams.toString()}`, request.url)
    );

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/signup?error=oauth_failed`, request.url)
    );
  }
}

