'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { categories } from '@/data/categories';
import { Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface CategoryGridProps {
  autoScroll?: boolean;
  scrollSpeed?: number; // pixels per second
}

export default function CategoryGrid({ 
  autoScroll = true, 
  scrollSpeed = 25 
}: CategoryGridProps = {}) {
  const t = useTranslations('homepage.popularCategories');
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(Date.now());

  const getCategoryName = (category: typeof categories[0]) => {
    switch (locale) {
      case 'si':
        return category.nameSi;
      case 'ta':
        return category.nameTa;
      default:
        return category.name;
    }
  };

  const filteredCategories = categories.filter(category => {
    const name = getCategoryName(category).toLowerCase();
    const description = category.description.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || description.includes(query);
  });

  // Auto-scroll effect
  useEffect(() => {
    // Initialize scroll position to end for left-to-right scrolling
    if (scrollContainerRef.current) {
      const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollLeft = maxScroll;
    }
    
    if (autoScroll && filteredCategories.length > 0 && !isPaused) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }

    return () => {
      stopAutoScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScroll, filteredCategories.length, isPaused]);

  const startAutoScroll = () => {
    if (!scrollContainerRef.current) return;

    const scroll = () => {
      if (!scrollContainerRef.current || isPaused) return;

      const now = Date.now();
      const deltaTime = (now - lastScrollTimeRef.current) / 1000; // Convert to seconds
      lastScrollTimeRef.current = now;

      const scrollAmount = scrollSpeed * deltaTime;
      // Scroll left to right (opposite direction)
      scrollContainerRef.current.scrollLeft -= scrollAmount;

      // Reset scroll position when reaching the start (seamless loop)
      if (scrollContainerRef.current.scrollLeft <= 0) {
        const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollLeft = maxScroll;
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

  return (
    <div 
      id="popular-categories" 
      className="py-12 scroll-mt-20 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-fade-in-up font-geom">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Find the perfect person for any task, from home cleaning to business services.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {filteredCategories.length > 0 ? (
          <>
            <div className="relative" style={{ overflowX: 'auto', overflowY: 'visible' }}>
              <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide py-4"
                style={{
                  scrollBehavior: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {/* Duplicate categories multiple times for seamless infinite loop */}
                {[...filteredCategories, ...filteredCategories, ...filteredCategories].map((category, index) => (
                  <Link
                    key={`${category.id}-${index}`}
                    href={`/browse-gigs?category=${category.id}`}
                    className="flex-shrink-0 w-48 bg-white rounded-lg border-2 border-gray-200 shadow-lg p-6 hover:border-brand-green/50 hover:shadow-2xl hover:shadow-brand-green/20 transition-all duration-300 hover:-translate-y-2 group hover:ring-2 hover:ring-brand-green/30"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300 group-hover:rotate-6">
                        {category.icon}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-green transition-colors duration-300 mb-1">
                        {getCategoryName(category)}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
                        {category.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/browse-gigs"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-brand-green bg-brand-green/10 hover:bg-brand-green/20 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in-up"
                style={{ animationDelay: '800ms' }}
              >
                {t('viewAll')}
              </Link>
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
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No categories found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
