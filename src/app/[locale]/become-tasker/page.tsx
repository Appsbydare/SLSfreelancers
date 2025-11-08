'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Star, DollarSign, Clock, Users, Shield } from 'lucide-react';

export default function BecomeTaskerPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '',
    location: '',
    experience: '',
    bio: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Application submitted successfully! (This is a demo)');
  };

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
                    Set your own rates and work on your schedule. Earn money doing what you're good at.
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
                    <p className="text-sm text-gray-600">"I've earned over LKR 50,000 in my first month!"</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-gray-600">MR</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Michael R.</p>
                    <p className="text-sm text-gray-600">"Perfect for my part-time schedule. Great platform!"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Apply to Become a Tasker
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Colombo, Kandy, Galle"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                  Skills & Services
                </label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="e.g., Cleaning, Handyman, Delivery, Tutoring"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                >
                  <option value="">Select experience level</option>
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="experienced">Experienced (3-5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                </select>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us about yourself
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe your experience, qualifications, and what makes you a great tasker..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-brand-green hover:text-brand-green/80 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
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
