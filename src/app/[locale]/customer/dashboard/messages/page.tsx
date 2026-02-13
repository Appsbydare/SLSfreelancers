import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MessageSquare } from 'lucide-react';
import MessagesList from '@/app/[locale]/customer/dashboard/messages/MessagesList';

export default async function CustomerMessagesPage() {
    // Create authenticated Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Fetch user data to get user_id
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!userData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Unable to load messages.</p>
            </div>
        );
    }

    // Fetch all messages where user is sender or recipient
    const { data: messages } = await supabase
        .from('messages')
        .select(`
            *,
            task:tasks(id, title),
            sender:users!messages_sender_id_fkey(id, first_name, last_name),
            recipient:users!messages_recipient_id_fkey(id, first_name, last_name)
        `)
        .or(`sender_id.eq.${userData.id},recipient_id.eq.${userData.id}`)
        .order('created_at', { ascending: false });

    // Group messages by task_id
    const conversationsMap = new Map();

    messages?.forEach((message: any) => {
        const taskId = message.task_id;
        if (!conversationsMap.has(taskId)) {
            conversationsMap.set(taskId, {
                task_id: taskId,
                task_title: message.task?.title || 'Unknown Task',
                messages: [],
                last_message: message,
                unread_count: 0,
            });
        }
        conversationsMap.get(taskId).messages.push(message);

        // Count unread (messages sent to user that haven't been read)
        if (message.recipient_id === userData.id && !message.read_at) {
            conversationsMap.get(taskId).unread_count++;
        }
    });

    const conversations = Array.from(conversationsMap.values());

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <p className="text-gray-600 mt-1">Communicate with taskers about your requests</p>
            </div>

            {conversations.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                        When you receive offers on your requests, you can chat with taskers here.
                    </p>
                </div>
            ) : (
                <MessagesList conversations={conversations} currentUserId={userData.id} />
            )}
        </div>
    );
}
