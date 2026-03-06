import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Calculates seller level based on tasker stats.
 * Must match the requirements shown in SellerLevelInfoModal.
 *
 * Level 1: 100 Trust Score (Verified), 5 Completed Orders, 4.0+ Rating, 90% On-Time Delivery
 * Level 2: 200 Trust Score (Trust Verified), 25 Completed Orders, 4.5+ Rating
 * Level 3: Admin-assigned only (Top Seller) — also grants the final +50 trust pts (200→250)
 */
export function calculateSellerLevel(tasker: any): string {
    const trust = tasker.trust_score || 0;
    const orders = tasker.completed_tasks || 0;
    const rating = Number(tasker.rating || 0);
    const onTime = Number(tasker.on_time_delivery_rate || 0);

    // Level 2 Seller: 200 trust (Trust Verified), 25 orders, 4.5+ rating
    if (trust >= 200 && orders >= 25 && rating >= 4.5) {
        return 'level_2';
    }

    // Level 1 Seller: 100 trust, 5 orders, 4.0+ rating, 90%+ on-time
    if (trust >= 100 && orders >= 5 && rating >= 4.0 && onTime >= 90) {
        return 'level_1';
    }

    return 'level_0';
}

/**
 * Fetches the latest tasker stats and updates level_code if it has changed.
 * Pass either tasker_id (taskers.id) or user_id (taskers.user_id).
 * Level 3 is admin-assigned and is never downgraded automatically.
 */
export async function recalculateSellerLevel(
    supabase: SupabaseClient,
    identifier: { taskerId: string } | { userId: string }
): Promise<void> {
    try {
        const column = 'taskerId' in identifier ? 'id' : 'user_id';
        const value = 'taskerId' in identifier ? identifier.taskerId : identifier.userId;

        const { data: tasker, error } = await supabase
            .from('taskers')
            .select('id, trust_score, completed_tasks, rating, on_time_delivery_rate, level_code')
            .eq(column, value)
            .single();

        if (error || !tasker) return;

        // Never auto-downgrade an admin-assigned level_3
        if (tasker.level_code === 'level_3') return;

        const newLevel = calculateSellerLevel(tasker);

        if (newLevel !== tasker.level_code) {
            await supabase
                .from('taskers')
                .update({ level_code: newLevel })
                .eq('id', tasker.id);
        }
    } catch (err) {
        console.error('recalculateSellerLevel error:', err);
    }
}
