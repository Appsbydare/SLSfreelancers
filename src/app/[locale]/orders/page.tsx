'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Search, Filter } from 'lucide-react';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders } from '@/app/actions/orders';

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadOrders = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/orders');
      return;
    }

    setLoading(true);
    try {
      const data = await getOrders(user.id, user.userType as 'customer' | 'tasker');

      if (data) {
        // Map data to match UI expectations
        const mappedOrders = data.map((order: any) => ({
          ...order,
          gigTitle: order.gig?.title || 'Unknown Gig',
          gigImage: order.gig?.images?.[0] || null,
          sellerName: order.seller?.user ? `${order.seller.user.first_name} ${order.seller.user.last_name}` : 'Unknown Seller',
          customerName: order.customer?.user ? `${order.customer.user.first_name} ${order.customer.user.last_name}` : 'Unknown Customer',
          packageTier: order.package_tier,
          // Ensure numeric
          total_amount: Number(order.total_amount),
          platform_fee: Number(order.platform_fee)
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

  const filteredOrders = orders.filter(order => {
    if (activeFilter !== 'all' && order.status !== activeFilter) return false;

    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(searchLower) ||
      order.gigTitle?.toLowerCase().includes(searchLower) ||
      order.sellerName?.toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower)
    );
  });

  // Recalculate counts based on fetched orders
  const filters = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { id: 'in_progress', label: 'In Progress', count: orders.filter(o => o.status === 'in_progress').length },
    { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
    { id: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length },
    { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length },
  ];

  const isSeller = user?.userType === 'tasker';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isSeller ? 'My Orders (Seller)' : 'My Orders (Buyer)'}
          </h1>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order number, gig, or name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Status</h2>
              <div className="space-y-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeFilter === filter.id
                      ? 'bg-brand-green text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{filter.label}</span>
                      <span className={`text-sm ${activeFilter === filter.id ? 'text-white' : 'text-gray-500'
                        }`}>
                        {filter.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Orders List */}
          <div className="flex-1">
            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Gig Image */}
                        {order.gigImage && (
                          <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={order.gigImage}
                              alt={order.gigTitle}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Order Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {order.gigTitle}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Order #{order.order_number}
                              </p>
                            </div>
                            <OrderStatusBadge status={order.status} size="sm" />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                {isSeller ? 'Customer' : 'Seller'}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {isSeller ? order.customerName : order.sellerName}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 mb-1">Package</p>
                              <p className="text-sm font-medium text-gray-900 capitalize">
                                {order.packageTier}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 mb-1">Total</p>
                              <p className="text-sm font-medium text-brand-green">
                                LKR {(order.total_amount + order.platform_fee).toLocaleString()}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 mb-1">Order Date</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Delivery Date */}
                          {order.delivery_date && order.status !== 'completed' && order.status !== 'cancelled' && (
                            <div className="mt-3 flex items-center text-sm text-gray-600">
                              <Package className="h-4 w-4 mr-1" />
                              <span>Expected delivery: {new Date(order.delivery_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : isSeller
                      ? 'You haven\'t received any orders yet'
                      : 'You haven\'t placed any orders yet'}
                </p>
                {!isSeller && (
                  <Link
                    href="/browse-gigs"
                    className="inline-block bg-brand-green text-white px-6 py-3 rounded-lg hover:bg-brand-green/90 font-semibold"
                  >
                    Browse Gigs
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

