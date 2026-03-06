'use client';

import Image from 'next/image';
import { User } from 'lucide-react';

interface SuperVerifiedAvatarProps {
    src?: string | null;
    name?: string;
    size?: number;        // px — controls both image and container
    isVerified?: boolean;
    isSuperVerified?: boolean;
    isLevel2?: boolean;
    isTopSeller?: boolean;
    showBadge?: boolean;  // If false, only show ring (no corner badge) — useful for header
    className?: string;
}

/**
 * Drop-in avatar component with verification rings:
 * - Top Seller (level_3): purple gradient ring
 * - Level 2: golden gradient ring
 * - Trust Verified (trust_score >= 200): gold ring
 * - Verified (trust_score >= 100): green ring
 */
export default function SuperVerifiedAvatar({
    src,
    name,
    size = 40,
    isVerified = false,
    isSuperVerified = false,
    isLevel2 = false,
    isTopSeller = false,
    showBadge = true,
    className = '',
}: SuperVerifiedAvatarProps) {
    const isTop = isTopSeller;
    const isL2 = isLevel2;
    const ringClass = isTop
        ? ''
        : isL2
            ? ''
            : isSuperVerified
                ? 'ring-2 ring-offset-2 ring-yellow-400 shadow-[0_0_10px_2px_rgba(234,179,8,0.5)]'
                : isVerified
                    ? 'ring-2 ring-offset-2 ring-green-500 shadow-[0_0_10px_1px_rgba(34,197,94,0.3)]'
                    : '';

    const title = isTop ? '🏆 Top Seller' : isL2 ? '⭐ Level 2 Seller' : isSuperVerified ? '⭐ Trust Verified Seller' : isVerified ? '✓ Verified' : name;

    const imageContent = (
        <>
            {src ? (
                <Image
                    src={src}
                    alt={name || 'Avatar'}
                    width={size}
                    height={size}
                    className="rounded-full object-cover w-full h-full"
                />
            ) : (
                <div
                    className="rounded-full bg-gray-200 flex items-center justify-center w-full h-full"
                >
                    <User className="text-gray-500" style={{ width: size * 0.5, height: size * 0.5 }} />
                </div>
            )}
        </>
    );

    const badgeContent = showBadge && (isTop ? (
        <span
            className="absolute -bottom-0.5 -right-0.5 leading-none select-none drop-shadow-md z-10"
            style={{ fontSize: Math.max(size * 0.3, 10) }}
            title="Top Seller"
        >
            🏆
        </span>
    ) : isL2 ? (
        <span
            className="absolute -bottom-0.5 -right-0.5 text-amber-500 leading-none select-none drop-shadow-sm"
            style={{ fontSize: Math.max(size * 0.3, 10) }}
            title="Level 2 Seller"
        >
            ⭐
        </span>
    ) : isSuperVerified ? (
        <span
            className="absolute -bottom-0.5 -right-0.5 text-yellow-400 leading-none select-none drop-shadow-sm"
            style={{ fontSize: Math.max(size * 0.3, 10) }}
            title="Trust Verified Seller"
        >
            ⭐
        </span>
    ) : isVerified ? (
        <span
            className="absolute bottom-0 right-0 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
            style={{ width: Math.max(size * 0.25, 12), height: Math.max(size * 0.25, 12) }}
            title="Verified Seller"
        >
            <svg className="w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </span>
    ) : null);

    if (isTop) {
        return (
            <div
                className={`relative rounded-full flex-shrink-0 p-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 shadow-[0_0_15px_4px_rgba(168,85,247,0.45)] ${className}`}
                style={{ width: size + 6, height: size + 6 }}
                title={title}
            >
                <div className="relative rounded-full overflow-hidden bg-white w-full h-full flex items-center justify-center">
                    {imageContent}
                </div>
                {badgeContent}
            </div>
        );
    }

    if (isL2) {
        return (
            <div
                className={`relative rounded-full flex-shrink-0 p-[3px] bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 shadow-[0_0_15px_4px_rgba(245,158,11,0.45)] ${className}`}
                style={{ width: size + 6, height: size + 6 }}
                title={title}
            >
                <div className="relative rounded-full overflow-hidden bg-white w-full h-full flex items-center justify-center">
                    {imageContent}
                </div>
                {badgeContent}
            </div>
        );
    }

    return (
        <div
            className={`relative rounded-full flex-shrink-0 ${ringClass} ${className}`}
            style={{ width: size, height: size }}
            title={title}
        >
            {imageContent}
            {badgeContent}
        </div>
    );
}
