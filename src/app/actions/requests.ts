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

    let query = supabaseServer
        .from('tasks')
        .select(`
            *,
            customer:customers(user:users(first_name, last_name, profile_image_url))
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (filters.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
    }

    if (filters.location && filters.location.trim() !== '') {
        query = query.ilike('location', `%${filters.location}%`);
    }

    // Naively handle budget if needed, though range is better
    if (filters.minBudget) {
        query = query.gte('budget', filters.minBudget);
    }

    if (filters.search && filters.search.trim() !== '') {
        // query = query.textSearch('title', filters.search, { type: 'plain', config: 'english' }); 
        // Fallback to ilike for simplicity as FTS config might not be present
        query = query.ilike('title', `%${filters.search}%`);
    }

    const { data: tasks, error } = await query;

    if (error) {
        console.error('Error fetching filtered tasks:', error);
        return [];
    }

    return tasks;
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
