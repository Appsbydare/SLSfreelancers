'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ChevronRight, Sparkles, Users, Clock, Shield } from 'lucide-react';

export default function HeroBanner() {
  const t = useTranslations('homepage.hero');
  const locale = useLocale();

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              {t('badge')}
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {t('mainTitle')}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {t('subTitle')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-600 mb-8">
              {t('description')}
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center space-x-2 text-gray-700">
                <div className="text-blue-600"><Users className="h-6 w-6" /></div>
                <span className="text-sm font-medium">{t('feature1')}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <div className="text-blue-600"><Clock className="h-6 w-6" /></div>
                <span className="text-sm font-medium">{t('feature2')}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <div className="text-blue-600"><Shield className="h-6 w-6" /></div>
                <span className="text-sm font-medium">{t('feature3')}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href={`/${locale}/browse-tasks`}
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                {t('browseTasksButton')}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href={`/${locale}/post-task`}
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-blue-600 text-blue-600 text-lg font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 hover:scale-105"
              >
                {t('postTaskButton')}
              </Link>
            </div>

            {/* Stats */}
            <div className="pt-8 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">500+</p>
                  <p className="text-sm text-gray-500">{t('stats.tasks')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">98%</p>
                  <p className="text-sm text-gray-500">{t('stats.success')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">24/7</p>
                  <p className="text-sm text-gray-500">{t('stats.support')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
