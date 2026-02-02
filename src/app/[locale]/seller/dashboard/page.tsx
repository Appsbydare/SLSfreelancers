'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { getSellerDashboardData } from '@/app/actions/seller';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [taskerData, setTaskerData] = useState<any>(null);
  const [stats, setStats] = useState({
    activeGigs: 0,
    activeOrders: 0,
    totalEarnings: 0
  });

  const loadDashboardData = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?type=tasker');
      return;
    }

    // Ensure user is tasker (optional check, or simple redirect)
    if (user.userType !== 'tasker') {
      // Maybe redirect to become-tasker or home
    }

    try {
      setLoading(true);
      const data = await getSellerDashboardData(user.id);

      if (data) {
        setTaskerData(data.tasker);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (authLoading || loading) {
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your business overview</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.activeGigs}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
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
                LKR {stats.totalEarnings.toLocaleString()}
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
