'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, CheckCircle, Clock, MapPin, Calendar, MessageCircle, Shield, User, FileText, Package } from 'lucide-react';
import GigCard from '@/components/GigCard';
import SellerLevelBadge from '@/components/SellerLevelBadge';
import { useAuth } from '@/contexts/AuthContext';
import SuperVerifiedAvatar from '@/components/SuperVerifiedAvatar';

export default function PublicSellerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [gigs, setGigs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'gigs' | 'reviews' | 'portfolio'>('gigs');
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    params.then(({ username: usernameValue }) => {
      setUsername(usernameValue);
    });
  }, [params]);

  const loadSellerProfile = useCallback(async () => {
    try {
      // Fetch seller profile by user ID
      const profileResponse = await fetch(`/api/taskers/profile?userId=${username}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setSeller(profileData);

        // Fetch seller's active gigs
        const gigsResponse = await fetch(`/api/gigs?sellerId=${username}&status=active`);
        if (gigsResponse.ok) {
          const gigsData = await gigsResponse.json();
          setGigs(gigsData.gigs || []);
        }

        // Fetch seller reviews
        const reviewsResponse = await fetch(`/api/reviews?revieweeId=${username}&limit=20`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews || []);
        }

        // Fetch portfolio
        if (profileData.tasker?.id) {
          // Portfolio data would come from tasker_portfolio table
          // For now, we'll leave it empty
        }
      } else {
        console.error('Seller not found');
      }
    } catch (error) {
      console.error('Error loading seller profile:', error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      loadSellerProfile();
    }
  }, [username, loadSellerProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Seller not found</h1>
          <button
            onClick={() => router.push('/browse-gigs')}
            className="text-brand-green hover:underline font-semibold"
          >
            Browse all gigs
          </button>
        </div>
      </div>
    );
  }

  const user = seller.user;
  const tasker = seller.tasker;
  const memberSince = new Date(user?.created_at || Date.now());
  const isOwner = currentUser?.id === username;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-12">
        <div className={`relative rounded-2xl p-6 md:p-10 shadow-lg overflow-hidden mb-8 ${
          tasker?.level_code === 'level_3'
            ? 'bg-gradient-to-br from-purple-600 via-purple-700 to-pink-700 shadow-purple-500/20'
            : tasker?.level_code === 'level_2'
              ? 'bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-700 shadow-amber-500/20'
              : 'bg-gradient-to-br from-brand-green/90 to-emerald-700'
        }`}>
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-8 translate-y-8" />

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="flex-shrink-0">
              <SuperVerifiedAvatar
                src={user?.profile_image_url}
                name={user?.first_name}
                size={112}
                isVerified={(tasker?.trust_score ?? 0) >= 100}
                isSuperVerified={(tasker?.trust_score ?? 0) >= 200}
                isLevel2={tasker?.level_code === 'level_2'}
                isTopSeller={tasker?.level_code === 'level_3'}
                className="border-4 border-white shadow-xl bg-white"
              />
            </div>

            <div className="flex-1 min-w-0 mt-2">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-white">
                  {user?.first_name} {user?.last_name}
                </h1>
                <div className="flex flex-wrap justify-center items-center gap-2">
                  <SellerLevelBadge level={tasker?.level_code || 'level_0'} size="sm" />
                  {(tasker?.trust_score ?? 0) >= 200 && tasker?.level_code !== 'level_3' && (
                    <span className="text-xs font-bold bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      ⭐ Trust Verified
                    </span>
                  )}
                  {(tasker?.trust_score ?? 0) >= 100 && (tasker?.trust_score ?? 0) < 200 && (
                    <span className="text-xs font-bold bg-white/20 border border-white/30 backdrop-blur-sm text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Shield className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
              </div>

              <div className={`text-sm md:text-base font-medium mb-4 ${tasker?.level_code === 'level_3' ? 'text-purple-200' : tasker?.level_code === 'level_2' ? 'text-amber-100' : 'text-green-100'}`}>{user?.email}</div>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-white/90">
                {tasker?.rating > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 rounded-lg">
                    <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                    <span className="font-bold">{tasker.rating.toFixed(1)}</span>
                    <span className="text-white/70">({tasker.total_reviews || 0} reviews)</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span className="font-medium">{tasker?.completed_tasks || 0} orders completed</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-white/70" />
                  <span className="font-medium">Member since {memberSince.getFullYear()}</span>
                </div>
              </div>
            </div>

            {/* Contact Button */}
            {!isOwner && (
              <div className="mt-4 md:mt-2 flex-shrink-0">
                <button
                  onClick={() => alert('Messaging feature coming soon')}
                  className={`flex items-center px-6 py-3 bg-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                    tasker?.level_code === 'level_3' ? 'text-purple-600 hover:bg-purple-50' : tasker?.level_code === 'level_2' ? 'text-amber-700 hover:bg-amber-50' : 'text-brand-green hover:bg-gray-50'
                  }`}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact Me
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Trust Score Card ── */}
            <div className={`rounded-2xl border shadow-sm p-6 flex flex-col ${
              tasker?.level_code === 'level_3'
                ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                : tasker?.level_code === 'level_2'
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
                  : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Trust Score</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Earned through document verification</p>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-black ${tasker?.level_code === 'level_3' ? 'text-purple-600' : tasker?.level_code === 'level_2' ? 'text-amber-600' : 'text-brand-green'}`}>{tasker?.trust_score ?? 0}</span>
                  <span className="text-sm text-gray-400"> / 250 pts</span>
                </div>
              </div>

              {/* Three-segment progress bar — no numbers on bar */}
              <div className="mb-4 mt-2">
                <div className="flex gap-1 items-center">
                  {/* Segment 1: 0→100 Verified */}
                  <div className="flex-[3]">
                    <div className="w-full bg-gray-100 rounded-l-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-l-full bg-gradient-to-r from-brand-green to-emerald-400 transition-all duration-700"
                        style={{ width: `${Math.min(((tasker?.trust_score ?? 0) / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* Verified dot milestone */}
                  <div className={`w-4 h-4 rounded-full border-2 border-white flex-shrink-0 flex items-center justify-center ${(tasker?.trust_score ?? 0) >= 100 ? 'bg-brand-green' : 'bg-gray-200'} shadow-sm z-10`}>
                    {(tasker?.trust_score ?? 0) >= 100 && (
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {/* Segment 2: 100→200 Trust Verified */}
                  <div className="flex-[3]">
                    <div className="w-full bg-gray-100 h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-700"
                        style={{ width: `${(tasker?.trust_score ?? 0) >= 100 ? Math.min((((tasker?.trust_score ?? 0) - 100) / 100) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                  {/* Trust Verified dot milestone */}
                  <div className={`w-4 h-4 rounded-full border-2 border-white flex-shrink-0 flex items-center justify-center ${(tasker?.trust_score ?? 0) >= 200 ? 'bg-amber-400' : 'bg-gray-200'} shadow-sm z-10`}>
                    {(tasker?.trust_score ?? 0) >= 200 && <span className="text-[7px]">⭐</span>}
                  </div>
                  {/* Segment 3: 200→250 Top Seller (admin-only) */}
                  <div className="flex-1">
                    <div className="w-full bg-gray-100 rounded-r-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-r-full bg-gradient-to-r from-orange-500 to-red-400 transition-all duration-700"
                        style={{ width: `${(tasker?.trust_score ?? 0) >= 200 ? Math.min((((tasker?.trust_score ?? 0) - 200) / 50) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] font-medium text-gray-400">
                  <span className={(tasker?.trust_score ?? 0) >= 100 ? 'text-green-600 font-bold' : ''}>Verified</span>
                  <span className={(tasker?.trust_score ?? 0) >= 200 ? 'text-amber-600 font-bold' : ''}>Trust Verified</span>
                  <span className={(tasker?.trust_score ?? 0) >= 250 ? 'text-orange-600 font-bold' : ''}>Top Seller</span>
                </div>
              </div>

              {/* ── Profile Info Card ── */}
              <div className={`rounded-2xl border shadow-sm p-6 flex flex-col ${
                tasker?.level_code === 'level_3'
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                  : tasker?.level_code === 'level_2'
                    ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
                    : 'bg-white border-gray-100'
              }`}>
                <h2 className="text-base font-bold text-gray-900 mb-5">Profile Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Full Name</p>
                      <p className="text-sm font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                    </div>
                  </div>

                  {tasker?.bio && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Bio</p>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line break-words break-all">{tasker.bio}</p>
                      </div>
                    </div>
                  )}

                  {tasker?.skills && tasker.skills.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium mb-1.5">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tasker.skills.map((skill: string, index: number) => (
                            <span key={index} className="px-2.5 py-1 bg-gray-50 border border-gray-100 text-gray-700 text-xs rounded-lg font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {seller?.serviceAreas && seller.serviceAreas.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium mb-1.5">Service Areas</p>
                        <div className="flex flex-wrap gap-1.5">
                          {seller.serviceAreas.map((area: any, index: number) => (
                            <span key={index} className="px-2.5 py-1 bg-green-50 border border-green-100 text-green-700 text-xs rounded-lg font-medium">
                              {area.district}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Tabs Content ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50">
                <nav className="flex px-4" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('gigs')}
                    className={`py-4 px-6 border-b-2 font-bold text-sm transition-colors ${activeTab === 'gigs'
                      ? 'border-brand-green text-brand-green bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Gigs ({gigs.length})
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 px-6 border-b-2 font-bold text-sm transition-colors ${activeTab === 'reviews'
                      ? 'border-brand-green text-brand-green bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Reviews ({reviews.length})
                    </div>
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Gigs Tab */}
                {activeTab === 'gigs' && (
                  <div>
                    {gigs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {gigs.map((gig) => (
                          <GigCard key={gig.id} gig={gig} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-sm font-bold text-gray-900">No active gigs</h3>
                        <p className="text-gray-500 text-sm mt-1">This seller hasn't posted any gigs yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    {reviews.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {reviews.map((review: any) => (
                          <div key={review.id} className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col">
                            <div className="flex items-start">
                              <div className="relative h-12 w-12 mr-4 flex-shrink-0">
                                {review.reviewer?.profile_image_url ? (
                                  <Image
                                    src={review.reviewer.profile_image_url}
                                    alt={review.reviewer.first_name || 'Reviewer'}
                                    fill
                                    className="rounded-full object-cover shadow-sm ring-2 ring-gray-50"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-green/20 to-emerald-100 flex items-center justify-center shadow-sm">
                                    <span className="text-brand-green font-bold text-lg">
                                      {review.reviewer?.first_name?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                  <h4 className="font-bold text-gray-900 text-sm">
                                    {review.reviewer?.first_name} {review.reviewer?.last_name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                    <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded text-yellow-700">
                                      <Star className="h-3 w-3 fill-current mr-1" />
                                      <span className="text-xs font-bold">{review.rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  "{review.comment}"
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Star className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-sm font-bold text-gray-900">No reviews yet</h3>
                        <p className="text-gray-500 text-sm mt-1">This seller hasn't received any reviews yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
