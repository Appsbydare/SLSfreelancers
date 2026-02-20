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

    // Get Public User ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!publicUser) {
        return { message: 'User profile not found.', errors: {} };
    }

    // Get customer ID for the user
    const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', publicUser.id)
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

    revalidatePath('/customer/dashboard/requests');
    redirect('/customer/dashboard/requests');
}

export async function getOpenTasks(limit = 20) {
    // Import supabaseServer for server-side queries
    // Import supabaseServer for server-side queries
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
        const { data: publicUser } = await supabaseServer
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (publicUser) {
            const { data: customer } = await supabaseServer
                .from('customers')
                .select('id')
                .eq('user_id', publicUser.id)
                .single();

            if (customer) {
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

    if (excludedCustomerId) {
        query = query.neq('customer_id', excludedCustomerId);
    }

    const { data: tasks, error } = await query;

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

    // Get Public User ID first
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!publicUser) {
        return { message: 'User profile not found.', errors: {} };
    }

    // Get Tasker Profile using Public User ID
    const { data: tasker } = await supabase
        .from('taskers')
        .select('id')
        .eq('user_id', publicUser.id)
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

    // Fetch the task owner's user_id and task title to send a notification
    const { data: taskData } = await supabase
        .from('tasks')
        .select('title, customer:customers(user_id)')
        .eq('id', taskId)
        .single();

    if (taskData && taskData.customer) {
        const customerUserId = (taskData.customer as any).user_id;
        if (customerUserId) {
            const { createClient } = await import('@supabase/supabase-js');
            const adminClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            );

            // Direct insertion of a notification record
            await adminClient.from('notifications').insert({
                user_id: customerUserId,
                notification_type: 'offer',
                title: 'New Bid Received',
                message: `You received a new bid of LKR ${amount.toLocaleString()} on "${taskData.title}".`,
                data: { task_id: taskId, amount: amount, tasker_id: tasker.id }
            });
        }
    }

    revalidatePath(`/seller/dashboard/tasks/${taskId}`);
    return {
        message: 'Bid placed successfully!',
        success: true,
        bid: {
            proposed_price: amount,
            estimated_hours: estimatedHours,
            message: message,
            status: 'pending',
            created_at: new Date().toISOString()
        }
    };
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

    // Get Public User ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!publicUser) return [];

    // Verify task ownership
    const { data: task } = await supabase
        .from('tasks')
        .select('customer:customers(user_id)')
        .eq('id', taskId)
        .single();

    if (!task) return [];

    const customer = task.customer as any; // Type assertion since Supabase types might infer array
    if (customer.user_id !== publicUser.id) {
        return [];
    }

    // Use admin client to fetch offers to bypass RLS for tasker name/details
    const { supabaseServer } = await import('@/lib/supabase-server');

    const { data: offers, error } = await supabaseServer
        .from('offers')
        .select(`
            *,
            tasker:taskers (
                id,
                user_id,
                user:users (
                    id,
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

    if (!user) return null;

    // Get Public User ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!publicUser) return null;

    const { data: tasker } = await supabase
        .from('taskers')
        .select('id')
        .eq('user_id', publicUser.id)
        .single();

    if (!tasker) return null;

    const { data: bid } = await supabase
        .from('offers')
        .select('*')
        .eq('task_id', taskId)
        .eq('tasker_id', tasker.id)
        .single();

    return bid;
}

export async function updateTask(prevState: any, formData: FormData) {
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

    const taskId = formData.get('taskId') as string;
    if (!taskId) {
        return { message: 'Task ID is required', errors: {} };
    }

    // Get Public User ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!publicUser) {
        return { message: 'Unauthorized', errors: {} };
    }

    // Verify ownership
    const { data: task } = await supabase
        .from('tasks')
        .select('customer:customers(user_id)')
        .eq('id', taskId)
        .single();

    if (!task || (task.customer as any).user_id !== publicUser.id) {
        return { message: 'Unauthorized', errors: {} };
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

    const { error } = await supabase
        .from('tasks')
        .update({
            title: validated.data.title,
            description: validated.data.description,
            budget: validated.data.budget,
            location: validated.data.location,
            category: validated.data.category,
            // deadline: validated.data.deadline ? new Date(validated.data.deadline).toISOString() : null,
        })
        .eq('id', taskId);

    if (error) {
        console.error('Error updating task:', error);
        return { message: 'Database error: ' + error.message, errors: {} };
    }

    revalidatePath(`/customer/dashboard/tasks/${taskId}`);
    redirect(`/customer/dashboard/tasks/${taskId}`);
}

export async function acceptOffer(taskId: string, offerId: string) {
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
        return { success: false, message: 'Unauthorized' };
    }

    // Get Public User ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!publicUser) {
        return { success: false, message: 'Unauthorized' };
    }

    // Verify task ownership
    const { data: task } = await supabase
        .from('tasks')
        .select('customer:customers(user_id)')
        .eq('id', taskId)
        .single();

    if (!task || (task.customer as any).user_id !== publicUser.id) {
        return { success: false, message: 'Unauthorized' };
    }

    // Direct instantiation of service client to bypass RLS securely
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminClient = createClient(supabaseServiceUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Update Offer Status
    const { data: updateData, error: offerError } = await adminClient
        .from('offers')
        .update({ status: 'accepted' })
        .eq('id', offerId)
        .select('id, status');

    if (offerError || !updateData || updateData.length === 0) {
        console.error('Error accepting offer:', offerError || 'No rows updated. Task ID or Offer ID is wrong.');
        return { success: false, message: 'Failed to accept offer. Offer may not exist.' };
    }

    // 2. Update Task Status & Selected Offer
    const { error: taskError } = await adminClient
        .from('tasks')
        .update({ status: 'assigned', selected_offer_id: offerId })
        .eq('id', taskId);

    if (taskError) {
        console.error('Error updating task status:', taskError);
        return { success: false, message: 'Failed to update task status' };
    }

    // 3. Reject other offers
    await adminClient
        .from('offers')
        .update({ status: 'rejected' })
        .eq('task_id', taskId)
        .neq('id', offerId);

    // 4. Send Notification to Tasker
    const { data: offer } = await adminClient
        .from('offers')
        .select('tasker:taskers(user_id)')
        .eq('id', offerId)
        .single();

    if (offer && offer.tasker && (offer.tasker as any).user_id) {
        const taskerUserId = (offer.tasker as any).user_id;

        // Fetch task title for the notification
        const { data: taskData } = await adminClient.from('tasks').select('title').eq('id', taskId).single();

        // Send notification directly using adminClient to bypass RLS
        await adminClient.from('notifications').insert({
            user_id: taskerUserId,
            notification_type: 'offer',
            title: 'Bid Accepted!',
            message: taskData ? `Your bid for "${taskData.title}" was accepted!` : 'Your bid was accepted!',
            data: { task_id: taskId, offer_id: offerId, type: 'accepted' }
        });
    }

    revalidatePath(`/customer/dashboard/tasks/${taskId}`);
    return { success: true, message: 'Offer accepted successfully' };
}

export async function deleteTask(taskId: string) {
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
        return { success: false, message: 'Unauthorized' };
    }

    // Get Public User ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!publicUser) {
        return { success: false, message: 'Unauthorized' };
    }

    // Verify task ownership
    const { data: task } = await supabase
        .from('tasks')
        .select('customer:customers(user_id)')
        .eq('id', taskId)
        .single();

    if (!task || (task.customer as any).user_id !== publicUser.id) {
        return { success: false, message: 'Unauthorized' };
    }

    // Delete the task
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) {
        console.error('Error deleting task:', error);
        return { success: false, message: 'Failed to delete task: ' + error.message };
    }

    revalidatePath('/customer/dashboard/requests');
    return { success: true, message: 'Request deleted successfully' };
}

export async function updateOffer(prevState: any, formData: FormData) {
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

    const taskId = formData.get('taskId') as string;
    const offerId = formData.get('offerId') as string;
    const amount = Number(formData.get('amount'));
    const message = formData.get('message') as string;
    const estimatedHours = Number(formData.get('estimatedHours'));

    if (!offerId || !taskId || !amount || !message) {
        return { message: 'Missing required fields.', errors: {} };
    }

    // Get Public User ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!publicUser) return { message: 'User not found.', errors: {} };

    // Get Tasker Profile
    const { data: tasker } = await supabase
        .from('taskers')
        .select('id')
        .eq('user_id', publicUser.id)
        .single();

    if (!tasker) return { message: 'Not a registered tasker.', errors: {} };

    // Verify ownership and status of the offer
    const { data: existingOffer } = await supabase
        .from('offers')
        .select('id, status')
        .eq('id', offerId)
        .eq('tasker_id', tasker.id)
        .single();

    if (!existingOffer) {
        return { message: 'Offer not found or unauthorized.', errors: {} };
    }

    if (existingOffer.status !== 'pending') {
        return { message: 'Cannot update an offer that has already been accepted or rejected.', errors: {} };
    }

    const { error: updateError } = await supabase
        .from('offers')
        .update({
            proposed_price: amount,
            message: message,
            estimated_hours: estimatedHours,
            // updated_at: new Date().toISOString() // Let DB handle if triggered, otherwise we should add it if column exists
        })
        .eq('id', offerId);

    if (updateError) {
        console.error('Error updating offer:', updateError);
        return { message: 'Failed to update offer.', errors: {} };
    }

    revalidatePath(`/seller/dashboard/tasks/${taskId}`);

    // Return structured success
    return {
        message: 'Bid updated successfully!',
        success: true,
        bid: {
            id: offerId,
            proposed_price: amount,
            estimated_hours: estimatedHours,
            message: message,
            status: 'pending',
            created_at: new Date().toISOString()
        }
    };
}

export async function deleteOffer(offerId: string, taskId: string) {
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
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: publicUser, error: userError } = await supabase.from('users').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (userError || !publicUser) return { success: false, message: 'User not found' };

    const { data: tasker, error: taskerError } = await supabase.from('taskers').select('id').eq('user_id', publicUser.id).maybeSingle();
    if (taskerError || !tasker) return { success: false, message: 'Tasker profile not found' };

    // Verify the offer can be deleted
    const { data: existingOffer, error: offerError } = await supabase
        .from('offers')
        .select('status')
        .eq('id', offerId)
        .eq('tasker_id', tasker.id)
        .maybeSingle();

    if (offerError || !existingOffer) {
        return { success: false, message: 'Offer not found or unauthorized.' };
    }

    if (existingOffer.status !== 'pending') {
        return { success: false, message: 'Cannot retract an offer that has already been accepted or rejected.' };
    }

    const { error: deleteError } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId)
        .eq('tasker_id', tasker.id);

    if (deleteError) {
        console.error('Error deleting offer:', deleteError);
        return { success: false, message: 'Failed to delete offer.' };
    }

    revalidatePath(`/seller/dashboard/tasks/${taskId}`);
    return { success: true, message: 'Offer retracted successfully.' };
}
