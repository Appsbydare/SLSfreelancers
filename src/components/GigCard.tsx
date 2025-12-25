'use client';

import { Star, Heart, Clock, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Gig } from '@/types';
import { useState } from 'react';

interface GigCardProps {
  gig: Gig;
  onFavoriteToggle?: (gigId: string) => void;
  isFavorited?: boolean;
}

export default function GigCard({ gig, onFavoriteToggle, isFavorited = false }: GigCardProps) {
  const [localFavorited, setLocalFavorited] = useState(isFavorited);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalFavorited(!localFavorited);
    onFavoriteToggle?.(gig.id);
  };

  return (
    <Link href={`/gigs/${gig.slug}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer">
        {/* Gig Image */}
        <div className="relative h-48 bg-gray-200">
          {gig.images && gig.images.length > 0 ? (
            <Image
              src={gig.images[0]}
              alt={gig.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
              No Image
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-2 right-2 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors ${
              localFavorited ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            <Heart className={`h-5 w-5 ${localFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="p-4">
          {/* Seller Info */}
          <div className="flex items-center mb-2">
            <div className="relative h-8 w-8 mr-2">
              {gig.sellerAvatar ? (
                <Image
                  src={gig.sellerAvatar}
                  alt={gig.sellerName}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-brand-green/10 flex items-center justify-center">
                  <span className="text-brand-green text-sm font-semibold">
                    {gig.sellerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{gig.sellerName}</p>
              <p className="text-xs text-gray-500">{getLevelDisplayName(gig.sellerLevel)}</p>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-2">
            {gig.title}
          </h3>

          {/* Rating & Reviews */}
          {gig.reviewsCount > 0 && (
            <div className="flex items-center mb-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
              <span className="text-sm font-semibold text-gray-900 mr-1">
                {gig.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">({gig.reviewsCount})</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center text-gray-500 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              <span>{gig.ordersCount} orders</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Starting at</p>
              <p className="text-lg font-bold text-brand-green">
                LKR {gig.startingPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getLevelDisplayName(level: string): string {
  const levels: Record<string, string> = {
    starter_pro: 'Starter Pro',
    trusted_specialist: 'Trusted Specialist',
    secure_elite: 'Secure Elite',
    top_performer: 'Top Performer',
  };
  return levels[level] || 'Seller';
}

