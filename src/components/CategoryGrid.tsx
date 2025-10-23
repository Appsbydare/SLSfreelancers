'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { categories } from '@/data/categories';
import { animationClasses } from '@/lib/animations';

export default function CategoryGrid() {
  const t = useTranslations('homepage.popularCategories');
  const locale = useLocale();

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

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-fade-in-up">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Find the perfect person for any task, from home cleaning to business services.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/browse-tasks?category=${category.id}`}
              className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animate-fade-in-up"
              style={{ animationDelay: `${(index * 100) + 400}ms` }}
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 group-hover:rotate-6">
                  {category.icon}
                </div>
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
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
            href="/browse-tasks"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in-up"
            style={{ animationDelay: '800ms' }}
          >
            {t('viewAll')}
          </Link>
        </div>
      </div>
    </div>
  );
}
