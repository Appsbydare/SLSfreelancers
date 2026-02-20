import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MessageSquare } from 'lucide-react';
import MessagesList from '@/app/[locale]/customer/dashboard/messages/MessagesList';
import { getConversations } from '@/app/actions/messages';

interface PageProps {
    searchParams: Promise<{
        taskId?: string;
        recipientId?: string;
        gigId?: string;
    }>;
}

export default async function CustomerMessagesPage({ searchParams }: PageProps) {
    const { taskId, recipientId, gigId } = await searchParams;

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

    // Fetch user data to get user_id (public ID)
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

    // Fetch conversations
    const conversations = await getConversations(user.id, 'customer');

    // Fetch initial context data if provided
    let initialRecipient = null;
    let initialGigDetails = null;
    let initialTaskTitle = 'Inquiry';

    if (recipientId) {
        const { data } = await supabase
            .from('users')
            .select('first_name, last_name, profile_image_url')
            .eq('id', recipientId)
            .single();
        if (data) initialRecipient = data;
    }

    if (gigId) {
        const { data } = await supabase
            .from('gigs')
            .select('id, title, slug, images, packages:gig_packages(price)')
            .eq('id', gigId)
            .single();

        if (data) {
            let startingPrice = 0;
            if (data.packages && data.packages.length > 0) {
                const prices = data.packages.map((p: any) => Number(p.price));
                const minPrice = Math.min(...prices);
                startingPrice = isFinite(minPrice) ? minPrice : 0;
            }
            initialGigDetails = {
                id: data.id,
                title: data.title,
                slug: data.slug,
                images: data.images,
                starting_price: startingPrice
            };
        }
    }

    if (taskId) {
        const { data } = await supabase
            .from('tasks')
            .select('title')
            .eq('id', taskId)
            .single();
        if (data) initialTaskTitle = data.title;
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <p className="text-gray-600">Communicate with taskers about your requests</p>
            </div>

            <div className="flex-1 min-h-0">
                <MessagesList
                    conversations={conversations}
                    currentUserId={userData.id}
                    initialTaskId={taskId}
                    initialGigId={gigId}
                    initialRecipientId={recipientId}
                    initialRecipient={initialRecipient}
                    initialGigDetails={initialGigDetails}
                    initialTaskTitle={initialTaskTitle}
                />
            </div>
        </div>
    );
}
