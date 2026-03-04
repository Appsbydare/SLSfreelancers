import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendOrderEventCard } from '@/app/actions/messages';

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

    // Notification for customer
    await supabaseServer.from('notifications').insert({
      user_id: orderData.customer.user_id,
      notification_type: 'order',
      title: '📦 Work delivered — review now',
      message: `Your order ${orderData.order_number} has been delivered. Please review and approve or request a revision.`,
      data: { order_id: orderId, order_number: orderData.order_number, action: 'delivered', delivery_id: deliveryData.id },
    });

    // Send order_delivered card into existing gig chat
    await sendOrderEventCard({
      senderUserId: orderData.seller.user_id,
      recipientUserId: orderData.customer.user_id,
      gigId: orderData.gig_id,
      event: 'order_delivered',
      payload: {
        order_id: orderId,
        order_number: orderData.order_number,
        gig_id: orderData.gig_id,
        package_tier: orderData.package_tier,
        total_amount: Number(orderData.total_amount),
        seller_earnings: Number(orderData.seller_earnings),
        platform_fee: Number(orderData.platform_fee),
        delivery_id: deliveryData.id,
        delivery_message: message || null,
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

