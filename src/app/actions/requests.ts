'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export interface TasksFilter {
    category?: string;
    location?: string;
    minBudget?: number;
    search?: string;
}

export async function getFilteredTasks(filters: TasksFilter = {}, limit = 50) {
    const { supabaseServer } = await import('@/lib/supabase-server');
    const cookieStore = await cookies();

    // Create a client to check auth status (using user's cookies)
    const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookies) => {
                    cookies.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    // Get current user
    const { data: { user } } = await supabaseAuth.auth.getUser();

    let excludedCustomerId: string | null = null;

    if (user) {
        // Resolve customer_id for the current user to exclude their own tasks
        const { data: publicUser, error: userError } = await supabaseServer
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        if (publicUser && !userError) {
            const { data: customer, error: customerError } = await supabaseServer
                .from('customers')
                .select('id')
                .eq('user_id', publicUser.id)
                .maybeSingle();

            if (customer && !customerError) {
                excludedCustomerId = customer.id;
            }
        }
    }

    let query = supabaseServer
        .from('tasks')
        .select(`
            *,
            customer:customers(user:users(first_name, last_name, profile_image_url))
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(limit);

    // Exclude own tasks
    if (excludedCustomerId) {
        query = query.neq('customer_id', excludedCustomerId);
    }

    if (filters.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
    }

    if (filters.location && filters.location.trim() !== '') {
        query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.minBudget) {
        query = query.gte('budget', filters.minBudget);
    }

    if (filters.search && filters.search.trim() !== '') {
        query = query.ilike('title', `%${filters.search}%`);
    }

    const { data: tasks, error } = await query;

    if (error) {
        console.error('Error fetching filtered tasks:', error);
        return [];
    }

    // Map offers_count (temporarily disabled due to ambiguous relationship)
    // We can fetch this separately if needed, but for now 0 to unblock UI.
    const mappedTasks = tasks.map((task: any) => ({
        ...task,
        offers_count: 0 // task.offers_count?.[0]?.count || 0
    }));

    return mappedTasks;
}

export async function getCategories() {
    const { supabaseServer } = await import('@/lib/supabase-server');

    const { data: categories, error } = await supabaseServer
        .from('categories')
        .select('id, name')
        .order('name');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return categories;
}

export async function getMyBids() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookies) => {
                    cookies.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Get Public User ID
    const { data: publicUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

    if (!publicUser || userError) return [];

    // Get Tasker ID
    const { data: tasker, error: taskerError } = await supabase
        .from('taskers')
        .select('id')
        .eq('user_id', publicUser.id)
        .maybeSingle();

    if (!tasker || taskerError) return [];

    // Fetch offers made by this tasker
    const { data: offers, error } = await supabase
        .from('offers')
        .select(`
            *,
            task:tasks!offers_task_id_fkey (
                id,
                title,
                budget,
                location,
                status,
                category,
                deadline,
                created_at,
                description
            )
        `)
        .eq('tasker_id', tasker.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching my bids:', error);
        return [];
    }

    return offers;
}
