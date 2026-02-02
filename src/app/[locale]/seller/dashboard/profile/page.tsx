'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerDashboardData } from '@/app/actions/seller';

export default function SellerProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [taskerData, setTaskerData] = useState<any>(null);

  const loadProfile = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?type=tasker');
      return;
    }

    try {
      setLoading(true);
      const data = await getSellerDashboardData(user.id);

      if (data) {
        setTaskerData(data.tasker);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your seller profile and settings</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <p className="text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>

          {taskerData && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <p className="text-gray-900">{taskerData.bio || 'No bio set'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <p className="text-gray-900">{taskerData.rating?.toFixed(1) || '0.0'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Completed Tasks</label>
                <p className="text-gray-900">{taskerData.completed_tasks || 0}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio</h2>
        <p className="text-gray-600 mb-4">
          Showcase your best work to attract more customers. Portfolio management coming soon.
        </p>
        <button
          disabled
          className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
        >
          Add Portfolio Item
        </button>
      </div>
    </div>
  );
}

