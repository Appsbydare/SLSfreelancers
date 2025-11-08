'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ChevronRight, Sparkles, Users, Clock, Shield } from 'lucide-react';
import SriLankaMap from './SriLankaMap';
import AdCarousel from './AdCarousel';
import { useDistrict } from '@/contexts/DistrictContext';
import { useRouter } from 'next/navigation';

export default function HeroBanner() {
  const t = useTranslations('homepage.hero');
  const locale = useLocale();
  const { selectedDistrict, setSelectedDistrict } = useDistrict();
  const router = useRouter();

  // Advertisement images - add more images here as needed
  const adImages = [
    '/images/sponsor-ad.png',
    '/images/sponsor-ad-2.png',
  ];

  const handleDistrictSelect = (district: any) => {
    setSelectedDistrict(district);
    // Scroll to the popular categories section
    setTimeout(() => {
      const categoriesSection = document.getElementById('popular-categories');
      if (categoriesSection) {
        categoriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <>
      <section className="relative bg-gradient-to-br from-brand-green/10 via-white to-green-50 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-green/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-brand-green/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Main Content Grid - Single Unified Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-8 items-start mb-6">
            {/* Left Column - Get Any Task Done Content */}
            <div className="flex flex-col animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-6 self-start">
                <Sparkles className="h-4 w-4 mr-2" />
                {t('badge')}
              </div>

              {/* Main Heading - Made Bigger */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                {t('mainTitle')}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-green/70 mt-2">
                  {t('subTitle')}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl lg:text-2xl text-gray-600 mb-10 max-w-2xl">
                {t('description')}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-8 mb-10">
                <div className="flex items-center space-x-3 text-gray-700">
                  <div className="text-brand-green"><Users className="h-7 w-7" /></div>
                  <span className="text-base font-medium">{t('feature1')}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <div className="text-brand-green"><Clock className="h-7 w-7" /></div>
                  <span className="text-base font-medium">{t('feature2')}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <div className="text-brand-green"><Shield className="h-7 w-7" /></div>
                  <span className="text-base font-medium">{t('feature3')}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href={`/${locale}/browse-tasks`}
                  className="inline-flex items-center justify-center px-10 py-5 bg-brand-green text-white text-xl font-semibold rounded-xl hover:bg-brand-green/90 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  {t('browseTasksButton')}
                  <ChevronRight className="ml-2 h-6 w-6" />
                </Link>
                <Link
                  href={`/${locale}/post-task`}
                  className="inline-flex items-center justify-center px-10 py-5 border-2 border-brand-green text-brand-green text-xl font-semibold rounded-xl hover:bg-brand-green hover:text-white transition-all duration-300 hover:scale-105"
                >
                  {t('postTaskButton')}
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-auto pt-8">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-3xl font-bold text-brand-green">500+</p>
                    <p className="text-sm text-gray-500">{t('stats.tasks')}</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-brand-green">98%</p>
                    <p className="text-sm text-gray-500">{t('stats.success')}</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-brand-green/80">24/7</p>
                    <p className="text-sm text-gray-500">{t('stats.support')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Map (No Border, Larger) */}
            <div className="flex flex-col animate-fade-in-up lg:pr-4" style={{ animationDelay: '400ms' }}>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Choose Your District
                </h3>
                <p className="text-base text-gray-600">
                  Select your district to find service providers near you
                </p>
              </div>
              
              <div className="w-full">
                <SriLankaMap
                  onDistrictSelect={handleDistrictSelect}
                  selectedDistrictId={selectedDistrict?.id}
                  showLabels={true}
                  className="mb-4"
                />
              </div>

              {selectedDistrict && (
                <div className="mt-6 p-5 bg-brand-green/10 rounded-xl border border-brand-green/20">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-brand-green">Selected District</p>
                      <p className="text-xl font-bold text-brand-green">{selectedDistrict.name}</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-sm text-brand-green/80 mb-2">{selectedDistrict.services.length} Services</p>
                      <Link 
                        href={`/${locale}/browse-tasks?district=${selectedDistrict.id}`}
                        className="inline-flex items-center px-4 py-2 bg-brand-green text-white text-sm font-medium rounded-lg hover:bg-brand-green/90 transition-colors"
                      >
                        Browse Tasks
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Advertisement Section - Below Map, Above Categories */}
      {adImages.length > 0 && (
        <section className="bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-fade-in-up">
              <AdCarousel images={adImages} interval={10000} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
