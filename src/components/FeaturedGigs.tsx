'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import GigCard from './GigCard';
import { Gig } from '@/types';

export default function FeaturedGigs() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedGigs();
  }, []);

  const fetchFeaturedGigs = async () => {
    try {
      const response = await fetch('/api/gigs?limit=8&sortBy=popular');
      if (response.ok) {
        const data = await response.json();
        setGigs(data.gigs || []);
      } else {
        // Silently fail - don't show errors on homepage
        console.warn('Failed to load featured gigs:', response.status);
        setGigs([]);
      }
    } catch (error) {
      // Silently fail - don't show errors on homepage
      console.warn('Error fetching featured gigs:', error);
      setGigs([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (gigs.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Popular Gigs
            </h2>
            <p className="text-lg text-gray-600">
              Ready-made services from top sellers
            </p>
          </div>
          <Link
            href="/browse-gigs"
            className="hidden md:flex items-center text-brand-green hover:text-brand-green/80 font-semibold group"
          >
            See all gigs
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gigs.slice(0, 8).map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/browse-gigs"
            className="inline-flex items-center text-brand-green hover:text-brand-green/80 font-semibold"
          >
            See all gigs
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

