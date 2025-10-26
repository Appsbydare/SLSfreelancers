'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useDistrict } from '@/contexts/DistrictContext';
import { categories } from '@/data/categories';
import { animationClasses } from '@/lib/animations';
import Link from 'next/link';

export default function DistrictServices() {
  const t = useTranslations('homepage.districtServices');
  const locale = useLocale();
  const { selectedDistrict } = useDistrict();

  if (!selectedDistrict) {
    return null;
  }

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

  const availableCategories = categories.filter(category =>
    selectedDistrict.services.includes(category.id)
  );

  const unavailableCategories = categories.filter(category =>
    !selectedDistrict.services.includes(category.id)
  );

  return (
    <div id="district-services" className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('title', { district: selectedDistrict.name })}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('subtitle', { 
              district: selectedDistrict.name,
              count: availableCategories.length 
            })}
          </p>
        </div>

        {/* Available Services */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {t('availableServices')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {availableCategories.map((category, index) => (
              <Link
                key={category.id}
                href={`/browse-tasks?category=${category.id}&district=${selectedDistrict.id}`}
                className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-green-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${(index * 100) + 400}ms` }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 group-hover:rotate-6">
                    {category.icon}
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                    {getCategoryName(category)}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
                    {category.description}
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Unavailable Services (if any) */}
        {unavailableCategories.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
              {t('comingSoon')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {unavailableCategories.slice(0, 8).map((category, index) => (
                <div
                  key={category.id}
                  className="group bg-white rounded-lg border border-gray-200 p-6 opacity-60 animate-fade-in-up"
                  style={{ animationDelay: `${(index * 100) + 800}ms` }}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3 grayscale">
                      {category.icon}
                    </div>
                    <h4 className="text-sm font-medium text-gray-500">
                      {getCategoryName(category)}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* District Stats */}
        <div className="bg-white rounded-lg p-6 shadow-md animate-fade-in-up" style={{ animationDelay: '1000ms' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('districtInfo')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {selectedDistrict.population.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">{t('population')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedDistrict.area.toLocaleString()} km²
              </div>
              <div className="text-sm text-gray-600">{t('area')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {availableCategories.length}
              </div>
              <div className="text-sm text-gray-600">{t('availableServices')}</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: '1200ms' }}>
          <Link
            href={`/browse-tasks?district=${selectedDistrict.id}`}
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            {t('browseTasks')}
          </Link>
        </div>
      </div>
    </div>
  );
}
