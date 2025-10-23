'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronRight, Sparkles, Users, Clock, Shield } from 'lucide-react';
import { animationClasses } from '@/lib/animations';

export default function HeroBanner() {
  const t = useTranslations('homepage.hero');

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

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">SL</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Sri Lanka Tasks</h3>
                    <p className="text-sm text-gray-500">Online Now</p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>

              {/* Task Examples */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="text-2xl">🏠</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Home Cleaning</p>
                    <p className="text-sm text-gray-500">Colombo 03 • LKR 2,500</p>
                  </div>
                  <div className="text-green-600 text-sm font-medium">Active</div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="text-2xl">💻</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Website Design</p>
                    <p className="text-sm text-gray-500">Kandy • LKR 15,000</p>
                  </div>
                  <div className="text-blue-600 text-sm font-medium">New</div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="text-2xl">🚗</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Car Wash</p>
                    <p className="text-sm text-gray-500">Negombo • LKR 1,200</p>
                  </div>
                  <div className="text-orange-600 text-sm font-medium">Pending</div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">500+</p>
                    <p className="text-sm text-gray-500">Tasks</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">98%</p>
                    <p className="text-sm text-gray-500">Success</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">24/7</p>
                    <p className="text-sm text-gray-500">Support</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-2xl animate-bounce" style={{ animationDelay: '1s' }}>
              ⭐
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-green-400 rounded-full flex items-center justify-center text-xl animate-bounce" style={{ animationDelay: '1.5s' }}>
              💚
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
