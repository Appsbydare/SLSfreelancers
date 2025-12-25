'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Star, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Package,
  Plus,
  Edit,
  Pause,
  Play,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import SellerLevelBadge from '@/components/SellerLevelBadge';

export default function SellerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [taskerData, setTaskerData] = useState<any>(null);
  const [gigs, setGigs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'gigs' | 'orders' | 'requests'>('gigs');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      
      const userData = JSON.parse(userStr);
      if (userData.userType !== 'tasker') {
        router.push('/');
        return;
      }
      
      setUser(userData);

      // Fetch tasker profile
      const profileResponse = await fetch(`/api/taskers/profile?userId=${userData.id}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setTaskerData(profileData.tasker);
      }

      // Fetch seller's gigs
      const gigsResponse = await fetch(`/api/gigs?sellerId=${userData.id}`);
      if (gigsResponse.ok) {
        const gigsData = await gigsResponse.json();
        setGigs(gigsData.gigs || []);
      }

      // Fetch seller's orders
      const ordersResponse = await fetch(`/api/orders?userId=${userData.id}&userType=seller&limit=10`);
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseGig = async (gigId: string) => {
    try {
      await fetch(`/api/gigs/${gigId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          status: 'paused',
        }),
      });
      loadDashboardData();
    } catch (error) {
      console.error('Error pausing gig:', error);
    }
  };

  const handleActivateGig = async (gigId: string) => {
    try {
      await fetch(`/api/gigs/${gigId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          status: 'active',
        }),
      });
      loadDashboardData();
    } catch (error) {
      console.error('Error activating gig:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => ['pending', 'in_progress', 'delivered'].includes(o.status));
  const activeGigs = gigs.filter(g => g.status === 'active');
  const totalEarnings = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + parseFloat(o.seller_earnings || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage your gigs, orders, and requests</p>
            </div>
            <Link
              href="/seller/gigs/create"
              className="flex items-center px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Gig
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-brand-green/10 rounded-lg p-3">
                <Star className="h-6 w-6 text-brand-green" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {taskerData?.rating ? taskerData.rating.toFixed(1) : '0.0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Gigs</p>
                <p className="text-2xl font-bold text-gray-900">{activeGigs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  LKR {totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Profile</h2>
            <Link
              href="/tasker/onboarding/stage-3"
              className="text-brand-green hover:text-brand-green/80 flex items-center"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative h-20 w-20">
              {taskerData?.profile_image_url ? (
                <Image
                  src={taskerData.profile_image_url}
                  alt={`${user?.firstName} ${user?.lastName}`}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-brand-green/10 flex items-center justify-center">
                  <span className="text-brand-green text-2xl font-semibold">
                    {user?.firstName?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h3>
              <div className="mt-1">
                <SellerLevelBadge level={taskerData?.level_code || 'starter_pro'} />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {taskerData?.completed_tasks || 0} completed orders • {taskerData?.total_reviews || 0} reviews
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('gigs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'gigs'
                    ? 'border-brand-green text-brand-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Gigs ({gigs.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-brand-green text-brand-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gig Orders ({activeOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-brand-green text-brand-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Custom Requests
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* My Gigs Tab */}
            {activeTab === 'gigs' && (
              <div className="space-y-4">
                {gigs.length > 0 ? (
                  gigs.map((gig) => (
                    <div key={gig.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        {gig.images && gig.images[0] && (
                          <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image src={gig.images[0]} alt={gig.title} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">{gig.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  gig.status === 'active' ? 'bg-green-100 text-green-700' :
                                  gig.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {gig.status}
                                </span>
                                <span className="flex items-center">
                                  <Eye className="h-4 w-4 mr-1" />
                                  {gig.views_count || 0} views
                                </span>
                                <span className="flex items-center">
                                  <Package className="h-4 w-4 mr-1" />
                                  {gig.orders_count || 0} orders
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                href={`/gigs/${gig.slug}`}
                                className="p-2 text-gray-600 hover:text-gray-900"
                                title="View"
                              >
                                <Eye className="h-5 w-5" />
                              </Link>
                              <Link
                                href={`/seller/gigs/${gig.id}/edit`}
                                className="p-2 text-blue-600 hover:text-blue-700"
                                title="Edit"
                              >
                                <Edit className="h-5 w-5" />
                              </Link>
                              {gig.status === 'active' ? (
                                <button
                                  onClick={() => handlePauseGig(gig.id)}
                                  className="p-2 text-yellow-600 hover:text-yellow-700"
                                  title="Pause"
                                >
                                  <Pause className="h-5 w-5" />
                                </button>
                              ) : gig.status === 'paused' ? (
                                <button
                                  onClick={() => handleActivateGig(gig.id)}
                                  className="p-2 text-green-600 hover:text-green-700"
                                  title="Activate"
                                >
                                  <Play className="h-5 w-5" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-3 text-sm">
                            <span className="font-medium text-brand-green">
                              Starting at LKR {gig.startingPrice?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No gigs yet</h3>
                    <p className="text-gray-600 mb-6">Create your first gig to start receiving orders</p>
                    <Link
                      href="/seller/gigs/create"
                      className="inline-flex items-center px-6 py-3 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 font-semibold"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Gig
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Gig Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-brand-green transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{order.gigTitle}</h3>
                          <p className="text-sm text-gray-600">Order #{order.order_number}</p>
                        </div>
                        <OrderStatusBadge status={order.status} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Customer: {order.customerName}</span>
                        <span className="font-semibold text-brand-green">
                          LKR {order.seller_earnings?.toLocaleString()}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600">Orders from your gigs will appear here</p>
                  </div>
                )}
              </div>
            )}

            {/* Custom Requests Tab */}
            {activeTab === 'requests' && (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Requests</h3>
                <p className="text-gray-600 mb-6">
                  Browse and bid on custom requests from buyers
                </p>
                <Link
                  href="/browse-tasks"
                  className="inline-flex items-center px-6 py-3 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 font-semibold"
                >
                  Browse Requests
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

