'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  User, Edit, CheckCircle, Star, Package, Clock, TrendingUp,
  ShieldCheck, Zap, Award, Lock, ChevronRight, Mail, FileText,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerDashboardData } from '@/app/actions/seller';
import SuperVerifiedAvatar from '@/components/SuperVerifiedAvatar';
import SellerLevelBadge from '@/components/SellerLevelBadge';
import Link from 'next/link';

const LEVEL_CONFIG = [
  {
    code: 'level_0',
    label: 'New Seller',
    shortLabel: '0',
    color: 'gray',
    icon: <User className="h-4 w-4" />,
    perks: ['List up to 3 gigs', 'Bid on public tasks', 'Basic profile page'],
    requirements: null,
  },
  {
    code: 'level_1',
    label: 'Level 1 Seller',
    shortLabel: '1',
    color: 'green',
    icon: <Award className="h-4 w-4" />,
    perks: ['List up to 5 gigs', 'Priority listing in search', 'Level 1 badge on profile'],
    requirements: { trustScore: 100, completedOrders: 5, rating: 4.0, onTimeDelivery: 90 },
  },
  {
    code: 'level_2',
    label: 'Level 2 Seller',
    shortLabel: '2',
    color: 'amber',
    icon: <Star className="h-4 w-4" />,
    perks: ['Featured seller badge', 'Access to premium task bids', 'Dedicated support'],
    requirements: { trustScore: 200, completedOrders: 25, rating: 4.5, onTimeDelivery: 90 },
  },
  {
    code: 'level_3',
    label: "Top Seller",
    shortLabel: '3',
    color: 'purple',
    icon: <Zap className="h-4 w-4" />,
    perks: ['Homepage feature', 'Gold profile border', 'Exclusive buyer matching'],
    requirements: null, // Admin assigned
  },
];

