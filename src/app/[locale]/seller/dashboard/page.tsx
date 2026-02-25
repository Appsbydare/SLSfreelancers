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
  Edit,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import SellerLevelBadge from '@/components/SellerLevelBadge';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerDashboardData } from '@/app/actions/seller';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [taskerData, setTaskerData] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
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
        setVerifications(data.verifications || []);
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

  const getLatestDoc = (type: string) => {
    const typeVerifs = verifications.filter((v: any) => v.verification_type === type);
    if (typeVerifs.length === 0) return null;
    return typeVerifs.reduce((latest: any, current: any) =>
      new Date(current.submitted_at).getTime() > new Date(latest.submitted_at).getTime() ? current : latest
    );
  };

  const docTypes = [
    { key: 'nic_front', required: true },
    { key: 'nic_back', required: true },
    { key: 'address_proof', required: true }
  ];

  const hasUploadedAllMandatory = docTypes.every(d => !!getLatestDoc(d.key));
  const hasRejectedDocs = docTypes.some(d => getLatestDoc(d.key)?.status === 'rejected');
  const hasPendingMandatory = docTypes.some(d => {
    const doc = getLatestDoc(d.key);
    return doc && (doc.status === 'submitted' || doc.status === 'pending');
  });

  const isActuallyVerified = user?.isVerified || taskerData?.user?.is_verified;

  const getProgressStyles = () => {
    if (isActuallyVerified) {
      return {
        box: 'bg-green-50 border-green-200',
        bannerBox: 'bg-green-50 border-green-200',
        step1: 'bg-brand-green text-white',
        line1: 'bg-brand-green',
        step2: 'bg-brand-green text-white',
        line2: 'bg-brand-green',
        step3: 'bg-brand-green text-white ring-4 ring-green-100',
        text1: 'text-gray-900',
        text2: 'text-gray-900',
        text3: 'text-gray-900',
        icon: 'text-brand-green'
      };
    }
    if (hasRejectedDocs) {
      return {
        box: 'bg-red-50 border-red-200',
        bannerBox: 'bg-white border-red-200',
        step1: hasUploadedAllMandatory ? 'bg-brand-green text-white' : 'bg-red-500 text-white',
        line1: hasUploadedAllMandatory ? 'bg-brand-green' : 'bg-red-300',
        step2: 'bg-red-500 text-white ring-4 ring-red-100',
        line2: 'bg-gray-200 border-t border-dashed border-gray-300',
        step3: 'bg-gray-200 text-gray-500',
        text1: 'text-gray-900',
        text2: 'text-red-700 font-bold',
        text3: 'text-gray-500',
        icon: 'text-red-500'
      };
    }
    if (hasUploadedAllMandatory) {
      return {
        box: 'bg-orange-50 border-orange-200',
        bannerBox: 'bg-white border-orange-200',
        step1: 'bg-brand-green text-white',
        line1: 'bg-brand-green',
        step2: 'bg-orange-500 text-white ring-4 ring-orange-100',
        line2: 'bg-gray-200 border-t border-dashed border-gray-300',
        step3: 'bg-gray-200 text-gray-500',
        text1: 'text-gray-900',
        text2: 'text-orange-700 font-bold',
        text3: 'text-gray-500',
        icon: 'text-orange-500'
      };
    }
    return {
      box: 'bg-blue-50 border-blue-200',
      bannerBox: 'bg-white border-blue-200',
      step1: 'bg-blue-600 text-white ring-4 ring-blue-100',
      line1: 'bg-gray-200',
      step2: 'bg-gray-200 text-gray-500',
      line2: 'bg-gray-200 border-t border-dashed border-gray-300',
      step3: 'bg-gray-200 text-gray-500',
      text1: 'text-blue-700 font-bold',
      text2: 'text-gray-500',
      text3: 'text-gray-500',
      icon: 'text-blue-500'
    };
  };

  const pStyles = getProgressStyles();

  useEffect(() => {
    // Sync cache if backend says verified but context doesn't
    if (taskerData?.user?.is_verified && !user?.isVerified && refreshProfile) {
      refreshProfile();
    }
  }, [taskerData?.user?.is_verified, user?.isVerified, refreshProfile]);

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

      {/* Pending Verification Banner & Progress */}
      {user && !isActuallyVerified && (
        <div className={`mb-8 border rounded-lg shadow-sm overflow-hidden ${pStyles.bannerBox}`}>
          <div className={`border-b p-4 ${pStyles.box}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldCheck className={`h-5 w-5 ${pStyles.icon}`} />
              </div>
              <div className="ml-3 flex-1">
                <h3 className={`text-sm font-medium ${hasRejectedDocs ? 'text-red-800' : hasUploadedAllMandatory ? 'text-orange-800' : 'text-blue-800'}`}>
                  {hasRejectedDocs
                    ? 'Action Required: Document Rejected'
                    : hasUploadedAllMandatory
                      ? 'Verification in Progress'
                      : 'Action Required: Upload Identity Documents'}
                </h3>
                <div className={`mt-2 text-sm ${hasRejectedDocs ? 'text-red-700' : hasUploadedAllMandatory ? 'text-orange-700' : 'text-blue-700'}`}>
                  <p>
                    {hasRejectedDocs
                      ? "One or more of your submitted documents were rejected. Please review the reason and re-submit a valid document to unlock your account."
                      : hasUploadedAllMandatory
                        ? "Your documents have been successfully uploaded and are currently being reviewed by our team. We will notify you once your account is fully verified."
                        : "To activate your seller account and start accepting orders, you must upload your National Identity Card and Proof of Address for verification."}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/seller/dashboard/verifications"
                    className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-md transition ${hasRejectedDocs ? 'bg-red-600 hover:bg-red-700' : hasUploadedAllMandatory ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                  >
                    {hasUploadedAllMandatory && !hasRejectedDocs ? 'Check Verification Status' : 'Upload Documents'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-all ${pStyles.step1}`}>1</div>
              <div className={`h-1.5 mx-2 w-full transition-all rounded-full ${pStyles.line1}`}></div>
              <div className={`text-sm whitespace-nowrap hidden md:block mr-2 transition-all ${pStyles.text1}`}>Upload Documents</div>

              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-all ${pStyles.step2}`}>2</div>
              <div className={`h-1.5 mx-2 w-full transition-all ${pStyles.line2}`}></div>
              <div className={`text-sm whitespace-nowrap hidden md:block mr-2 transition-all ${pStyles.text2}`}>{hasRejectedDocs ? 'Action Required' : 'In Review'}</div>

              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-all ${pStyles.step3}`}>3</div>
              <div className={`text-sm font-semibold whitespace-nowrap hidden md:block ml-2 transition-all ${pStyles.text3}`}>Verified</div>
            </div>
          </div>
        </div>
      )}

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
          href={isActuallyVerified ? "/seller/dashboard/gigs" : "#"}
          onClick={(e) => {
            if (!isActuallyVerified) {
              e.preventDefault();
              toast.error("Please complete verification to manage gigs.");
            }
          }}
          className={`bg-white rounded-lg shadow p-6 transition-shadow ${user?.isVerified ? 'hover:shadow-lg' : 'opacity-70 cursor-not-allowed'}`}
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
          href={isActuallyVerified ? "/seller/dashboard/orders" : "#"}
          onClick={(e) => {
            if (!isActuallyVerified) {
              e.preventDefault();
              toast.error("Please complete verification to manage orders.");
            }
          }}
          className={`bg-white rounded-lg shadow p-6 transition-shadow ${user?.isVerified ? 'hover:shadow-lg' : 'opacity-70 cursor-not-allowed'}`}
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
