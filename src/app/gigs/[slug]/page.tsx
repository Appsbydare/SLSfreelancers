'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, Clock, CheckCircle, MapPin, Shield, ArrowLeft, Heart } from 'lucide-react';
import GigPackageSelector from '@/components/GigPackageSelector';
import SellerLevelBadge from '@/components/SellerLevelBadge';
import RequirementsForm from '@/components/RequirementsForm';
import { Gig, GigPackage } from '@/types';

export default function GigDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [gig, setGig] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<GigPackage | null>(null);
  const [showRequirements, setShowRequirements] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    params.then(({ slug: slugValue }) => {
      setSlug(slugValue);
    });
  }, [params]);

  useEffect(() => {
    if (slug) {
      fetchGigDetails();
    }
  }, [slug]);

  const fetchGigDetails = async () => {
    try {
      // Extract ID from slug (format: title-slug-timestamp)
      const gigId = slug.split('-').pop();
      
      const response = await fetch(`/api/gigs/${gigId}`);
      if (response.ok) {
        const data = await response.json();
        setGig(data.gig);
      } else {
        console.error('Gig not found');
      }
    } catch (error) {
      console.error('Error fetching gig:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (packageId: string, packageData: GigPackage) => {
    setSelectedPackage(packageData);
    if (gig?.requirements && gig.requirements.length > 0) {
      setShowRequirements(true);
    } else {
      handleContinueToCheckout({});
    }
  };

  const handleContinueToCheckout = (requirementsResponse: Record<string, any>) => {
    if (!selectedPackage) return;

    // Store order details in session storage
    sessionStorage.setItem('pendingOrder', JSON.stringify({
      gigId: gig.id,
      packageId: selectedPackage.id,
      packageTier: selectedPackage.tier,
      requirementsResponse,
    }));

    // Navigate to checkout
    router.push(`/checkout/gig/${gig.id}`);
  };

  const handleFavoriteToggle = async () => {
    setIsFavorited(!isFavorited);
    // TODO: Implement favorite API call
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gig details...</p>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gig not found</h1>
          <p className="text-gray-600 mb-4">The gig you&apos;re looking for doesn&apos;t exist or has been removed.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Browse
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="relative h-96 bg-gray-200">
                {gig.images && gig.images.length > 0 ? (
                  <>
                    <Image
                      src={gig.images[activeImageIndex]}
                      alt={gig.title}
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={handleFavoriteToggle}
                      className={`absolute top-4 right-4 p-3 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors ${
                        isFavorited ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      <Heart className={`h-6 w-6 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                    No Image Available
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {gig.images && gig.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {gig.images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                        activeImageIndex === index ? 'border-brand-green' : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${gig.title} - ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Category */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full mb-3">
                    {gig.category}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900">{gig.title}</h1>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm">
                {gig.reviewsCount > 0 && (
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                    <span className="font-semibold text-gray-900">{gig.rating.toFixed(1)}</span>
                    <span className="text-gray-500 ml-1">({gig.reviewsCount} reviews)</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <CheckCircle className="h-5 w-5 mr-1" />
                  <span>{gig.ordersCount} orders</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Gig</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                {gig.description}
              </div>

              {/* Tags */}
              {gig.tags && gig.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {gig.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Packages */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Select a Package</h2>
              <GigPackageSelector
                packages={gig.packages || []}
                selectedPackageId={selectedPackage?.id}
                onSelect={handlePackageSelect}
              />
            </div>

            {/* Requirements Modal */}
            {showRequirements && gig.requirements && gig.requirements.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Seller Requirements</h2>
                <RequirementsForm
                  requirements={gig.requirements}
                  userId={''} // Get from auth context
                  onSubmit={handleContinueToCheckout}
                />
              </div>
            )}

            {/* Reviews */}
            {gig.reviews && gig.reviews.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Reviews ({gig.reviewsCount})
                </h2>
                <div className="space-y-6">
                  {gig.reviews.slice(0, 5).map((review: any) => (
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
              </div>
            )}
          </div>

          {/* Sidebar - Seller Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Seller</h3>

              {/* Seller Profile */}
              <div className="flex items-center mb-4">
                <div className="relative h-16 w-16 mr-4">
                  {gig.sellerAvatar ? (
                    <Image
                      src={gig.sellerAvatar}
                      alt={gig.sellerName}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-brand-green/10 flex items-center justify-center">
                      <span className="text-brand-green text-xl font-semibold">
                        {gig.sellerName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{gig.sellerName}</h4>
                  <SellerLevelBadge level={gig.sellerLevel} size="sm" />
                </div>
              </div>

              {/* Seller Stats */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                {gig.sellerRating > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-semibold text-gray-900">
                        {gig.sellerRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed Orders</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {gig.sellerCompletedTasks}
                  </span>
                </div>
                {gig.sellerResponseTime > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {Math.round(gig.sellerResponseTime / 60)} hours
                    </span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {gig.sellerBio && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">About</h4>
                  <p className="text-sm text-gray-700 line-clamp-4">{gig.sellerBio}</p>
                </div>
              )}

              {/* Service Areas */}
              {gig.sellerServiceAreas && gig.sellerServiceAreas.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Service Areas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {gig.sellerServiceAreas.slice(0, 3).map((area: any, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {area.district}
                      </span>
                    ))}
                    {gig.sellerServiceAreas.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{gig.sellerServiceAreas.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Seller Button */}
              <button
                onClick={() => router.push(`/seller/${gig.seller.user.id}`)}
                className="w-full px-4 py-3 border border-brand-green text-brand-green rounded-lg hover:bg-brand-green/5 font-semibold transition-colors"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

