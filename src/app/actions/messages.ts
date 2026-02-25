'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getConversations(userId: string, userType: 'customer' | 'tasker') {
    const { supabaseServer } = await import('@/lib/supabase-server');

    // Get the correct ID based on user type (User ID -> Customer/Tasker ID)
    let profileId: string | null = null;

    // Use admin client to resolve profile ID
    const { data, error: userError } = await supabaseServer.from('users').select('id').eq('auth_user_id', userId).maybeSingle();

    if (userError) {
        console.error('Error fetching user profile:', userError);
        return [];
    }

    profileId = data?.id;

    if (!profileId) return [];

    // Fetch messages where user is sender OR recipient
    // grouped by task_id and the OTHER user
    // Using admin client ensures we can see the other user's details regardless of RLS
    const { data: messages, error } = await supabaseServer
        .from('messages')
        .select(`
            *,
            sender:users!messages_sender_id_fkey(first_name, last_name, profile_image_url, status),
            recipient:users!messages_recipient_id_fkey(first_name, last_name, profile_image_url, status),
            task:tasks(
                title,
                customer:customers(user_id)
            ),
            gig:gigs(
                id,
                title,
                slug,
                images,
                packages:gig_packages(price),
                seller:taskers(user_id)
            )
        `)
        .or(`sender_id.eq.${profileId},recipient_id.eq.${profileId}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    // Group messages into conversations
    const conversationsMap = new Map();

    messages.forEach((msg: any) => {
        // Skip messages where sender and recipient are the same (self-messages)
        if (msg.sender_id === msg.recipient_id) {
            return;
        }

        // Filter based on user type
        if (userType === 'customer') {
            // For customers: only show task conversations they own, and gig conversations where they are the buyer
            if (msg.task_id) {
                const taskCustomerUserId = msg.task?.customer?.user_id;
                if (taskCustomerUserId !== profileId) {
                    return; // Skip this message - not their task
                }
            }
            // For gigs: only show if current user is NOT the gig seller (they are the inquiring customer)
            if (msg.gig_id) {
                const gigSellerUserId = msg.gig?.seller?.user_id;
                if (gigSellerUserId === profileId) {
                    return; // Skip - they are the seller of this gig, not a customer inquiring
                }
            }
        } else if (userType === 'tasker') {
            // For taskers: only show conversations for tasks they DON'T own (i.e., they are the worker)
            if (msg.task_id) {
                const taskCustomerUserId = msg.task?.customer?.user_id;
                if (taskCustomerUserId === profileId) {
                    return; // Skip this message - it's their own task
                }
            }
            // For gigs: only show if the current user is the gig owner (seller)
            // If the gig belongs to someone else, they are the customer inquiring — skip it
            if (msg.gig_id) {
                const gigSellerUserId = msg.gig?.seller?.user_id;
                if (gigSellerUserId !== profileId) {
                    return; // Skip this message - they are the customer, not the gig seller
                }
            }
        }

        // Conversation Key: (TaskID OR GigID) + OtherUserID
        const otherUser = msg.sender_id === profileId ? msg.recipient : msg.sender;
        const otherUserId = msg.sender_id === profileId ? msg.recipient_id : msg.sender_id;

        // Determine context ID (Task or Gig)
        // Prefer Task ID if both exist (though our plan says separate, defensive coding)
        const contextId = msg.task_id || msg.gig_id;
        const contextType = msg.task_id ? 'task' : 'gig';

        if (!contextId) return; // Should not happen with constraint, but good safety

        const key = `${contextType}-${contextId}-${otherUserId}`;

        if (!conversationsMap.has(key)) {
            // Calculate starting price for gig
            let gigDetails = msg.gig;
            if (gigDetails && gigDetails.packages && gigDetails.packages.length > 0) {
                const prices = gigDetails.packages.map((p: any) => Number(p.price));
                const minPrice = Math.min(...prices);
                gigDetails.starting_price = isFinite(minPrice) ? minPrice : 0;
            }

            conversationsMap.set(key, {
                conversation_id: key, // custom ID for frontend
                task_id: msg.task_id,
                gig_id: msg.gig_id,
                task_title: msg.task?.title,
                gig_details: gigDetails,
                other_user: otherUser,
                other_user_id: otherUserId,
                messages: [],
                last_message: msg,
                unread_count: 0 // To implement: check read_at
            });
        }

        const conversation = conversationsMap.get(key);
        conversation.messages.push(msg);

        // Count unread if I am the recipient and it's not read
        if (msg.recipient_id === profileId && !msg.read_at) {
            conversation.unread_count++;
        }
    });

    // Sort messages to be chronological (Oldest -> Newest) for the chat view
    // The query returns Newest -> Oldest, so we reverse the array.
    for (const conversation of conversationsMap.values()) {
        conversation.messages.reverse();
    }

    return Array.from(conversationsMap.values());
}

export async function sendMessage(formData: FormData) {
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

    // Get current user's public ID
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

    if (userError) {
        console.error('Error fetching user profile:', userError);
        return { success: false, message: 'Error fetching user profile' };
    }

    if (!userData) {
        return { success: false, message: 'User profile not found' };
    }

    const taskId = formData.get('taskId') as string;
    const gigId = formData.get('gigId') as string;
    const recipientId = formData.get('recipientId') as string;
    const content = formData.get('content') as string;
    const files = formData.getAll('attachments') as File[];

    if ((!taskId && !gigId) || !recipientId || (!content && files.length === 0)) {
        return { success: false, message: 'Missing required fields' };
    }

    // Upload any attached files to Supabase Storage
    const attachmentUrls: string[] = [];
    if (files.length > 0) {
        for (const file of files) {
            if (!(file instanceof File) || file.size === 0) continue;
            const ext = file.name.split('.').pop();
            const path = `${userData.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('messages')
                .upload(path, file, { contentType: file.type, upsert: false });
            if (uploadError) {
                console.error('Error uploading attachment:', uploadError);
                continue;
            }
            const { data: urlData } = supabase.storage.from('messages').getPublicUrl(path);
            if (urlData?.publicUrl) attachmentUrls.push(urlData.publicUrl);
        }
    }

    const { data: message, error } = await supabase
        .from('messages')
        .insert({
            task_id: taskId || null,
            gig_id: gigId || null,
            sender_id: userData.id,
            recipient_id: recipientId,
            content: content || '',
            attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
            created_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        return { success: false, message: 'Failed to send message' };
    }

    revalidatePath('/customer/dashboard/messages');
    revalidatePath('/seller/dashboard/messages');
    return { success: true, message: 'Message sent', data: message };
}
