'use client';

import { Search, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DualModeExplainer() {
  return (
    <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Two Ways to Get Things Done
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you know exactly what you need or prefer custom offers, 
            we've got you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Browse Gigs */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-brand-green to-green-600 p-6">
              <div className="flex items-center justify-center h-16 w-16 bg-white rounded-full mx-auto mb-4">
                <Search className="h-8 w-8 text-brand-green" />
              </div>
              <h3 className="text-2xl font-bold text-white text-center">
                Browse Gigs
              </h3>
            </div>
            
            <div className="p-8">
              <p className="text-gray-600 mb-6">
                Find ready-made services with fixed pricing and delivery times. 
                Perfect when you know exactly what you need.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <span className="text-green-600 text-sm font-bold">1</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-gray-900">Browse Services</h4>
                    <p className="text-sm text-gray-600">
                      Explore gigs from verified sellers with transparent pricing
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <span className="text-green-600 text-sm font-bold">2</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-gray-900">Choose a Package</h4>
                    <p className="text-sm text-gray-600">
                      Select Basic, Standard, or Premium based on your needs
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <span className="text-green-600 text-sm font-bold">3</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-gray-900">Get It Done</h4>
                    <p className="text-sm text-gray-600">
                      Receive your work by the guaranteed delivery date
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/browse-gigs"
                className="w-full bg-brand-green text-white px-6 py-3 rounded-lg hover:bg-brand-green/90 font-semibold flex items-center justify-center group"
              >
                Browse Gigs
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Post Custom Request */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex items-center justify-center h-16 w-16 bg-white rounded-full mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-white text-center">
                Post Custom Request
              </h3>
            </div>
            
            <div className="p-8">
              <p className="text-gray-600 mb-6">
                Describe your unique project and receive custom offers from multiple sellers. 
                Great for specialized needs.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">1</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-gray-900">Describe Your Project</h4>
                    <p className="text-sm text-gray-600">
                      Share details, budget, and timeline for your custom needs
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">2</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-gray-900">Receive Proposals</h4>
                    <p className="text-sm text-gray-600">
                      Sellers send custom offers with pricing and timelines
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">3</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-gray-900">Choose the Best</h4>
                    <p className="text-sm text-gray-600">
                      Compare offers and hire the perfect seller for your project
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/post-task"
                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center group"
              >
                Post a Request
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Not sure which option is right for you?
          </p>
          <Link
            href="/how-it-works"
            className="inline-flex items-center text-brand-green font-semibold hover:underline"
          >
            Learn more about how it works
            <ArrowRight className="ml-1 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

