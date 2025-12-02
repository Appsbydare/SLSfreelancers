import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - Fetch offers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const taskerId = searchParams.get('taskerId');
    const status = searchParams.get('status');

    let query = supabaseServer
      .from('offers')
      .select(`
        *,
        task:tasks (*),
        tasker:taskers!offers_tasker_id_fkey (
          *,
          user:users!taskers_user_id_fkey (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    if (taskerId) {
      query = query.eq('tasker_id', taskerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching offers:', error);
      throw error;
    }

    return NextResponse.json({ offers: data }, { status: 200 });
  } catch (error) {
    console.error('Fetch offers error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

// POST - Create a new offer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, taskerId, offerAmount, message, estimatedDuration } = body;

    if (!taskId || !taskerId || !offerAmount) {
      return NextResponse.json(
        { message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Get tasker data
    const { data: taskerData, error: taskerError } = await supabaseServer
      .from('taskers')
      .select('id')
      .eq('user_id', taskerId)
      .single();

    if (taskerError || !taskerData) {
      return NextResponse.json(
        { message: 'Tasker not found' },
        { status: 404 }
      );
    }

    // Create offer
    const { data: offerData, error: offerError } = await supabaseServer
      .from('offers')
      .insert({
        task_id: taskId,
        tasker_id: taskerData.id,
        offer_amount: offerAmount,
        message,
        estimated_duration: estimatedDuration,
        status: 'pending',
      })
      .select()
      .single();

    if (offerError) {
      console.error('Error creating offer:', offerError);
      throw offerError;
    }

    return NextResponse.json(
      {
        message: 'Offer submitted successfully',
        offer: offerData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create offer error:', error);
    return NextResponse.json(
      { message: 'Failed to create offer' },
      { status: 500 }
    );
  }
}

// PUT - Update offer status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerId, status } = body;

    if (!offerId || !status) {
      return NextResponse.json(
        { message: 'Offer ID and status are required' },
        { status: 400 }
      );
    }

    const { data: offerData, error: offerError } = await supabaseServer
      .from('offers')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId)
      .select()
      .single();

    if (offerError) {
      console.error('Error updating offer:', offerError);
      throw offerError;
    }

    // If offer is accepted, update task status and assign tasker
    if (status === 'accepted') {
      await supabaseServer
        .from('tasks')
        .update({
          status: 'assigned',
          assigned_tasker_id: offerData.tasker_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offerData.task_id);

      // Reject other pending offers for this task
      await supabaseServer
        .from('offers')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', offerData.task_id)
        .neq('id', offerId)
        .eq('status', 'pending');
    }

    return NextResponse.json(
      {
        message: 'Offer updated successfully',
        offer: offerData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update offer error:', error);
    return NextResponse.json(
      { message: 'Failed to update offer' },
      { status: 500 }
    );
  }
}

