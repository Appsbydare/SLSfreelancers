'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from 'next-intl';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SellerSidebar from '@/components/SellerSidebar';
import { getConversations } from '@/app/actions/messages';
import { getSellerLevelCode } from '@/app/actions/seller';
import { supabase } from '@/lib/supabase';

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { user, isLoggedIn, isLoading, session } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [levelCode, setLevelCode] = useState<string>('level_0');

  /*
  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Redirect if not logged in (check session to prevent loop if user profile fails)
    if (!session) {
      router.push(`/${locale}/login?type=tasker`);
      return;
    }

    // Check if user is authorized (tasker role or has tasker account)
    // We only check this if USER is loaded. If session exists but user is null, we wait/show error.
    if (user) {
      const isAuthorized = user.userType === 'tasker' || user.hasTaskerAccount;

      if (!isAuthorized) {
        // If user is not a tasker and has no tasker account, redirect to home
        router.push(`/${locale}`);
        return;
      }

      // Load badge counts only if authorized
      loadBadgeCounts();
    }
  }, [user, isLoggedIn, isLoading, router, session, locale]);
  */

  useEffect(() => {
    if (user && !isLoading && session) {
      loadBadgeCounts();
      getSellerLevelCode(user.id).then(setLevelCode);
    }
  }, [user, isLoading, session]);

  // Refetch level when DevTester forces level change (dashboard:reload)
  useEffect(() => {
    if (!user?.id) return;
    const handler = () => getSellerLevelCode(user.id).then(setLevelCode);
    window.addEventListener('dashboard:reload', handler);
    return () => window.removeEventListener('dashboard:reload', handler);
  }, [user?.id]);

  // Clear orders badge when user visits any orders page
  useEffect(() => {
    if (!pathname) return;
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '');
    if (pathWithoutLocale.startsWith('/seller/dashboard/orders')) {
      setNewOrdersCount(0);
      if (user?.id) {
        localStorage.setItem(`orders_last_seen_${user.id}`, new Date().toISOString());
      }
    }
  }, [pathname, locale, user?.id]);

  // Subscribe to new orders via Supabase Realtime to update badge live
  useEffect(() => {
    if (!user?.id) return;

    // Get the tasker ID for this user
    let taskerIdRef: string | null = null;
    supabase.from('taskers').select('id').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (!data?.id) return;
        taskerIdRef = data.id;

        const channel = supabase
          .channel(`new-orders-${user.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${data.id}`,
          }, () => {
            // Only bump if not currently on the orders page
            const pathWithoutLocale = window.location.pathname.replace(new RegExp(`^/${locale}`), '');
            if (!pathWithoutLocale.startsWith('/seller/dashboard/orders')) {
              setNewOrdersCount(prev => prev + 1);
            }
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);


  // Removed problematic redirect logic that was preventing access to valid dashboard sub-pages
  // The layout itself serves as the navigation guard implicitly
  /*
  useEffect(() => {
    // Redirect to dashboard if user tries to access non-dashboard seller pages
    if (!isLoading && user && pathname) {
      // Remove locale prefix for checking path
      const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '');

      // Allow access to seller dashboard pages
      const isDashboardPage = pathWithoutLocale.startsWith('/seller/dashboard');
      const isSellerGigsPage = pathWithoutLocale.startsWith('/seller/gigs');

      // If accessing seller pages but not dashboard/gigs, redirect to dashboard
      if (pathWithoutLocale.startsWith('/seller') && !isDashboardPage && !isSellerGigsPage) {
        router.push(`/${locale}/seller/dashboard`);
      }
    }
  }, [pathname, isLoading, user, router, locale]);
  */

  const loadBadgeCounts = async () => {
    if (!user || !session?.user) return;

    try {
      // Fetch new (pending) orders the seller hasn't seen yet
      const lastSeen = localStorage.getItem(`orders_last_seen_${user.id}`) || '1970-01-01';
      const { data: tasker } = await supabase.from('taskers').select('id').eq('user_id', user.id).single();
      if (tasker?.id) {
        const { data: newOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('seller_id', tasker.id)
          .eq('status', 'pending')
          .gt('created_at', lastSeen);
        setNewOrdersCount(newOrders?.length || 0);
      }

      // Fetch unread messages count using server action
      const conversations = await getConversations(session.user.id, 'tasker');
      const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setUnreadMessages(totalUnread);
    } catch (error) {
      console.error('Error loading badge counts:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If session exists but user/profile is missing after loading, show error state
  if (!user && session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-md">
          <h3 className="text-xl font-bold text-red-600 mb-2">Profile Error</h3>
          <p className="text-gray-600 mb-4">Unable to load your profile. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-green text-white rounded hover:bg-brand-green/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // PASSIVE AUTH GUARD: Show UI instead of Redirecting to prevent Loops
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-md">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Session Expired</h3>
          <p className="text-gray-600 mb-6">Please log in to access the seller dashboard.</p>
          <button
            onClick={() => router.push(`/${locale}/login?type=tasker`)}
            className="px-6 py-2 bg-brand-green text-white rounded hover:bg-brand-green/90 font-medium"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  const isAuthorized = user && (user.userType === 'tasker' || user.hasTaskerAccount);
  if (user && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-md">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-6">You must be a registered Tasker to view this page.</p>
          <button
            onClick={() => router.push(`/${locale}`)}
            className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Sidebar */}
      <SellerSidebar
        levelCode={levelCode}
        unreadMessages={unreadMessages}
        activeOrders={newOrdersCount}
        onOrdersSeen={() => {
          setNewOrdersCount(0);
          if (user?.id) localStorage.setItem(`orders_last_seen_${user.id}`, new Date().toISOString());
        }}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

