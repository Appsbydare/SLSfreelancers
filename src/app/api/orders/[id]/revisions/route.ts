import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - Get revision requests for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const { data, error } = await supabaseServer
      .from('order_revisions')
      .select(`
        *,
        requester:users!order_revisions_requested_by_fkey (
          first_name,
          last_name,
          profile_image_url
        )
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching revisions:', error);
      throw error;
    }

    return NextResponse.json({ revisions: data || [] });
  } catch (error) {
    console.error('Get revisions error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch revisions' },
      { status: 500 }
    );
  }
}

// POST - Request revision
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { message: 'User ID and message required' },
        { status: 400 }
      );
    }

    // Get order details
    const { data: orderData, error: orderError } = await supabaseServer
      .from('orders')
      .select(`
        *,
        customer:customers!orders_customer_id_fkey (
          user_id
        ),
        seller:taskers!orders_seller_id_fkey (
          user_id
        ),
        package:gig_packages (
          revisions
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify user is the customer
    if (orderData.customer.user_id !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized. Only the customer can request revisions.' },
        { status: 403 }
      );
    }

    // Check order status
    if (orderData.status !== 'delivered') {
      return NextResponse.json(
        { message: 'Revisions can only be requested for delivered orders' },
        { status: 400 }
      );
    }

    // Check revision limit
    const { data: existingRevisions } = await supabaseServer
      .from('order_revisions')
      .select('id')
      .eq('order_id', orderId)
      .eq('status', 'accepted');

    const usedRevisions = existingRevisions?.length || 0;
    const allowedRevisions = orderData.package?.revisions;

    if (allowedRevisions !== null && usedRevisions >= allowedRevisions) {
      return NextResponse.json(
        { message: `Revision limit reached. This package includes ${allowedRevisions} revision(s).` },
        { status: 400 }
      );
    }

    // Create revision request
    const { data: revisionData, error: revisionError } = await supabaseServer
      .from('order_revisions')
      .insert({
        order_id: orderId,
        requested_by: userId,
        message: message.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (revisionError) {
      console.error('Error creating revision:', revisionError);
      throw revisionError;
    }

    // Update order status
    await supabaseServer
      .from('orders')
      .update({ status: 'revision_requested' })
      .eq('id', orderId);

    // Create notification for seller
    await supabaseServer
      .from('notifications')
      .insert({
        user_id: orderData.seller.user_id,
        notification_type: 'task',
        title: 'Revision Requested',
        message: `The customer has requested a revision for order ${orderData.order_number}`,
        data: {
          order_id: orderId,
          order_number: orderData.order_number,
          revision_id: revisionData.id,
        },
      });

    return NextResponse.json({
      message: 'Revision requested successfully',
      revision: revisionData,
    });
  } catch (error) {
    console.error('Request revision error:', error);
    return NextResponse.json(
      { message: 'Failed to request revision' },
      { status: 500 }
    );
  }
}

