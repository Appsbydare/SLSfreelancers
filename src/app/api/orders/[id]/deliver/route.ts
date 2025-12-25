import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// POST - Seller delivers work
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { userId, message, attachments } = body;

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID required' },
        { status: 400 }
      );
    }

    // Get order and verify seller
    const { data: orderData, error: orderError } = await supabaseServer
      .from('orders')
      .select(`
        *,
        seller:taskers!orders_seller_id_fkey (
          user_id
        ),
        customer:customers!orders_customer_id_fkey (
          user_id
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

    // Verify user is the seller
    if (orderData.seller.user_id !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized. Only the seller can deliver work.' },
        { status: 403 }
      );
    }

    // Check order status
    if (orderData.status !== 'in_progress' && orderData.status !== 'revision_requested') {
      return NextResponse.json(
        { message: `Cannot deliver work for order with status: ${orderData.status}` },
        { status: 400 }
      );
    }

    // Create delivery record
    const { data: deliveryData, error: deliveryError } = await supabaseServer
      .from('order_deliveries')
      .insert({
        order_id: orderId,
        message: message || null,
        attachments: attachments || [],
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (deliveryError) {
      console.error('Error creating delivery:', deliveryError);
      throw deliveryError;
    }

    // Update order status to delivered
    const { error: updateError } = await supabaseServer
      .from('orders')
      .update({ 
        status: 'delivered',
        delivery_date: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    // Create notification for customer
    await supabaseServer
      .from('notifications')
      .insert({
        user_id: orderData.customer.user_id,
        notification_type: 'task',
        title: 'Work Delivered',
        message: `Your order ${orderData.order_number} has been delivered. Please review and approve.`,
        data: {
          order_id: orderId,
          order_number: orderData.order_number,
          delivery_id: deliveryData.id,
        },
      });

    return NextResponse.json({
      message: 'Work delivered successfully',
      delivery: deliveryData,
    });
  } catch (error) {
    console.error('Deliver work error:', error);
    return NextResponse.json(
      { message: 'Failed to deliver work' },
      { status: 500 }
    );
  }
}

