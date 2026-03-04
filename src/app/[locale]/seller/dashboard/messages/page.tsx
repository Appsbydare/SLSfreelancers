import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import MessagesList from '@/app/[locale]/customer/dashboard/messages/MessagesList';
import { getConversations } from '@/app/actions/messages';

interface PageProps {
  searchParams: Promise<{
    recipientId?: string;
    gigId?: string;
    taskId?: string;
  }>;
}

export default async function SellerMessagesPage({ searchParams }: PageProps) {
  const { recipientId, gigId, taskId } = await searchParams;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to view messages.</div>;
  }

  // Fetch conversations for the seller
  const conversations = await getConversations(user.id, 'tasker');

  // Get Public User ID
  const { data: publicUser, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileError || !publicUser) {
    return <div>User profile not found. Please contact support.</div>;
  }

  // Resolve recipient name/avatar if recipientId provided
  let initialRecipient = null;
  if (recipientId) {
    const { data } = await supabase
      .from('users')
      .select('first_name, last_name, profile_image_url')
      .eq('id', recipientId)
      .single();
    if (data) initialRecipient = data;
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Communicate with your customers</p>
      </div>

      <div className="flex-1 min-h-0">
        <MessagesList
          conversations={conversations}
          currentUserId={publicUser.id}
          initialRecipientId={recipientId}
          initialRecipient={initialRecipient}
          initialGigId={gigId}
          initialTaskId={taskId}
          initialTaskTitle="Order Inquiry"
        />
      </div>
    </div>
  );
}

