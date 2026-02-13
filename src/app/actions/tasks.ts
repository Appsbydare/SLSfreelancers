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

export async function getTaskById(taskId: string) {
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

    const { data: task, error } = await supabase
        .from('tasks')
        .select(`
            *,
            customer:customers(
                id,
                user:users(id, auth_user_id, first_name, last_name, profile_image_url)
            )
        `)
        .eq('id', taskId)
        .single();

    if (error) {
        console.error('Error fetching task:', error);
        return null;
    }

    return task;
}

export async function placeBid(prevState: any, formData: FormData) {
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
        return { message: 'Unauthorized', errors: {} };
    }

    // Get Tasker Profile
    const { data: tasker } = await supabase
        .from('taskers')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!tasker) {
        return { message: 'You must be a registered Tasker to place a bid.', errors: {} };
    }

    const taskId = formData.get('taskId') as string;
    const amount = Number(formData.get('amount'));
    const message = formData.get('message') as string;
    const estimatedHours = Number(formData.get('estimatedHours'));

    if (!taskId || !amount || !message) {
        return { message: 'Please fill in all required fields.', errors: {} };
    }

    // Check for existing bid
    const { data: existingBid } = await supabase
        .from('offers')
        .select('id')
        .eq('task_id', taskId)
        .eq('tasker_id', tasker.id)
        .single();

    if (existingBid) {
        return { message: 'You have already placed a bid on this task.', errors: {} };
    }

    const { error } = await supabase.from('offers').insert({
        task_id: taskId,
        tasker_id: tasker.id,
        proposed_price: amount,
        message: message,
        estimated_hours: estimatedHours,
        status: 'pending'
    });

    if (error) {
        console.error('Error placing bid:', error);
        return { message: 'Failed to place bid. Please try again.', errors: {} };
    }

    revalidatePath(`/seller/dashboard/tasks/${taskId}`);
    return { message: 'Bid placed successfully!', success: true };
}

export async function getTaskOffers(taskId: string) {
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

    // Check if current user is the owner of the task
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: task } = await supabase
        .from('tasks')
        .select('customer:customers(user_id)')
        .eq('id', taskId)
        .single();

    if (!task) return [];

    const customer = task.customer as any; // Type assertion since Supabase types might infer array
    if (customer.user_id !== user.id) {
        return [];
    }

    const { data: offers, error } = await supabase
        .from('offers')
        .select(`
            *,
            tasker:taskers (
                user:users (
                    first_name,
                    last_name,
                    profile_image_url
                )
            )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching offers:', error);
        return [];
    }

    return offers;
}

export async function getTaskerBid(taskId: string) {
    const { supabaseServer } = await import('@/lib/supabase-server');
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) return null;

    const { data: tasker } = await supabaseServer
        .from('taskers')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!tasker) return null;

    const { data: bid } = await supabaseServer
        .from('offers')
        .select('*')
        .eq('task_id', taskId)
        .eq('tasker_id', tasker.id)
        .single();

    return bid;
}
