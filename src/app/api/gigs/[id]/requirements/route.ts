import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - Get requirements for a gig
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gigId } = await params;

    const { data, error } = await supabaseServer
      .from('gig_requirements')
      .select('*')
      .eq('gig_id', gigId)
      .order('sort_order');

    if (error) {
      console.error('Error fetching requirements:', error);
      throw error;
    }

    return NextResponse.json({ requirements: data || [] });
  } catch (error) {
    console.error('Get requirements error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch requirements' },
      { status: 500 }
    );
  }
}

// POST - Create/Update requirements (batch)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gigId } = await params;
    const body = await request.json();
    const { userId, requirements } = body;

    if (!userId || !requirements || !Array.isArray(requirements)) {
      return NextResponse.json(
        { message: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Verify gig ownership
    const { data: gigData, error: gigError } = await supabaseServer
      .from('gigs')
      .select('seller_id')
      .eq('id', gigId)
      .single();

    if (gigError || !gigData) {
      return NextResponse.json(
        { message: 'Gig not found' },
        { status: 404 }
      );
    }

    // Get tasker to verify user_id
    const { data: taskerData, error: taskerError } = await supabaseServer
      .from('taskers')
      .select('user_id')
      .eq('id', gigData.seller_id)
      .single();

    if (taskerError || !taskerData) {
      return NextResponse.json(
        { message: 'Seller not found' },
        { status: 404 }
      );
    }

    if (taskerData.user_id !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete existing requirements
    await supabaseServer
      .from('gig_requirements')
      .delete()
      .eq('gig_id', gigId);

    // Insert new requirements
    const requirementsData = requirements.map((req: any, index: number) => ({
      gig_id: gigId,
      question: req.question,
      answer_type: req.answerType || 'text',
      options: req.options || null,
      is_required: req.isRequired !== false,
      sort_order: req.sortOrder || index,
    }));

    const { data: insertedRequirements, error: insertError } = await supabaseServer
      .from('gig_requirements')
      .insert(requirementsData)
      .select();

    if (insertError) {
      console.error('Error creating requirements:', insertError);
      throw insertError;
    }

    return NextResponse.json({
      message: 'Requirements saved successfully',
      requirements: insertedRequirements,
    });
  } catch (error) {
    console.error('Create requirements error:', error);
    return NextResponse.json(
      { message: 'Failed to save requirements' },
      { status: 500 }
    );
  }
}

