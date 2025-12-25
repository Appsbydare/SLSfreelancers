'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function PostRequestSection() {
  const locale = useLocale();

  return (
    <div className="py-16 bg-gradient-to-r from-brand-green/10 via-brand-green/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-brand-green/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <Sparkles className="h-8 w-8 text-brand-green mr-3" />
                <h2 className="text-3xl font-bold text-gray-900 font-geom">
                  Have a Unique Project?
                </h2>
              </div>
              <p className="text-lg text-gray-600 mb-6">
                Need something custom that doesn&apos;t fit our ready-made services? 
                Post your request and receive personalized proposals from skilled taskers 
                who can bring your vision to life.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-gray-700">
                  <span className="text-brand-green mr-2">✓</span>
                  Get multiple quotes from verified taskers
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-brand-green mr-2">✓</span>
                  Compare proposals and choose the best fit
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-brand-green mr-2">✓</span>
                  Secure payment and quality guarantee
                </li>
              </ul>
            </div>
            <div className="flex-shrink-0">
              <Link
                href={`/${locale}/post-task`}
                className="inline-flex items-center px-8 py-4 bg-brand-green text-white text-lg font-semibold rounded-lg hover:bg-brand-green/90 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
              >
                Post a Custom Request
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

