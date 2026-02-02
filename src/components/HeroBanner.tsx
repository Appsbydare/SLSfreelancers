'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ChevronRight, Sparkles, Users, Clock, Shield } from 'lucide-react';
import SriLankaMap from './SriLankaMap';
import { useDistrict } from '@/contexts/DistrictContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, suffix: string = '', start: number = 0) {
  const [count, setCount] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = countRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
          let startTime: number | null = null;
          const startValue = start;

          const animate = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(startValue + (end - startValue) * easeOutQuart);

            setCount(current);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [end, duration, hasStarted, start]);

  return { count, countRef, suffix };
}

// Animated counter that counts from min to max and stops
function useCountUpRange(min: number, max: number, duration: number = 2000) {
  const [count, setCount] = useState(min);
  const [hasStarted, setHasStarted] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = countRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
          let startTime: number | null = null;
          const startValue = min;

          const animate = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(startValue + (max - startValue) * easeOutQuart);

            setCount(current);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(max);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [min, max, duration, hasStarted]);

  return { count, countRef };
}

// Dual counter for hours/days (e.g., 24/7)
function useDualCounter(hoursEnd: number, daysEnd: number, hoursStart: number = 0, daysStart: number = 0, duration: number = 2000) {
  const [hours, setHours] = useState(hoursStart);
  const [days, setDays] = useState(daysStart);
  const [hasStarted, setHasStarted] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = countRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
          let startTime: number | null = null;

          const animate = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            const currentHours = Math.floor(hoursStart + (hoursEnd - hoursStart) * easeOutQuart);
            const currentDays = Math.floor(daysStart + (daysEnd - daysStart) * easeOutQuart);

            setHours(currentHours);
            setDays(currentDays);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setHours(hoursEnd);
              setDays(daysEnd);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hoursEnd, daysEnd, hoursStart, daysStart, duration, hasStarted]);

  return { hours, days, countRef };
}

export default function HeroBanner() {
  const t = useTranslations('homepage.hero');
  const locale = useLocale();
  const { selectedDistrict, setSelectedDistrict } = useDistrict();
  const router = useRouter();

  // Animated counters
  const tasksCounter = useCountUp(500, 2000, '+');
  const successCounter = useCountUpRange(97, 99, 2000);
  const supportCounter = useDualCounter(24, 7, 9, 5, 2000);

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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-8 leading-tight font-geom">
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
                <div className="grid grid-cols-3 gap-4">
                  {/* Tasks Stat Box */}
                  <div
                    ref={tasksCounter.countRef}
                    className="bg-white rounded-xl p-6 shadow-lg border border-brand-green/20 hover:shadow-xl hover:border-brand-green/40 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                    style={{ animationDelay: '600ms' }}
                  >
                    <div className="text-center">
                      <p className="text-4xl font-bold text-brand-green mb-2">
                        {tasksCounter.count}{tasksCounter.suffix}
                      </p>
                      <p className="text-sm font-medium text-gray-600">{t('stats.tasks')}</p>
                    </div>
                  </div>

                  {/* Success Stat Box */}
                  <div
                    ref={successCounter.countRef}
                    className="bg-white rounded-xl p-6 shadow-lg border border-brand-green/20 hover:shadow-xl hover:border-brand-green/40 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                    style={{ animationDelay: '700ms' }}
                  >
                    <div className="text-center">
                      <p className="text-4xl font-bold text-brand-green mb-2">
                        {successCounter.count}%
                      </p>
                      <p className="text-sm font-medium text-gray-600">{t('stats.success')}</p>
                    </div>
                  </div>

                  {/* Support Stat Box */}
                  <div
                    ref={supportCounter.countRef}
                    className="bg-white rounded-xl p-6 shadow-lg border border-brand-green/20 hover:shadow-xl hover:border-brand-green/40 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                    style={{ animationDelay: '800ms' }}
                  >
                    <div className="text-center">
                      <p className="text-4xl font-bold text-brand-green mb-2">
                        {supportCounter.hours}/{supportCounter.days}
                      </p>
                      <p className="text-sm font-medium text-gray-600">{t('stats.support')}</p>
                    </div>
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
    </>
  );
}
