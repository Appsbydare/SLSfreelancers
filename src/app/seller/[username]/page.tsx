'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, CheckCircle, Clock, MapPin, Calendar, MessageCircle } from 'lucide-react';
import GigCard from '@/components/GigCard';
import SellerLevelBadge from '@/components/SellerLevelBadge';

export default function PublicSellerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter();
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

  useEffect(() => {
    if (username) {
      loadSellerProfile();
    }
  }, [username]);

  const loadSellerProfile = async () => {
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
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-green to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start space-x-6">
            {/* Profile Image */}
            <div className="relative h-32 w-32 flex-shrink-0">
              {user?.profile_image_url ? (
                <Image
                  src={user.profile_image_url}
                  alt={`${user.first_name} ${user.last_name}`}
                  fill
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-white text-5xl font-semibold">
                    {user?.first_name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-white">
              <h1 className="text-4xl font-bold mb-2">
                {user?.first_name} {user?.last_name}
              </h1>
              <div className="mb-3">
                <SellerLevelBadge level={tasker?.level_code || 'starter_pro'} size="md" />
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
                {tasker?.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-current mr-1" />
                    <span className="font-semibold mr-1">{tasker.rating.toFixed(1)}</span>
                    <span className="opacity-90">({tasker.total_reviews || 0} reviews)</span>
                  </div>
                )}
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-1" />
                  <span>{tasker?.completed_tasks || 0} orders completed</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-1" />
                  <span>Member since {memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Contact Button */}
            <div className="hidden md:block">
              <button
                onClick={() => alert('Messaging feature coming soon')}
                className="flex items-center px-6 py-3 bg-white text-brand-green rounded-lg hover:bg-gray-50 font-semibold shadow-lg"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Contact Me
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About Section */}
            {tasker?.bio && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About Me</h2>
                <p className="text-gray-700 whitespace-pre-line">{tasker.bio}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
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
                    Gigs ({gigs.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'reviews'
                        ? 'border-brand-green text-brand-green'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Reviews ({reviews.length})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Gigs Tab */}
                {activeTab === 'gigs' && (
                  <div>
                    {gigs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {gigs.map((gig) => (
                          <GigCard key={gig.id} gig={gig} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-600">No active gigs at the moment</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    {reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review: any) => (
                          <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                            <div className="flex items-start">
                              <div className="relative h-10 w-10 mr-3 flex-shrink-0">
                                {review.reviewer?.profile_image_url ? (
                                  <Image
                                    src={review.reviewer.profile_image_url}
                                    alt={review.reviewer.first_name}
                                    fill
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-brand-green/10 flex items-center justify-center">
                                    <span className="text-brand-green font-semibold">
                                      {review.reviewer?.first_name?.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {review.reviewer?.first_name} {review.reviewer?.last_name}
                                  </h4>
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                    <span className="text-sm font-semibold text-gray-900">
                                      {review.rating}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-gray-700">{review.comment}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-600">No reviews yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Stats</h3>

              <div className="space-y-4">
                {tasker?.rating > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-semibold text-gray-900">
                        {tasker.rating.toFixed(1)} ({tasker.total_reviews || 0})
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed Orders</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {tasker?.completed_tasks || 0}
                  </span>
                </div>

                {tasker?.response_time_minutes > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ~{Math.round(tasker.response_time_minutes / 60)} hours
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Gigs</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {gigs.length}
                  </span>
                </div>
              </div>

              {/* Skills */}
              {tasker?.skills && tasker.skills.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {tasker.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Areas */}
              {seller.serviceAreas && seller.serviceAreas.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Service Areas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {seller.serviceAreas.slice(0, 5).map((area: any, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
                      >
                        {area.district}
                      </span>
                    ))}
                    {seller.serviceAreas.length > 5 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        +{seller.serviceAreas.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Button (Mobile) */}
              <div className="mt-6 md:hidden">
                <button
                  onClick={() => alert('Messaging feature coming soon')}
                  className="w-full flex items-center justify-center px-6 py-3 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 font-semibold"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact Me
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

