'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { categories } from '@/data/categories';
import { animationClasses } from '@/lib/animations';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function CategoryGrid() {
  const t = useTranslations('homepage.popularCategories');
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div id="popular-categories" className="py-12 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-fade-in-up">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredCategories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/browse-gigs?category=${category.id}`}
                  className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-brand-green hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${(index * 100) + 400}ms` }}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 group-hover:rotate-6">
                      {category.icon}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-brand-green transition-colors duration-300">
                      {getCategoryName(category)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
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
