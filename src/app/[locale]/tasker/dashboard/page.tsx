'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Star,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Mail,
  Phone,
  Shield,
  Edit,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';

export default function TaskerDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [taskerData, setTaskerData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to login if not authenticated
      router.push('/login?type=tasker');
      return;
    }

    // Use logged-in user ID, fallback to session storage if needed (though session is cleared after onboarding)
    const userId = user.id;

    fetchTaskerProfile(userId);
  }, [user, authLoading, router]);

  const fetchTaskerProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/taskers/profile?userId=${userId}`);

      if (response.ok) {
        const data = await response.json();
        setTaskerData(data.tasker);
        setUserData(data.user);
      } else {
        console.error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tasker Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your profile and track your performance</p>
          </div>

          {/* Verification Status Banner */}
          {userData && !userData.is_verified && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Verification Pending</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Your documents are being reviewed. You&apos;ll receive an email once verification is complete.
                    This typically takes 1-2 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-brand-green/10 rounded-lg p-3">
                  <Star className="h-6 w-6 text-brand-green" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {taskerData?.rating || '0.0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {taskerData?.completed_tasks || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
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
                  <p className="text-2xl font-bold text-gray-900">LKR 0</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                  <button className="text-brand-green hover:text-brand-green/80">
                    <Edit className="h-5 w-5" />
                  </button>
                </div>

                <div className="text-center mb-6">
                  {userData?.profile_image_url ? (
                    <div className="relative h-24 w-24 mx-auto">
                      <Image
                        src={userData.profile_image_url}
                        alt="Profile"
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">
                    {userData?.first_name} {userData?.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{userData?.calling_name}</p>
                  {userData?.is_verified && (
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{userData?.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{userData?.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{userData?.city}, {userData?.district}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>LKR {taskerData?.hourly_rate || 0}/hour</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">About Me</h2>
                <p className="text-gray-600">
                  {taskerData?.bio || 'No bio available. Complete your profile to add a bio.'}
                </p>
              </div>

              {/* Skills */}
              {taskerData?.skills && taskerData.skills.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {taskerData.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Areas */}
              {taskerData?.tasker_service_areas && taskerData.tasker_service_areas.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Areas</h2>
                  <div className="flex flex-wrap gap-2">
                    {taskerData.tasker_service_areas.map((area: any) => (
                      <span
                        key={area.id}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {area.district}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {taskerData?.tasker_portfolio && taskerData.tasker_portfolio.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {taskerData.tasker_portfolio.map((item: any) => (
                      <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Tasks */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h2>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No tasks yet</p>
                  <p className="text-sm mt-1">Start browsing available tasks to get started</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

