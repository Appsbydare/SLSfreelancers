'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock } from 'lucide-react';
import { Gig } from '@/types';

interface ScrollingGigsPanelProps {
  autoScroll?: boolean;
  scrollSpeed?: number; // pixels per second
}

export default function ScrollingGigsPanel({ 
  autoScroll = true, 
  scrollSpeed = 30 
}: ScrollingGigsPanelProps) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    fetchFeaturedGigs();
  }, []);

  useEffect(() => {
    if (autoScroll && gigs.length > 0 && !isPaused) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }

    return () => {
      stopAutoScroll();
    };
  }, [autoScroll, gigs.length, isPaused]);

  const fetchFeaturedGigs = async () => {
    try {
      const response = await fetch('/api/gigs?limit=20&sortBy=popular');
      if (response.ok) {
        const data = await response.json();
        const gigsData = data.gigs || [];
        // Filter for featured gigs or take top rated ones
        const featuredGigs = gigsData
          .filter((gig: any) => gig.is_featured || (gig.rating && gig.rating >= 4.5))
          .slice(0, 20);
        setGigs(featuredGigs.length > 0 ? featuredGigs : gigsData.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching featured gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAutoScroll = () => {
    if (!scrollContainerRef.current) return;

    const scroll = () => {
      if (!scrollContainerRef.current || isPaused) return;

      const now = Date.now();
      const deltaTime = (now - lastScrollTimeRef.current) / 1000; // Convert to seconds
      lastScrollTimeRef.current = now;

      const scrollAmount = scrollSpeed * deltaTime;
      scrollContainerRef.current.scrollLeft += scrollAmount;

      // Reset scroll position when reaching the end
      if (scrollContainerRef.current.scrollLeft >= 
          scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) {
        scrollContainerRef.current.scrollLeft = 0;
      }

      scrollAnimationRef.current = requestAnimationFrame(scroll);
    };

    scrollAnimationRef.current = requestAnimationFrame(scroll);
  };

  const stopAutoScroll = () => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };

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

  if (gigs.length === 0) {
    return null;
  }

  return (
    <div 
      className="py-12 bg-gradient-to-b from-gray-50 to-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Featured Services
          </h2>
          <p className="text-gray-600">
            Discover top-rated services from trusted sellers
          </p>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide"
          style={{
            scrollBehavior: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Duplicate gigs for seamless loop */}
          {[...gigs, ...gigs].map((gig, index) => (
            <GigCard key={`${gig.id}-${index}`} gig={gig} />
          ))}
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

function GigCard({ gig }: { gig: any }) {
  const sellerName = gig.sellerName || `${gig.seller?.user?.first_name || ''} ${gig.seller?.user?.last_name || ''}`.trim() || 'Seller';
  const sellerAvatar = gig.sellerAvatar || gig.seller?.user?.profile_image_url;
  const sellerRating = gig.sellerRating || gig.seller?.rating;
  const startingPrice = gig.startingPrice || Math.min(...(gig.packages?.map((p: any) => p.price) || [0]));
  const ordersCount = gig.ordersCount || gig.orders_count || 0;

  return (
    <Link 
      href={`/gigs/${gig.slug}`}
      className="flex-shrink-0 w-80 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
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
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center">
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
            <div>
              <p className="text-sm font-medium text-gray-900">{sellerName}</p>
              {sellerRating && (
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                  <span className="text-xs text-gray-600">{sellerRating.toFixed(1)}</span>
                </div>
              )}
            </div>
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

