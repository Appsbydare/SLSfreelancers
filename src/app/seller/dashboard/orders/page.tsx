'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OrderStatusBadge from '@/components/OrderStatusBadge';

export default function SellerOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login?type=tasker');
        return;
      }

      const userData = JSON.parse(userStr);
      let url = `/api/orders?userId=${userData.id}&userType=seller`;
      
      if (filter === 'active') {
        url += '&status=in_progress';
      } else if (filter === 'completed') {
        url += '&status=completed';
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage your service orders</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-brand-green text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-brand-green text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-brand-green text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.gigTitle || `Order #${order.orderNumber}`}
                    </h3>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-gray-600 mb-2">
                    Customer: {order.customerName || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Package: {order.packageTier?.charAt(0).toUpperCase() + order.packageTier?.slice(1) || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-brand-green">
                    LKR {order.totalAmount?.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Earnings: LKR {order.sellerEarnings?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

