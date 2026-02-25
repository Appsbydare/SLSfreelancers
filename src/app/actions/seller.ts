'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getSellerDashboardData(userId: string) {
    const supabase = supabaseServer;

    // 1. Get Tasker Profile
    const { data: tasker, error: taskerError } = await supabase
        .from('taskers')
        .select(`
      *,
      user:users(first_name, last_name, profile_image_url, is_verified)
    `)
        .eq('user_id', userId)
        .single();

    if (taskerError) {
        console.error('Error fetching tasker profile:', taskerError);
        return null;
    }

    // 2. Get Active Gigs Count
    const { count: activeGigsCount, error: gigsError } = await supabase
        .from('gigs')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', tasker.id)
        .eq('status', 'active');

    // 3. Get Active Orders Count (pending, in_progress, delivered)
    const { count: activeOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', tasker.id)
        .in('status', ['pending', 'in_progress', 'delivered']);

    // 4. Calculate Total Earnings (completed orders)
    const { data: completedOrders } = await supabase
        .from('orders')
        .select('seller_earnings')
        .eq('seller_id', tasker.id)
        .eq('status', 'completed');

    const totalEarnings = completedOrders?.reduce((sum: number, order: any) => sum + (Number(order.seller_earnings) || 0), 0) || 0;

    // 5. Calculate Pending Earnings (in_progress, delivered)
    const { data: pendingOrders } = await supabase
        .from('orders')
        .select('seller_earnings')
        .eq('seller_id', tasker.id)
        .in('status', ['in_progress', 'delivered']);

    const pendingEarnings = pendingOrders?.reduce((sum: number, order: any) => sum + (Number(order.seller_earnings) || 0), 0) || 0;

    // 6. Total Orders Count
    const { count: totalOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', tasker.id);

    // 7. Get Verification Status
    const { data: verifications } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

    // 8. Recent orders (for activity feed)
    const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
            id, order_number, status, total_amount, seller_earnings, created_at, updated_at,
            gig:gigs(title)
        `)
        .eq('seller_id', tasker.id)
        .order('updated_at', { ascending: false })
        .limit(6);

    // 9. Recent notifications
    const { data: recentNotifs } = await supabase
        .from('notifications')
        .select('id, title, message, notification_type, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6);

    // 10. Recent bids placed by this seller on tasks
    const { data: recentBids } = await supabase
        .from('offers')
        .select('id, proposed_price, status, created_at, task:tasks(id, title)')
        .eq('tasker_id', tasker.id)
        .order('created_at', { ascending: false })
        .limit(5);

    return {
        tasker,
        verifications: verifications || [],
        recentOrders: recentOrders || [],
        recentNotifs: recentNotifs || [],
        recentBids: recentBids || [],
        stats: {
            activeGigs: activeGigsCount || 0,
            activeOrders: activeOrdersCount || 0,
            completedOrders: completedOrders?.length || 0,
            totalOrders: totalOrdersCount || 0,
            totalEarnings,
            pendingEarnings
        }
    };
}

export async function getSellerGigs(userId: string) {
    const supabase = supabaseServer;

    // Get tasker ID first
    const { data: tasker } = await supabase
        .from('taskers')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (!tasker) return [];

    const { data: gigs, error } = await supabase
        .from('gigs')
        .select(`
            *,
            packages:gig_packages(price)
        `)
        .eq('seller_id', tasker.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching gigs:', error);
        return [];
    }

    // Calculate starting price for each gig
    const gigsWithPrice = gigs.map((gig: any) => {
        let startingPrice = 0;
        if (gig.packages && gig.packages.length > 0) {
            const prices = gig.packages.map((p: any) => Number(p.price));
            const minPrice = Math.min(...prices);
            startingPrice = isFinite(minPrice) ? minPrice : 0;
        }
        return {
            ...gig,
            startingPrice
        };
    });

    return gigsWithPrice;
}

export async function pauseGig(gigId: string, userId: string) {
    const supabase = supabaseServer;
    // Verify ownership
    const { data: gig } = await supabase.from('gigs').select('seller_id').eq('id', gigId).single();
    const { data: tasker } = await supabase.from('taskers').select('id').eq('user_id', userId).single();

    if (!gig || !tasker || gig.seller_id !== tasker.id) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('gigs')
        .update({ status: 'paused' })
        .eq('id', gigId);

    if (error) throw error;
    revalidatePath('/seller/dashboard/gigs');
}

export async function activateGig(gigId: string, userId: string) {
    const supabase = supabaseServer;
    // Verify ownership
    const { data: gig } = await supabase.from('gigs').select('seller_id').eq('id', gigId).single();
    const { data: tasker } = await supabase.from('taskers').select('id').eq('user_id', userId).single();

    if (!gig || !tasker || gig.seller_id !== tasker.id) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('gigs')
        .update({ status: 'active' })
        .eq('id', gigId);

    if (error) throw error;
    revalidatePath('/seller/dashboard/gigs');
}

export async function deleteGig(gigId: string, userId: string) {
    const supabase = supabaseServer;
    // Verify ownership
    const { data: gig } = await supabase.from('gigs').select('seller_id').eq('id', gigId).single();
    const { data: tasker } = await supabase.from('taskers').select('id').eq('user_id', userId).single();

    if (!gig || !tasker || gig.seller_id !== tasker.id) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('gigs')
        .delete()
        .eq('id', gigId);

    if (error) throw error;
    revalidatePath('/seller/dashboard/gigs');
}
