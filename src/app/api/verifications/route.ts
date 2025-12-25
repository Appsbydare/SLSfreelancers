import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, verifications } = body;

    if (!userId || !verifications || !Array.isArray(verifications)) {
      return NextResponse.json(
        { message: 'User ID and verifications array are required' },
        { status: 400 }
      );
    }

    // Insert verification records
    const verificationPromises = verifications.map(async (verification: any) => {
      const { type, documents } = verification;

      // Insert each document as a separate verification record
      const documentPromises = documents.map(async (documentUrl: string) => {
        const { data, error } = await supabaseServer
          .from('verifications')
          .insert({
            user_id: userId,
            verification_type: type,
            document_url: documentUrl,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('Error inserting verification:', error);
          throw error;
        }

        return data;
      });

      return Promise.all(documentPromises);
    });

    const results = await Promise.all(verificationPromises);

    // Update user's verification status
    const { error: updateError } = await supabaseServer
      .from('users')
      .update({
        verification_status: {
          identity_submitted: true,
          identity_verified: false,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user verification status:', updateError);
    }

    return NextResponse.json(
      {
        message: 'Verification documents submitted successfully',
        verifications: results.flat(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Verification submission error:', error);
    return NextResponse.json(
      { message: 'Failed to submit verification documents' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all verifications for the user
    const { data, error } = await supabaseServer
      .from('verifications')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching verifications:', error);
      throw error;
    }

    return NextResponse.json({ verifications: data }, { status: 200 });
  } catch (error) {
    console.error('Fetch verifications error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}

