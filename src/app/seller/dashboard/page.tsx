'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Star, 
  Clock, 
  DollarSign, 
  Package,
  TrendingUp,
  Edit
} from 'lucide-react';
import SellerLevelBadge from '@/components/SellerLevelBadge';

export default function SellerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [taskerData, setTaskerData] = useState<any>(null);
  const [gigs, setGigs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login?type=tasker');
        return;
      }

      const userData = JSON.parse(userStr);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => ['pending', 'in_progress', 'delivered'].includes(o.status));
  const activeGigs = gigs.filter(g => g.status === 'active');
  const totalEarnings = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + parseFloat(o.sellerEarnings || o.seller_earnings || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your business overview</p>
      </div>

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
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
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
            href="/seller/dashboard/profile"
            className="text-brand-green hover:text-brand-green/80 flex items-center"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit Profile
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative h-20 w-20">
            {taskerData?.user?.profile_image_url ? (
              <Image
                src={taskerData.user.profile_image_url}
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
              {taskerData?.completed_tasks || 0} completed orders
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/seller/dashboard/gigs"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Manage Gigs</h3>
              <p className="text-gray-600 text-sm">View and manage all your service offerings</p>
            </div>
            <Package className="h-8 w-8 text-brand-green" />
          </div>
        </Link>

        <Link
          href="/seller/dashboard/orders"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">View Orders</h3>
              <p className="text-gray-600 text-sm">Track and manage your active orders</p>
            </div>
            <TrendingUp className="h-8 w-8 text-brand-green" />
          </div>
        </Link>
      </div>
    </div>
  );
}
