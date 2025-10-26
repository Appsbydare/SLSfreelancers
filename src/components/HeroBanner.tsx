'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronRight, Sparkles, Users, Clock, Shield } from 'lucide-react';
import { animationClasses } from '@/lib/animations';
import SriLankaMap from './SriLankaMap';
import { useDistrict } from '@/contexts/DistrictContext';
import { useRouter } from 'next/navigation';

export default function HeroBanner() {
  const t = useTranslations('homepage.hero');
  const { selectedDistrict, setSelectedDistrict } = useDistrict();
  const router = useRouter();

  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      text: "Trusted Professionals",
      delay: "200ms"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      text: "Quick & Reliable",
      delay: "400ms"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      text: "Secure Payments",
      delay: "600ms"
    }
  ];

  const handleDistrictSelect = (district: any) => {
    setSelectedDistrict(district);
    // TODO: Implement district filtering for service providers
    // For now, this will scroll to the district services section
    const servicesSection = document.getElementById('district-services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6 animate-fade-in-up">
              <Sparkles className="h-4 w-4 mr-2" />
              Sri Lanka&apos;s #1 Task Platform
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Get Any Task Done
              <span className="block text-gradient">Quickly & Safely</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              Connect with skilled professionals in Sri Lanka. From home cleaning to business services, 
              find the perfect person for any task.
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-6 mb-8 justify-center lg:justify-start">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-2 text-gray-700 animate-fade-in-up"
                  style={{ animationDelay: feature.delay }}
                >
                  <div className="text-blue-600">{feature.icon}</div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/browse-tasks"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in-up"
                style={{ animationDelay: '800ms' }}
              >
                Browse Tasks
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/post-task"
                className="inline-flex items-center px-8 py-4 border-2 border-blue-600 text-blue-600 text-lg font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: '900ms' }}
              >
                Post a Task
              </Link>
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Choose Your District
                </h3>
                <p className="text-gray-600">
                  Select your district to find service providers near you
                </p>
              </div>
              
              <SriLankaMap
                onDistrictSelect={handleDistrictSelect}
                selectedDistrictId={selectedDistrict?.id}
                showLabels={true}
                className="mb-4"
              />

              {selectedDistrict && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Selected District</p>
                      <p className="text-lg font-bold text-blue-900">{selectedDistrict.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">{selectedDistrict.services.length} Services</p>
                      <Link 
                        href={`/browse-tasks?district=${selectedDistrict.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                      >
                        Browse Tasks →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
