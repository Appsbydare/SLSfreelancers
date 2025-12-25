import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      hasInsurance,
      insuranceProvider,
      insurancePolicyNumber,
      emergencyContact,
      agreements,
    } = body;

    if (!userId || !emergencyContact || !agreements) {
      return NextResponse.json(
        { message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Update tasker with safety information
    const { data: taskerData, error: taskerError } = await supabaseServer
      .from('taskers')
      .update({
        has_insurance: hasInsurance,
        insurance_details: hasInsurance ? {
          provider: insuranceProvider,
          policyNumber: insurancePolicyNumber,
        } : null,
        emergency_contact: emergencyContact,
        agreements: agreements,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (taskerError) {
      console.error('Error updating tasker:', taskerError);
      throw taskerError;
    }

    // Update user status
    const { error: userError } = await supabaseServer
      .from('users')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error updating user:', userError);
    }

    return NextResponse.json(
      {
        message: 'Safety information saved successfully',
        tasker: taskerData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Safety info save error:', error);
    return NextResponse.json(
      { message: 'Failed to save safety information' },
      { status: 500 }
    );
  }
}

