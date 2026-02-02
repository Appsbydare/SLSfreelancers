'use server';

import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { cookies } from 'next/headers';

const createTaskSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    budget: z.number().min(100, 'Budget must be at least 100'),
    location: z.string().min(3, 'Location is required'),
    category: z.string().min(1, 'Category is required'),
    deadline: z.string().optional(),
});

export async function createTask(prevState: any, formData: FormData) {
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
    if (!user) {
        return { message: 'Unauthorized - Please log in to post a task', errors: {} };
    }

    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        budget: Number(formData.get('budget')),
        location: formData.get('location'),
        category: formData.get('category'),
        deadline: formData.get('deadline'),
    };

    const validated = createTaskSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            message: 'Validation failed',
            errors: validated.error.flatten().fieldErrors,
        };
    }

    // Get customer ID for the user
    const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!customer) {
        return { message: 'Customer profile not found. Please contact support.', errors: {} };
    }

    const { error } = await supabase.from('tasks').insert({
        customer_id: customer.id,
        title: validated.data.title,
        description: validated.data.description,
        budget: validated.data.budget,
        location: validated.data.location,
        category: validated.data.category,
        status: 'open',
        // deadline: validated.data.deadline ? new Date(validated.data.deadline).toISOString() : null, // Schema check needed
    });

    if (error) {
        console.error('Error creating task:', error);
        return { message: 'Database error: ' + error.message, errors: {} };
    }

    revalidatePath('/browse-services');
    redirect('/browse-services');
}

export async function getOpenTasks(limit = 20) {
    // Import supabaseServer for server-side queries
    const { supabaseServer } = await import('@/lib/supabase-server');

    const { data: tasks, error } = await supabaseServer
        .from('tasks')
        .select(`
            *,
            customer:customers(user:users(first_name, last_name, profile_image_url))
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching open tasks:', error);
        return [];
    }

    // Optionally fetch offers count if not in task table
    // For now assuming tasks rows are enough or we join offers if needed.
    // If we need offers count:
    // .select('*, offers:task_offers(count)')

    return tasks;
}
