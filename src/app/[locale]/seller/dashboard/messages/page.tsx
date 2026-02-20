import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import MessagesList from '@/app/[locale]/customer/dashboard/messages/MessagesList';
import { getConversations } from '@/app/actions/messages';

export default async function SellerMessagesPage() {
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

  console.log('[SellerMessagesPage] Auth user:', user?.id);

  if (!user) {
    return <div>Please log in to view messages.</div>;
  }

  // Fetch conversations for the seller
  const conversations = await getConversations(user.id, 'tasker');

  console.log('[SellerMessagesPage] Conversations fetched:', conversations.length);

  // Get Public User ID for realtime subscription
  const { data: publicUser, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  console.log('[SellerMessagesPage] Profile lookup:', {
    authUserId: user.id,
    publicUserId: publicUser?.id,
    error: profileError
  });

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    return <div>Error loading profile: {profileError.message}</div>;
  }

  if (!publicUser) {
    console.error('[SellerMessagesPage] No public user found for auth_user_id:', user.id);
    return <div>User profile not found. Please contact support.</div>;
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
        />
      </div>
    </div>
  );
}

