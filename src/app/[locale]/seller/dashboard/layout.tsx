'use client';

import { useAuth } from '@/contexts/AuthContext';

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
  const { user, isLoggedIn, isLoading } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Redirect if not logged in
    if (!isLoggedIn || !user) {
      router.push('/login?type=tasker');
      return;
    }

    // Check if user is authorized (tasker role or has tasker account)
    const isAuthorized = user.userType === 'tasker' || user.hasTaskerAccount;

    if (!isAuthorized) {
      // If user is not a tasker and has no tasker account, redirect to home
      router.push('/en');
      return;
    }

    // Load badge counts
    loadBadgeCounts();
  }, [user, isLoggedIn, isLoading, router]);


  useEffect(() => {
    // Redirect to dashboard if user tries to access non-dashboard seller pages
    if (!isLoading && user && pathname) {
      // Allow access to seller dashboard pages
      const isDashboardPage = pathname.startsWith('/seller/dashboard');
      const isSellerGigsPage = pathname.startsWith('/seller/gigs');

      // If accessing seller pages but not dashboard/gigs, redirect to dashboard
      if (pathname.startsWith('/seller') && !isDashboardPage && !isSellerGigsPage) {
        router.push('/seller/dashboard');
      }
    }
  }, [pathname, isLoading, user, router]);

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

