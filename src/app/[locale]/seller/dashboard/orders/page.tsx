'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders } from '@/app/actions/orders';

export default function SellerOrdersPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const loadOrders = useCallback(async () => {
    // Strictly wait for auth loading to complete
    if (authLoading) return;

    // Double check user persistence. If user is null but we just finished loading, 
    // it COULD be a logout. But if session exists (checked in layout), user should be here.
    // However, if we redirect here, we might cause a loop or flicker.
    // Better to show access denied or rely on Layout to handle the redirect.
    if (!user) {
      router.push(`/${locale}/login?type=tasker`);
      return;
    }

    try {
      setLoading(true);
      const data = await getOrders(user.id, 'tasker');

      if (data) {
        // Map data to match UI expectations if needed
        // The SA returns: gig: { title... }, seller: ..., customer: ...
        // The UI expects: gigTitle, customerName, packageTier, etc.
        const mappedOrders = data.map((order: any) => ({
          ...order,
          gigTitle: order.gig?.title || `Order #${order.order_number}`,
          // gigImage: order.gig?.images?.[0] || null, // Not used in this view?
          sellerName: order.seller?.user ? `${order.seller.user.first_name} ${order.seller.user.last_name}` : 'Unknown Seller',
          customerName: order.customer?.user ? `${order.customer.user.first_name} ${order.customer.user.last_name}` : 'Unknown Customer',
          packageTier: order.package_tier,
          totalAmount: Number(order.total_amount),
          sellerEarnings: Number(order.seller_earnings)
        }));
        setOrders(mappedOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'in_progress'].includes(order.status);
    if (filter === 'completed') return order.status === 'completed';
    return true;
  });

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
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
            ? 'bg-brand-green text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'active'
            ? 'bg-brand-green text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'completed'
            ? 'bg-brand-green text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
        >
          Completed
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              href={`/${locale}/orders/${order.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.gigTitle}
                    </h3>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-gray-600 mb-2">
                    Customer: {order.customerName}
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

