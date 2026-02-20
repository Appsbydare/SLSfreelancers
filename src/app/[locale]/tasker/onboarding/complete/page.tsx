'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Home, User } from 'lucide-react';
import Image from 'next/image';

import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { refreshProfile, switchRole } = useAuth();

  useEffect(() => {
    // Check if onboarding was actually completed
    const isComplete = sessionStorage.getItem('onboardingComplete');

    if (!isComplete) {
      router.push('/tasker/onboarding/stage-1');
      return;
    }

    // Refresh profile to update user status and switch to seller mode
    const updateProfile = async () => {
      await refreshProfile();
      switchRole('tasker');
      localStorage.setItem('userPreferredMode', 'seller');
    };

    updateProfile();
  }, [router, refreshProfile, switchRole]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.svg"
              alt="EasyFinder"
              width={141}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>

          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to EasyFinder!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your tasker registration is complete
          </p>
        </div>

        <div className="bg-white shadow sm:rounded-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">What happens next?</h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-brand-green text-white font-semibold">
                  1
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Document Verification</h3>
                <p className="mt-1 text-gray-600">
                  Our team will review your submitted documents within 1-2 business days.
                  You&apos;ll receive an email notification once the verification is complete.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-brand-green text-white font-semibold">
                  2
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Profile Activation</h3>
                <p className="mt-1 text-gray-600">
                  Once verified, your profile will be activated and visible to customers.
                  You can start browsing and bidding on tasks immediately.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-brand-green text-white font-semibold">
                  3
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Start Earning</h3>
                <p className="mt-1 text-gray-600">
                  Browse available tasks, submit offers, and start building your reputation
                  on the platform. The more tasks you complete, the higher your rating!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Tips for Success</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Complete your profile with detailed information and portfolio images</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Respond quickly to task inquiries to increase your chances</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Provide competitive and fair pricing for your services</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Maintain professional communication with customers</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Deliver high-quality work to build positive reviews</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-green hover:bg-brand-green/90"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Homepage
          </Link>
          <Link
            href="/tasker/dashboard"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <User className="h-5 w-5 mr-2" />
            View My Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

