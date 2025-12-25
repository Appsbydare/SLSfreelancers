'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SellerSidebar from '@/components/SellerSidebar';

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);

  useEffect(() => {
    checkAuth();
    loadBadgeCounts();
  }, []);

  const checkAuth = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login?type=tasker');
        return;
      }

      const userData = JSON.parse(userStr);
      if (userData.userType !== 'tasker') {
        router.push('/');
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login?type=tasker');
    } finally {
      setLoading(false);
    }
  };

  const loadBadgeCounts = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const userData = JSON.parse(userStr);

      // Fetch active orders count
      const ordersResponse = await fetch(`/api/orders?userId=${userData.id}&userType=seller&status=in_progress`);
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setActiveOrders(ordersData.orders?.length || 0);
      }

      // TODO: Fetch unread messages count when messages API is ready
      // const messagesResponse = await fetch(`/api/messages/unread?userId=${userData.id}`);
      // if (messagesResponse.ok) {
      //   const messagesData = await messagesResponse.json();
      //   setUnreadMessages(messagesData.count || 0);
      // }
    } catch (error) {
      console.error('Error loading badge counts:', error);
    }
  };

  if (loading) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <SellerSidebar 
          unreadMessages={unreadMessages}
          activeOrders={activeOrders}
        />

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

