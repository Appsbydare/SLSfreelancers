'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, CheckCircle, ArrowRight } from 'lucide-react';
import SellerLevelBadge from './SellerLevelBadge';

interface TopSellersProps {
  sellers: any[];
}

export default function TopSellers({ sellers = [] }: TopSellersProps) {
  // const [sellers, setSellers] = useState<any[]>([]); // Removed local state
  // const [loading, setLoading] = useState(true); // Removed local state
  const loading = false;

  // useEffect(() => {
  //   fetchTopSellers();
  // }, []);

  // fetchTopSellers removed

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4">
                  <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (sellers.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Top Sellers
            </h2>
            <p className="text-lg text-gray-600">
              Verified professionals ready to help
            </p>
          </div>
          <Link
            href="/browse-gigs?sellerLevel=top_performer"
            className="hidden md:flex items-center text-brand-green hover:text-brand-green/80 font-semibold group"
          >
            View all sellers
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {sellers.slice(0, 8).map((seller) => (
            <Link
              key={seller.id}
              href={`/seller/${seller.user?.id || seller.id}`}
              className="bg-white rounded-lg p-4 hover:shadow-lg transition-shadow text-center"
            >
              <div className="relative h-20 w-20 mx-auto mb-3">
                {seller.user?.profile_image_url ? (
                  <Image
                    src={seller.user.profile_image_url}
                    alt={`${seller.user?.first_name} ${seller.user?.last_name}`}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-brand-green/10 flex items-center justify-center">
                    <span className="text-brand-green text-2xl font-semibold">
                      {seller.user?.first_name?.charAt(0) || 'S'}
                    </span>
                  </div>
                )}
                {seller.level_code && (
                  <div className="absolute -bottom-1 -right-1">
                    <SellerLevelBadge level={seller.level_code} size="sm" showLabel={false} />
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                {seller.user?.first_name} {seller.user?.last_name?.charAt(0)}.
              </h3>

              {seller.rating > 0 && (
                <div className="flex items-center justify-center text-xs text-gray-600 mb-2">
                  <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                  <span className="font-semibold">{seller.rating.toFixed(1)}</span>
                  <span className="ml-1">({seller.total_reviews || 0})</span>
                </div>
              )}

              {seller.completed_tasks > 0 && (
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>{seller.completed_tasks} orders</span>
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/browse-gigs?sellerLevel=top_performer"
            className="inline-flex items-center text-brand-green hover:text-brand-green/80 font-semibold"
          >
            View all sellers
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

