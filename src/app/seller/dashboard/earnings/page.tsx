'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

export default function SellerEarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<any>(null);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login?type=tasker');
        return;
      }

      const userData = JSON.parse(userStr);
      
      // Fetch orders to calculate earnings
      const response = await fetch(`/api/orders?userId=${userData.id}&userType=seller`);
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        
        // Calculate earnings
        const totalEarnings = orders
          .filter((o: any) => o.status === 'completed')
          .reduce((sum: number, o: any) => sum + (o.sellerEarnings || 0), 0);
        
        const pendingEarnings = orders
          .filter((o: any) => ['in_progress', 'delivered'].includes(o.status))
          .reduce((sum: number, o: any) => sum + (o.sellerEarnings || 0), 0);

        setEarnings({
          total: totalEarnings,
          pending: pendingEarnings,
          completedOrders: orders.filter((o: any) => o.status === 'completed').length,
          totalOrders: orders.length,
        });
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-600 mt-1">Track your revenue and payouts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Earnings</h3>
            <DollarSign className="h-5 w-5 text-brand-green" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            LKR {earnings?.total.toLocaleString() || '0'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Pending</h3>
            <Calendar className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            LKR {earnings?.pending.toLocaleString() || '0'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Completed Orders</h3>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {earnings?.completedOrders || 0} / {earnings?.totalOrders || 0}
          </p>
        </div>
      </div>

      {/* Payout Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payout Settings</h2>
        <p className="text-gray-600 mb-4">
          Configure how you receive your earnings. Payout settings coming soon.
        </p>
        <button
          disabled
          className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
        >
          Configure Payout Method
        </button>
      </div>
    </div>
  );
}

