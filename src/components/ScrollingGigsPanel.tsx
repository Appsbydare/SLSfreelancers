'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Award, ChevronLeft, ChevronRight, Clock, Star } from 'lucide-react';
import SellerLevelBadge from './SellerLevelBadge';
import VerifiedBadge from './VerifiedBadge';

interface ScrollingGigsPanelProps {
  gigs: any[];
  autoScroll?: boolean;
  scrollSpeed?: number; // legacy prop (kept for compatibility)
}

export default function ScrollingGigsPanel({
  gigs = [],
  autoScroll = false,
  scrollSpeed = 30 // legacy prop (kept for compatibility)
}: ScrollingGigsPanelProps) {
  // const [gigs, setGigs] = useState<any[]>([]); // Removed local state
  // const [loading, setLoading] = useState(true); // Removed local state
  const loading = false; // Always loaded since data passed as prop
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<number | null>(null);

  // Use scrollSpeed to avoid unused var warning
  const scrollInterval = scrollSpeed ? 3500 : 3500;

  // useEffect(() => {
  //   fetchFeaturedGigs();
  // }, []);

  // fetchFeaturedGigs removed

  const getScrollStep = () => {
    const container = scrollContainerRef.current;
    if (!container) return 0;
    const firstCard = container.firstElementChild as HTMLElement | null;
    if (!firstCard) return 0;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(container).gap || '0') || 0;
    return cardWidth + gap;
  };

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const step = getScrollStep();
    if (!step) return;

    const maxScroll = container.scrollWidth - container.clientWidth;
    const nextLeft = container.scrollLeft + direction * step;

    if (nextLeft < 0) {
      container.scrollTo({ left: maxScroll, behavior: 'smooth' });
      return;
    }
    if (nextLeft > maxScroll) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }

    container.scrollBy({ left: direction * step, behavior: 'smooth' });
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      window.clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    autoScrollIntervalRef.current = window.setInterval(() => {
      if (isPaused) return;
      scrollByCard(1);
    }, scrollInterval);
  }, [isPaused, scrollInterval, stopAutoScroll, scrollByCard]);

  useEffect(() => {
    if (!autoScroll || gigs.length === 0 || isPaused) {
      stopAutoScroll();
      return;
    }

    startAutoScroll();
    return () => stopAutoScroll();
  }, [autoScroll, gigs.length, isPaused, startAutoScroll, stopAutoScroll]);

  if (loading) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Loading featured gigs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (gigs.length === 0 && !loading) {
    // Show a message if no gigs are available
    return (
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Featured Services
            </h2>
            <p className="text-gray-600">
              Discover top-rated services from trusted sellers
            </p>
          </div>
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No featured services available at the moment. Check back soon!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 font-geom">
            Featured Services
          </h2>
          <p className="text-gray-600">
            Discover top-rated services from trusted sellers
          </p>
        </div>

        <div className="relative" style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <button
            type="button"
            aria-label="Scroll featured services left"
            onClick={() => scrollByCard(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center h-10 w-10 rounded-full bg-white/90 border border-gray-200 shadow hover:shadow-md hover:bg-white transition"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide py-4 px-4 sm:px-6 snap-x snap-mandatory scroll-smooth overscroll-x-contain"
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollPaddingInline: '1rem',
            }}
          >
            {gigs.map((gig, index) => (
              <GigCard
                key={`${gig.id}-${index}`}
                gig={gig}
                onCardHover={(isHovering) => setIsPaused(isHovering)}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Scroll featured services right"
            onClick={() => scrollByCard(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center h-10 w-10 rounded-full bg-white/90 border border-gray-200 shadow hover:shadow-md hover:bg-white transition"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

function GigCard({ gig, onCardHover }: { gig: any; onCardHover?: (isHovering: boolean) => void }) {
  const sellerName = gig.sellerName || `${gig.seller?.user?.first_name || ''} ${gig.seller?.user?.last_name || ''}`.trim() || 'Seller';
  const sellerAvatar = gig.sellerAvatar || gig.seller?.user?.profile_image_url;
  const sellerRating = gig.sellerRating || gig.seller?.rating;
  const startingPrice = gig.startingPrice || Math.min(...(gig.packages?.map((p: any) => p.price) || [0]));
  const ordersCount = gig.ordersCount || gig.orders_count || 0;

  return (
    <Link
      href={`/gigs/${gig.slug}`}
      className="flex-shrink-0 w-80 snap-start bg-white rounded-lg border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:shadow-brand-green/20 transition-all duration-300 hover:-translate-y-1 overflow-hidden group hover:border-brand-green/50 hover:ring-2 hover:ring-brand-green/30"
      style={{ scrollSnapStop: 'always' }}
      onMouseEnter={() => onCardHover?.(true)}
      onMouseLeave={() => onCardHover?.(false)}
    >
      {/* Gig Image */}
      <div className="relative h-48 bg-gray-200">
        {gig.images && gig.images.length > 0 ? (
          <Image
            src={gig.images[0]}
            alt={gig.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Title & Description */}
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-brand-green transition-colors">
          {gig.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {gig.description}
        </p>

        {/* Seller Info */}
        <div className="mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center mb-2">
            {sellerAvatar ? (
              <div className="relative h-8 w-8 mr-2">
                <Image
                  src={sellerAvatar}
                  alt={sellerName}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-brand-green/10 flex items-center justify-center mr-2">
                <span className="text-brand-green text-xs font-semibold">
                  {sellerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">{sellerName}</p>
                {gig.isVerified && (
                  <VerifiedBadge size="sm" showText={false} />
                )}
              </div>
              {sellerRating && (
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                  <span className="text-xs text-gray-600">{sellerRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {gig.sellerLevel && (
              <SellerLevelBadge level={gig.sellerLevel} size="sm" />
            )}
            {gig.hasEasyFindersChoice && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-semibold">
                <Award className="h-3 w-3 mr-1" />
                EasyFinders Choice
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-500 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            <span>{ordersCount} orders</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Starting at</p>
            <p className="text-lg font-bold text-brand-green">
              LKR {startingPrice.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

