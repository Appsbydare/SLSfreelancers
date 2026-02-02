'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getOrders(userId: string, userType: 'customer' | 'tasker') {
    let query = supabaseServer
        .from('orders')
        .select(`
            *,
            gig:gigs(title, images, slug),
            seller:taskers(id, user:users(first_name, last_name)),
            customer:customers(id, user:users(first_name, last_name))
        `)
        .order('created_at', { ascending: false });

    // Filter by relation
    // Since we use service role (supabaseServer), we MUST filter manually or by relation query
    if (userType === 'tasker') {
        // Find tasker id
        const { data: tasker } = await supabaseServer.from('taskers').select('id').eq('user_id', userId).single();
        if (tasker) {
            query = query.eq('seller_id', tasker.id);
        } else {
            return []; // Not a tasker?
        }
    } else {
        const { data: customer } = await supabaseServer.from('customers').select('id').eq('user_id', userId).single();
        if (customer) {
            query = query.eq('customer_id', customer.id);
        } else {
            return [];
        }
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching orders:', error);
        throw new Error('Failed to fetch orders');
    }

    // transform data slightly if needed, or return as is
    return data;
}

export async function getOrder(orderId: string) {
    const { data, error } = await supabaseServer
        .from('orders')
        .select(`
            *,
            gig:gigs(title, images, slug),
            seller:taskers(id, level_code, user:users(first_name, last_name)),
            customer:customers(id, user:users(first_name, last_name)),
            deliveries:order_deliveries(*),
            revisions:order_revisions(*)
        `)
        .eq('id', orderId)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        return null;
    }
    return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
    const { error } = await supabaseServer
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) {
        throw new Error(error.message);
    }
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
}

export async function deliverOrder(orderId: string, message: string, attachments: string[]) {
    // 1. Create delivery record
    const { error: deliveryError } = await supabaseServer
        .from('order_deliveries')
        .insert({
            order_id: orderId,
            message,
            attachments
        });

    if (deliveryError) throw new Error(deliveryError.message);

    // 2. Update order status to 'delivered'
    const { error: updateError } = await supabaseServer
        .from('orders')
        .update({ status: 'delivered', delivery_date: new Date().toISOString() }) // Should we update delivery_date? Usually delivery_date is deadline. delivered_at is in order_deliveries. 
        // Order status 'delivered' is enough.
        .eq('id', orderId);

    if (updateError) throw new Error(updateError.message);

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
}

export async function requestRevision(orderId: string, userId: string, message: string) {
    // Create revision record
    const { error } = await supabaseServer
        .from('order_revisions')
        .insert({
            order_id: orderId,
            requested_by: userId, // User public ID
            message,
            status: 'pending'
        });

    if (error) throw new Error(error.message);

    // Update order status
    await supabaseServer
        .from('orders')
        .update({ status: 'revision_requested' })
        .eq('id', orderId);

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
}