export default function SellerProfilePage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [taskerData, setTaskerData] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [isHighRisk, setIsHighRisk] = useState(false);

  const loadProfile = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      router.push(`/${locale}/login?type=tasker`);
      return;
    }
    try {
      setLoading(true);
      const data = await getSellerDashboardData(user.id);
      if (data) {
        setTaskerData(data.tasker);
        setStats(data.stats);
        setIsHighRisk(data.isHighRisk || false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, router, locale]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-green" />
      </div>
    );
  }

  const trustScore = taskerData?.trust_score ?? 0;
  const levelCode = taskerData?.level_code || 'level_0';
  const completedOrders = taskerData?.completed_tasks ?? 0;
  const rating = Number(taskerData?.rating ?? 0);
  const onTimeRate = Number(taskerData?.on_time_delivery_rate ?? 0);

  const isVerified = trustScore >= 100;
  const isSuperVerified = trustScore >= 200;

  const currentLevelIdx = LEVEL_CONFIG.findIndex(l => l.code === levelCode);
  const currentLevel = LEVEL_CONFIG[currentLevelIdx] ?? LEVEL_CONFIG[0];
  const nextLevel = LEVEL_CONFIG[currentLevelIdx + 1] ?? null;

  // Trust Score progress for three-segment bar (0→100→200→250)
  const verifiedProgress = Math.min((trustScore / 100) * 100, 100);
  const midProgress = trustScore >= 100 ? Math.min(((trustScore - 100) / 100) * 100, 100) : 0;
  const trustVerifiedProgress = trustScore >= 200 ? Math.min(((trustScore - 200) / 50) * 100, 100) : 0;

  // Next level requirement checks
  const checks = nextLevel?.requirements ? {
    trustScore: trustScore >= nextLevel.requirements.trustScore,
    completedOrders: completedOrders >= nextLevel.requirements.completedOrders,
    rating: rating >= nextLevel.requirements.rating,
    onTimeDelivery: onTimeRate >= nextLevel.requirements.onTimeDelivery,
  } : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* ── Hero Card ── */}
      <div className={`relative rounded-2xl p-6 shadow-lg overflow-hidden ${
        levelCode === 'level_3'
          ? 'bg-gradient-to-br from-purple-600 via-purple-700 to-pink-700 shadow-purple-500/20'
          : levelCode === 'level_2'
            ? 'bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-700 shadow-amber-500/20'
            : 'bg-gradient-to-br from-brand-green/90 to-emerald-700'
      }`}>
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-8 translate-y-8" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex-shrink-0">
            <SuperVerifiedAvatar
              src={taskerData?.user?.profile_image_url}
              name={user?.firstName}
              size={72}
              isVerified={isVerified}
              isSuperVerified={isSuperVerified}
              isLevel2={levelCode === 'level_2'}
              isTopSeller={levelCode === 'level_3'}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">
                {user?.firstName} {user?.lastName}
              </h1>
              <SellerLevelBadge level={levelCode} size="sm" />
              {isSuperVerified && (
                <span className="text-xs font-bold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                  ⭐ Trust Verified
                </span>
              )}
              {levelCode === 'level_3' && (
                <span className="text-xs font-bold bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  🏆 Top Seller
                </span>
              )}
              {isVerified && !isSuperVerified && (
                <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <p className={`text-sm truncate max-w-xs ${levelCode === 'level_3' ? 'text-purple-200' : levelCode === 'level_2' ? 'text-amber-100' : 'text-green-100'}`}>{user?.email}</p>
            {taskerData?.bio && (
              <p className={`text-sm mt-1 line-clamp-2 ${levelCode === 'level_3' ? 'text-purple-100/80' : levelCode === 'level_2' ? 'text-amber-100/80' : 'text-green-50/80'}`}>{taskerData.bio}</p>
            )}
          </div>

          <Link
            href={`/${locale}/seller/dashboard/profile/edit`}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white font-semibold text-sm rounded-xl transition shadow-sm ${
              levelCode === 'level_3' ? 'text-purple-600 hover:bg-purple-50' : levelCode === 'level_2' ? 'text-amber-700 hover:bg-amber-50' : 'text-brand-green hover:bg-green-50'
            }`}
          >
            <Edit className="h-4 w-4" /> Edit Profile
          </Link>
        </div>

        {/* Stats row */}
        <div className="relative grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20">
          {[
            { label: 'Total Orders', value: stats.totalOrders ?? 0, icon: <Package className="h-4 w-4 text-green-200" /> },
            { label: 'Completed', value: completedOrders, icon: <CheckCircle className="h-4 w-4 text-green-200" /> },
            { label: 'Rating', value: rating > 0 ? rating.toFixed(1) : '—', icon: <Star className="h-4 w-4 text-yellow-300" /> },
            { label: 'On Time', value: onTimeRate > 0 ? `${Math.round(onTimeRate)}%` : '—', icon: <Clock className="h-4 w-4 text-green-200" /> },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <div className="text-xl font-black text-white">{s.value}</div>
              <div className={`text-[10px] font-medium uppercase tracking-wide ${levelCode === 'level_2' ? 'text-amber-200' : 'text-green-200'}`}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust Score Card ── */}
      <div className={`rounded-2xl border shadow-sm p-6 ${
        levelCode === 'level_3' ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200' : levelCode === 'level_2' ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Trust Score</h2>
            <p className="text-xs text-gray-500 mt-0.5">Earned through document verification</p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-black ${levelCode === 'level_3' ? 'text-purple-600' : levelCode === 'level_2' ? 'text-amber-600' : 'text-brand-green'}`}>{trustScore}</span>
            <span className="text-sm text-gray-400"> / 250</span>
          </div>
        </div>

        {/* Three-segment progress bar */}
        <div className="mb-3">
          <div className="flex gap-1">
            {/* Segment 1: 0→100 (Verified) */}
            <div className="flex-[2]">
              <div className="w-full bg-gray-100 rounded-l-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-l-full bg-gradient-to-r from-brand-green to-emerald-400 transition-all duration-700"
                  style={{ width: `${verifiedProgress}%` }}
                />
              </div>
              <div className={`mt-1 text-center text-[10px] font-bold ${isVerified ? 'text-green-600' : 'text-gray-400'}`}>
                {isVerified ? '✅ Verified' : '🔒 Verified'}
              </div>
            </div>
            <div className="w-3 flex-shrink-0 flex items-center justify-center mb-4">
              <div className="w-0.5 h-3 bg-gray-300 rounded" />
            </div>
            {/* Segment 2: 100→200 (Trust Verified) */}
            <div className="flex-[2]">
              <div className="w-full bg-gray-100 h-3 overflow-hidden">
                <div
                  className="h-3 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-700"
                  style={{ width: `${midProgress}%` }}
                />
              </div>
              <div className={`mt-1 text-center text-[10px] font-bold ${trustScore >= 200 ? 'text-amber-600' : 'text-gray-400'}`}>
                {trustScore >= 200 ? '⭐ Trust Verified' : '🔒 Trust Verified'}
              </div>
            </div>
            <div className="w-3 flex-shrink-0 flex items-center justify-center mb-4">
              <div className="w-0.5 h-3 bg-gray-300 rounded" />
            </div>
            {/* Segment 3: 200→250 (Top Seller — admin-only) */}
            <div className="flex-1">
              <div className="w-full bg-gray-100 rounded-r-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-r-full bg-gradient-to-r from-orange-500 to-red-400 transition-all duration-700"
                  style={{ width: `${trustVerifiedProgress}%` }}
                />
              </div>
              <div className={`mt-1 text-center text-[10px] font-bold ${trustScore >= 250 ? 'text-orange-600' : 'text-gray-400'}`}>
                {trustScore >= 250 ? '🏆 Top Seller' : '🔒 Top Seller'}
              </div>
            </div>
          </div>
        </div>

        {/* What to do next */}
        {!isSuperVerified && (
          <div className={`mt-4 rounded-xl p-4 border ${trustScore >= 200 ? 'bg-orange-50 border-orange-200' : isVerified ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
            <p className={`text-xs font-bold mb-2 ${trustScore >= 200 ? 'text-orange-700' : isVerified ? 'text-yellow-700' : 'text-blue-700'}`}>
              {trustScore >= 200 ? '🏆 Top Seller tier — last 50 pts (admin-only)' : isVerified ? '⭐ Next milestone: Trust Verified (200 pts)' : '🎯 Next milestone: Verified (100 pts)'}
            </p>
            {!isVerified && (
              <p className="text-xs text-blue-600">
                Upload your <strong>NIC Front &amp; Back</strong> and <strong>Proof of Address</strong> to get verified.
                {isHighRisk && ' As a high-risk seller, you also need to submit Life Insurance details.'}
              </p>
            )}
            {isVerified && trustScore < 200 && (
              <p className="text-xs text-yellow-600">
                You need <strong>{200 - trustScore} more points</strong>. Upload your <strong>Police Clearance Certificate</strong> (+100 pts) to reach Trust Verified.
              </p>
            )}
            {trustScore >= 200 && (
              <p className="text-xs text-orange-600">
                Only the top <strong>50 pts</strong> remain. This tier is unlocked exclusively through our <strong>Top Seller programme</strong>.
              </p>
            )}
            <Link
              href={`/${locale}/seller/dashboard/verifications`}
              className={`inline-flex items-center gap-1 text-xs font-bold mt-2 ${trustScore >= 200 ? 'text-orange-700 hover:text-orange-800' : isVerified ? 'text-yellow-700 hover:text-yellow-800' : 'text-blue-700 hover:text-blue-800'}`}
            >
              Go to Verifications <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
        {isSuperVerified && (
          <div className="mt-4 rounded-xl p-4 bg-yellow-50 border border-yellow-200 flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-sm font-bold text-yellow-700">Maximum trust level reached!</p>
              <p className="text-xs text-yellow-600">You're Trust Verified. Buyers can see your gold star on your profile.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Level Progression Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-1">Seller Level</h2>
        <p className="text-xs text-gray-500 mb-5">Your level is based on your performance history on EasyFinder</p>

        {/* Level journey stepper */}
        <div className="flex items-center gap-0 mb-6 overflow-x-auto pb-2">
          {LEVEL_CONFIG.map((lvl, idx) => {
            const isCurrentLevel = lvl.code === levelCode;
            const isPassed = currentLevelIdx > idx;
            const colorMap: Record<string, string> = {
              gray: 'bg-gray-200 text-gray-600 border-gray-300',
              green: 'bg-brand-green text-white border-brand-green',
              amber: 'bg-amber-500 text-white border-amber-500',
              purple: 'bg-purple-600 text-white border-purple-600',
            };
            const activeColor = colorMap[lvl.color];
            const isLast = idx === LEVEL_CONFIG.length - 1;

            return (
              <div key={lvl.code} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-black text-sm shadow-sm transition-all ${isCurrentLevel || isPassed ? activeColor : 'bg-gray-100 text-gray-400 border-gray-200'} ${isCurrentLevel ? (lvl.color === 'purple' ? 'ring-4 ring-purple-500/20 scale-110' : lvl.color === 'amber' ? 'ring-4 ring-amber-500/20 scale-110' : 'ring-4 ring-brand-green/20 scale-110') : ''}`}>
                    {isPassed ? <CheckCircle className="h-5 w-5" /> : lvl.shortLabel}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-semibold whitespace-nowrap ${isCurrentLevel ? (lvl.color === 'purple' ? 'text-purple-600' : lvl.color === 'amber' ? 'text-amber-700' : 'text-brand-green') : isPassed ? 'text-gray-600' : 'text-gray-400'}`}>
                    {isCurrentLevel ? <><span className={`px-1.5 py-0.5 rounded-full ${lvl.color === 'purple' ? 'bg-purple-500/10 text-purple-600' : lvl.color === 'amber' ? 'bg-amber-500/10 text-amber-700' : 'bg-brand-green/10 text-brand-green'}`}>You are here</span></> : lvl.label}
                  </span>
                </div>
                {!isLast && (
                  <div className={`h-0.5 w-10 sm:w-16 md:w-20 mx-1 rounded-full flex-shrink-0 ${isPassed ? (currentLevel.color === 'purple' ? 'bg-purple-500' : currentLevel.color === 'amber' ? 'bg-amber-500' : 'bg-brand-green') : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Next level requirements */}
        {nextLevel && nextLevel.requirements && checks && (
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className={`h-4 w-4 ${levelCode === 'level_3' ? 'text-purple-600' : levelCode === 'level_2' ? 'text-amber-600' : 'text-brand-green'}`} />
              <p className="text-sm font-bold text-gray-800">Requirements to reach {nextLevel.label}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: `${nextLevel.requirements.trustScore} Trust Score`, current: trustScore, target: nextLevel.requirements.trustScore, met: checks.trustScore, display: `${trustScore}/${nextLevel.requirements.trustScore}` },
                { label: `${nextLevel.requirements.completedOrders} Completed Orders`, current: completedOrders, target: nextLevel.requirements.completedOrders, met: checks.completedOrders, display: `${completedOrders}/${nextLevel.requirements.completedOrders}` },
                { label: `${nextLevel.requirements.rating}+ Rating`, current: rating, target: nextLevel.requirements.rating, met: checks.rating, display: rating > 0 ? `${rating.toFixed(1)}/${nextLevel.requirements.rating}` : 'No rating yet' },
                { label: `${nextLevel.requirements.onTimeDelivery}% On-Time Delivery`, current: onTimeRate, target: nextLevel.requirements.onTimeDelivery, met: checks.onTimeDelivery, display: completedOrders > 0 ? `${onTimeRate}%` : 'Need orders first' },
              ].map((req, i) => (
                <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${req.met ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${req.met ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {req.met ? <CheckCircle className="h-3.5 w-3.5 text-white" /> : <Lock className="h-3 w-3 text-gray-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${req.met ? 'text-green-700' : 'text-gray-700'}`}>{req.label}</p>
                    <p className={`text-[10px] ${req.met ? 'text-green-600' : 'text-gray-400'}`}>{req.display}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Level 3 message */}
        {levelCode === 'level_3' && (
          <div className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-4 flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-sm font-bold text-purple-700">Top Seller</p>
              <p className="text-xs text-purple-600">You've reached the highest seller tier — manually assigned by our team!</p>
            </div>
          </div>
        )}

        {/* Level perks */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentLevel.perks.map((perk, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className={`h-4 w-4 flex-shrink-0 ${levelCode === 'level_3' ? 'text-purple-600' : levelCode === 'level_2' ? 'text-amber-600' : 'text-brand-green'}`} />
              {perk}
            </div>
          ))}
        </div>
      </div>

      {/* ── Profile Info Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Profile Information</h2>
          <Link
            href={`/${locale}/seller/dashboard/profile/edit`}
            className={`flex items-center gap-1.5 text-sm font-medium hover:underline ${levelCode === 'level_3' ? 'text-purple-600 hover:text-purple-700' : levelCode === 'level_2' ? 'text-amber-700 hover:text-amber-800' : 'text-brand-green hover:text-green-700'}`}
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Link>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Full Name</p>
              <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Email</p>
              <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
            </div>
          </div>
          {taskerData?.bio && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Bio</p>
                <p className="text-sm text-gray-800 leading-relaxed">{taskerData.bio}</p>
              </div>
            </div>
          )}
          {isHighRisk && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <Shield className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <p className="text-xs text-orange-700 font-medium">You offer <strong>high-risk services</strong>. Additional verification is required.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
