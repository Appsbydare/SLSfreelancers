'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from 'next-intl';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SellerSidebar from '@/components/SellerSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
  const [activeOrders, setActiveOrders] = useState(0);

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
    if (user && !isLoading) {
      loadBadgeCounts();
    }
  }, [user, isLoading]);


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
    if (!user) return;

    try {
      // Fetch active orders count
      const ordersResponse = await fetch(`/api/orders?userId=${user.id}&userType=seller&status=in_progress`);
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setActiveOrders(ordersData.orders?.length || 0);
      }
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
        unreadMessages={unreadMessages}
        activeOrders={activeOrders}
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

