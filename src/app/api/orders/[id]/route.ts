import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendOrderEventCard } from '@/app/actions/messages';
import { recalculateSellerLevel } from '@/utils/sellerLevelLogic';

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
          category,
          requirements:gig_requirements(id, question, answer_type, options, is_required, sort_order)
        ),
        package:gig_packages!orders_package_id_fkey (
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

    // Determine who triggered the action and who receives the notification
    const isSeller = orderData.seller.user_id === userId;
    const customerUserId = orderData.customer.user_id;
    const sellerUserId = orderData.seller.user_id;

    // Build per-status notifications — may notify one or both parties
    interface NotificationPayload {
      user_id: string;
      notification_type: string;
      title: string;
      message: string;
      data: Record<string, any>;
    }
    const notifications: NotificationPayload[] = [];
    const baseData = { order_id: orderId, order_number: orderData.order_number };

    switch (status) {
      case 'in_progress':
        // Seller accepted the order — notify the customer
        notifications.push({
          user_id: customerUserId,
          notification_type: 'order',
          title: '🎉 Your order has been accepted!',
          message: `Great news! The seller has accepted your order #${orderData.order_number} and is now working on it. You will be notified when the work is delivered.`,
          data: { ...baseData, action: 'accepted' },
        });
        break;

      case 'delivered':
        // Seller delivered — notify the customer
        notifications.push({
          user_id: customerUserId,
          notification_type: 'order',
          title: '📦 Work delivered — review now',
          message: `Your order #${orderData.order_number} has been delivered. Please review the work and either approve it or request a revision.`,
          data: { ...baseData, action: 'delivered' },
        });
        break;

      case 'completed':
        // Customer approved — notify the seller
        notifications.push({
          user_id: sellerUserId,
          notification_type: 'order',
          title: '✅ Order completed & payment released',
          message: `Order #${orderData.order_number} has been approved by the customer. Your earnings have been released.`,
          data: { ...baseData, action: 'completed' },
        });
        // Update seller completed_tasks count
        try {
          const { error: rpcError } = await supabaseServer.rpc('increment_completed_tasks', { tasker_id: orderData.seller_id });
          if (rpcError) throw rpcError;
        } catch {
          // fallback if RPC doesn't exist
          const { data: t } = await supabaseServer.from('taskers').select('completed_tasks').eq('id', orderData.seller_id).single();
          await supabaseServer.from('taskers').update({ completed_tasks: (t?.completed_tasks || 0) + 1 }).eq('id', orderData.seller_id);
        }
        // Update on_time_delivery_rate based on completed orders for this seller
        try {
          const { data: sellerOrders } = await supabaseServer
            .from('orders')
            .select('delivery_date, deliveries:order_deliveries(delivered_at)')
            .eq('seller_id', orderData.seller_id)
            .eq('status', 'completed');

          if (sellerOrders && sellerOrders.length > 0) {
            let onTimeCount = 0;
            for (const o of sellerOrders) {
              const deliveries = (o as any).deliveries as { delivered_at: string }[] | null;
              const firstDelivery = deliveries && deliveries.length > 0
                ? deliveries.sort((a, b) => new Date(a.delivered_at).getTime() - new Date(b.delivered_at).getTime())[0]
                : null;
              if (firstDelivery && o.delivery_date) {
                const deliveredAt = new Date(firstDelivery.delivered_at);
                const deadline = new Date(o.delivery_date);
                if (deliveredAt <= deadline) onTimeCount++;
              }
            }
            const onTimeRate = Math.round((onTimeCount / sellerOrders.length) * 100);
            await supabaseServer
              .from('taskers')
              .update({ on_time_delivery_rate: onTimeRate })
              .eq('id', orderData.seller_id);
          }
        } catch (err) {
          console.error('Failed to update on_time_delivery_rate:', err);
        }
        // Recalculate seller level now that completed_tasks and on_time_delivery_rate have changed
        await recalculateSellerLevel(supabaseServer, { taskerId: orderData.seller_id });
        break;

      case 'cancelled':
        // Notify the other party
        notifications.push({
          user_id: isSeller ? customerUserId : sellerUserId,
          notification_type: 'order',
          title: '❌ Order cancelled',
          message: `Order #${orderData.order_number} has been cancelled${cancellationReason ? `: ${cancellationReason}` : '.'}`,
          data: { ...baseData, action: 'cancelled' },
        });
        // Increment seller's cancelled_tasks when seller cancels
        if (isSeller) {
          const { data: t } = await supabaseServer.from('taskers')
            .select('cancelled_tasks').eq('id', orderData.seller_id).single();
          await supabaseServer.from('taskers')
            .update({ cancelled_tasks: (t?.cancelled_tasks || 0) + 1 })
            .eq('id', orderData.seller_id);
        }
        break;
    }

    if (notifications.length > 0) {
      await supabaseServer.from('notifications').insert(notifications);
    }

    // Send order event card into the gig chat if a conversation already exists
    const cardPayload = {
      order_id: orderId,
      order_number: orderData.order_number,
      gig_id: orderData.gig_id,
      package_tier: orderData.package_tier,
      total_amount: Number(orderData.total_amount),
      seller_earnings: Number(orderData.seller_earnings),
      platform_fee: Number(orderData.platform_fee),
      delivery_date: orderData.delivery_date,
    };

    if (status === 'in_progress') {
      // Seller accepted → send card from seller to customer
      await sendOrderEventCard({
        senderUserId: sellerUserId,
        recipientUserId: customerUserId,
        gigId: orderData.gig_id,
        event: 'order_accepted',
        payload: cardPayload,
      });
    } else if (status === 'completed') {
      // Customer approved → send card from customer to seller
      await sendOrderEventCard({
        senderUserId: customerUserId,
        recipientUserId: sellerUserId,
        gigId: orderData.gig_id,
        event: 'order_completed',
        payload: cardPayload,
      });
    } else if (status === 'cancelled') {
      // Cancelled — send from whoever cancelled to the other party
      await sendOrderEventCard({
        senderUserId: isSeller ? sellerUserId : customerUserId,
        recipientUserId: isSeller ? customerUserId : sellerUserId,
        gigId: orderData.gig_id,
        event: 'order_cancelled',
        payload: { ...cardPayload, reason: cancellationReason || null },
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

