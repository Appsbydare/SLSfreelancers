'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { calculateSellerLevel } from '@/utils/sellerLevelLogic';

const isDev = process.env.NODE_ENV === 'development';

async function getTaskerByUserId(userId: string) {
    // Attempt 1: userId is public.users.id  (the common case)
    const { data: direct, error: directErr } = await supabaseServer
        .from('taskers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (directErr) {
        console.error('DevTest direct lookup error:', JSON.stringify(directErr));
    }

    if (direct) return direct;

    // Attempt 2: userId might be the Supabase auth UID — resolve via public.users.auth_user_id
    console.warn(`DevTest: direct lookup found nothing for user_id=${userId}, trying auth_user_id fallback`);
    const { data: publicUser, error: userErr } = await supabaseServer
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();

    if (userErr) console.error('DevTest users lookup error:', JSON.stringify(userErr));
    if (!publicUser) {
        console.warn('DevTest: No public user found for auth_user_id:', userId);
        return null;
    }

    const { data: byPublicId, error: secondErr } = await supabaseServer
        .from('taskers')
        .select('*')
        .eq('user_id', publicUser.id)
        .maybeSingle();

    if (secondErr) console.error('DevTest secondary tasker lookup error:', JSON.stringify(secondErr));
    if (!byPublicId) console.warn('DevTest: No tasker found for resolved public user id:', publicUser.id);

    return byPublicId ?? null;
}

export async function updateTrustScore(userId: string, pointsToAdd: number) {
    if (!isDev) return { success: false, error: 'Only available in development environment' };

    const tasker = await getTaskerByUserId(userId);
    if (!tasker) return { success: false, error: `Tasker not found for user_id: ${userId}` };

    const newScore = Math.max(0, Math.min((tasker.trust_score || 0) + pointsToAdd, 250));

    const { error } = await supabaseServer
        .from('taskers')
        .update({ trust_score: newScore })
        .eq('id', tasker.id);

    if (error) {
        console.error('DevTest updateTrustScore update error:', JSON.stringify(error));
        return { success: false, error: error.message };
    }

    return { success: true, newScore };
}

export async function simulateCompletedOrder(userId: string, ordersToAdd: number, earningsToAdd?: number) {
    if (!isDev) return { success: false, error: 'Only available in development environment' };

    const tasker = await getTaskerByUserId(userId);
    if (!tasker) return { success: false, error: `Tasker not found for user_id: ${userId}` };

    const newTasks = Math.max(0, (tasker.completed_tasks || 0) + ordersToAdd);
    const currentOnTime = Number(tasker.on_time_delivery_rate) || 80;
    const currentAcceptance = Number(tasker.acceptance_rate) || 85;
    const newOnTime = ordersToAdd > 0
        ? Math.min(100, currentOnTime + 5)
        : Math.max(0, currentOnTime - 5);
    const newAcceptance = ordersToAdd > 0
        ? Math.min(100, currentAcceptance + 3)
        : Math.max(0, currentAcceptance - 3);

    const { error } = await supabaseServer
        .from('taskers')
        .update({
            completed_tasks: newTasks,
            on_time_delivery_rate: newOnTime,
            acceptance_rate: newAcceptance,
        })
        .eq('id', tasker.id);

    if (error) {
        console.error('DevTest simulateCompletedOrder update error:', JSON.stringify(error));
        return { success: false, error: error.message };
    }

    return { success: true, newTasks };
}

export async function setRating(userId: string, targetRating: number) {
    if (!isDev) return { success: false, error: 'Only available in development environment' };

    const tasker = await getTaskerByUserId(userId);
    if (!tasker) return { success: false, error: `Tasker not found for user_id: ${userId}` };

    const clampedRating = Math.max(1.0, Math.min(5.0, targetRating));
    const totalReviews = clampedRating >= 4.5 ? 50 : 5;

    const { error } = await supabaseServer
        .from('taskers')
        .update({ rating: clampedRating, total_reviews: totalReviews })
        .eq('id', tasker.id);

    if (error) {
        console.error('DevTest setRating update error:', JSON.stringify(error));
        return { success: false, error: error.message };
    }

    return { success: true, rating: clampedRating };
}

// For backwards compat with DevTester calling maxOutRating(userId, 1.0 | 5.0)
export async function maxOutRating(userId: string, targetRating: number = 5.0) {
    return setRating(userId, targetRating);
}

export async function setOnTimeDeliveryRate(userId: string, delta: number) {
    if (!isDev) return { success: false, error: 'Only available in development environment' };

    const tasker = await getTaskerByUserId(userId);
    if (!tasker) return { success: false, error: `Tasker not found for user_id: ${userId}` };

    const current = Number(tasker.on_time_delivery_rate) || 0;
    const newRate = Math.max(0, Math.min(100, current + delta));

    const { error } = await supabaseServer
        .from('taskers')
        .update({ on_time_delivery_rate: newRate })
        .eq('id', tasker.id);

    if (error) {
        console.error('DevTest setOnTimeDeliveryRate error:', JSON.stringify(error));
        return { success: false, error: error.message };
    }

    return { success: true, newRate };
}

export async function refreshLevel(userId: string) {
    if (!isDev) return { success: false, error: 'Only available in development environment' };

    const tasker = await getTaskerByUserId(userId);
    if (!tasker) return { success: false, error: `Tasker not found for user_id: ${userId}` };

    const newLevel = calculateSellerLevel(tasker);

    if (newLevel !== tasker.level_code) {
        const { error } = await supabaseServer
            .from('taskers')
            .update({ level_code: newLevel })
            .eq('id', tasker.id);

        if (error) {
            console.error('DevTest refreshLevel update error:', JSON.stringify(error));
            return { success: false, error: error.message };
        }
    }

    return { success: true, level: newLevel };
}

export async function forceLevel(userId: string, levelCode: string) {
    if (!isDev) return { success: false, error: 'Only available in development environment' };

    const validLevels = ['level_0', 'level_1', 'level_2', 'level_3'];
    if (!validLevels.includes(levelCode)) {
        return { success: false, error: `Invalid level code: ${levelCode}` };
    }

    const tasker = await getTaskerByUserId(userId);
    if (!tasker) return { success: false, error: `Tasker not found for user_id: ${userId}` };

    // For level_3, also boost trust_score to 250 so all UI renders correctly
    const updates: Record<string, any> = { level_code: levelCode };
    if (levelCode === 'level_3') {
        updates.trust_score = 250;
        updates.is_super_verified = true;
    }

    const { error } = await supabaseServer
        .from('taskers')
        .update(updates)
        .eq('id', tasker.id);

    if (error) {
        console.error('DevTest forceLevel update error:', JSON.stringify(error));
        return { success: false, error: error.message };
    }

    return { success: true, level: levelCode };
}
