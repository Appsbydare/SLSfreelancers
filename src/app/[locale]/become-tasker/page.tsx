'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowRight, CheckCircle, Clock, Users, Shield, DollarSign } from 'lucide-react';

export default function BecomeTaskerPage() {
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Become a Tasker
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Turn your skills into income. Join thousands of taskers earning money on Sri Lanka Tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Benefits */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Why Join as a Tasker?
            </h2>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Earn Extra Income</h3>
                  <p className="text-gray-600">
                    Set your own rates and work on your schedule. Earn money doing what you&apos;re good at.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-brand-green/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Clock className="h-6 w-6 text-brand-green" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexible Schedule</h3>
                  <p className="text-gray-600">
                    Work when you want, where you want. Choose tasks that fit your availability.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-brand-green/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Users className="h-6 w-6 text-brand-green" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your Business</h3>
                  <p className="text-gray-600">
                    Grow your client base and build a reputation through our review system.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Shield className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
                  <p className="text-gray-600">
                    Get paid securely and on time. No chasing payments or dealing with bad clients.
                  </p>
                </div>
              </div>
            </div>

            {/* Success Stories */}
            <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Stories</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-gray-600">SJ</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sarah J.</p>
                    <p className="text-sm text-gray-600">&quot;I&apos;ve earned over LKR 50,000 in my first month!&quot;</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-gray-600">MR</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Michael R.</p>
                    <p className="text-sm text-gray-600">&quot;Perfect for my part-time schedule. Great platform!&quot;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-white rounded-lg shadow-sm border p-8 flex flex-col justify-center items-center text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Start?
            </h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Create your tasker profile in just a few steps. It takes less than 5 minutes to set up.
            </p>

            <Link
              href={`/${locale}/tasker/onboarding/stage-1`}
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-green text-white text-lg font-semibold rounded-lg hover:bg-brand-green/90 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              Become a Tasker
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>

            <p className="mt-4 text-sm text-gray-500">
              Already have an account?{' '}
              <Link href={`/${locale}/login`} className="text-brand-green hover:text-brand-green/80 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Requirements to Become a Tasker
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-green/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-brand-green" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">18+ Years Old</h3>
              <p className="text-sm text-gray-600">Must be at least 18 years of age</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Valid ID</h3>
              <p className="text-sm text-gray-600">National ID or passport required</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-green/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-brand-green" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Bank Account</h3>
              <p className="text-sm text-gray-600">For secure payments</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Skills & Experience</h3>
              <p className="text-sm text-gray-600">Relevant skills for your services</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
