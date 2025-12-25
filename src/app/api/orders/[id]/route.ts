import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const { data: orderData, error: orderError } = await supabaseServer
      .from('orders')
      .select(`
        *,
        customer:customers!orders_customer_id_fkey (
          id,
          user:users!customers_user_id_fkey (
            id,
            first_name,
            last_name,
            profile_image_url,
            email,
            phone
          )
        ),
        seller:taskers!orders_seller_id_fkey (
          id,
          level_code,
          rating,
          response_time_minutes,
          user:users!taskers_user_id_fkey (
            id,
            first_name,
            last_name,
            profile_image_url,
            email,
            phone
          )
        ),
        gig:gigs (
          id,
          title,
          slug,
          images,
          category
        ),
        package:gig_packages (
          id,
          tier,
          name,
          description,
          price,
          delivery_days,
          revisions,
          features
        ),
        deliveries:order_deliveries (
          id,
          message,
          attachments,
          delivered_at
        ),
        revisions:order_revisions (
          id,
          requested_by,
          message,
          status,
          created_at,
          requester:users!order_revisions_requested_by_fkey (
            first_name,
            last_name
          )
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

    // Format response
    const formattedOrder = {
      ...orderData,
      customerName: `${orderData.customer?.user?.first_name || ''} ${orderData.customer?.user?.last_name || ''}`.trim(),
      customerAvatar: orderData.customer?.user?.profile_image_url,
      customerEmail: orderData.customer?.user?.email,
      customerPhone: orderData.customer?.user?.phone,
      sellerName: `${orderData.seller?.user?.first_name || ''} ${orderData.seller?.user?.last_name || ''}`.trim(),
      sellerAvatar: orderData.seller?.user?.profile_image_url,
      sellerEmail: orderData.seller?.user?.email,
      sellerPhone: orderData.seller?.user?.phone,
      sellerLevel: orderData.seller?.level_code,
      sellerRating: orderData.seller?.rating,
      gigTitle: orderData.gig?.title,
      gigSlug: orderData.gig?.slug,
      gigImage: orderData.gig?.images?.[0],
      gigCategory: orderData.gig?.category,
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { userId, status, cancellationReason } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { message: 'Required fields missing' },
        { status: 400 }
      );
    }

    // Get order and verify access
    const { data: orderData, error: orderError } = await supabaseServer
      .from('orders')
      .select(`
        *,
        customer:customers!orders_customer_id_fkey (
          user_id
        ),
        seller:taskers!orders_seller_id_fkey (
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

    // Verify user is either customer or seller
    if (orderData.customer.user_id !== userId && orderData.seller.user_id !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['in_progress', 'cancelled'],
      in_progress: ['delivered', 'cancelled'],
      delivered: ['revision_requested', 'completed'],
      revision_requested: ['in_progress'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[orderData.status]?.includes(status)) {
      return NextResponse.json(
        { message: `Invalid status transition from ${orderData.status} to ${status}` },
        { status: 400 }
      );
    }

    // Update order
    const updateData: any = { status };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }
    }

    if (status === 'in_progress' && orderData.status === 'pending') {
      // Seller accepted the order
      updateData.status = 'in_progress';
    }

    const { data: updatedOrder, error: updateError } = await supabaseServer
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    // Create notifications
    const notificationUserId = orderData.customer.user_id === userId 
      ? orderData.seller.user_id 
      : orderData.customer.user_id;

    let notificationTitle = '';
    let notificationMessage = '';

    switch (status) {
      case 'in_progress':
        notificationTitle = 'Order Started';
        notificationMessage = `The seller has started working on order ${orderData.order_number}`;
        break;
      case 'delivered':
        notificationTitle = 'Order Delivered';
        notificationMessage = `Your order ${orderData.order_number} has been delivered`;
        break;
      case 'completed':
        notificationTitle = 'Order Completed';
        notificationMessage = `Order ${orderData.order_number} has been marked as completed`;
        
        // Update seller stats
        await supabaseServer
          .from('taskers')
          .update({ 
            completed_tasks: (await supabaseServer
              .from('taskers')
              .select('completed_tasks')
              .eq('id', orderData.seller_id)
              .single()
            ).data?.completed_tasks + 1 || 1
          })
          .eq('id', orderData.seller_id);
        break;
      case 'cancelled':
        notificationTitle = 'Order Cancelled';
        notificationMessage = `Order ${orderData.order_number} has been cancelled`;
        break;
    }

    if (notificationTitle) {
      await supabaseServer
        .from('notifications')
        .insert({
          user_id: notificationUserId,
          notification_type: 'task',
          title: notificationTitle,
          message: notificationMessage,
          data: {
            order_id: orderId,
            order_number: orderData.order_number,
          },
        });
    }

    return NextResponse.json({
      message: 'Order updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { message: 'Failed to update order' },
      { status: 500 }
    );
  }
}

