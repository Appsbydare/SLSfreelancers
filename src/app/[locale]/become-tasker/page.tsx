'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Star, DollarSign, Clock, Users, Shield, X, Upload, CheckCircle2 } from 'lucide-react';
import { getAllCitiesWithDistricts, getDistrictsForCity } from '@/lib/city-district-helper';
import { District } from '@/data/districts';

export default function BecomeTaskerPage() {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  
  const [quickSignupData, setQuickSignupData] = useState({
    callingName: '',
    phone: '',
    nicNumber: '',
    photo: null as File | null,
  });

  const [verificationData, setVerificationData] = useState({
    fullName: '',
    email: '',
    city: '',
    district: '',
    roadNameNumber: '',
    addressLine2: '',
    policeReport: null as File | null,
    profilePicture: null as File | null,
    idDocument: null as File | null,
    skills: '',
    experience: '',
    bio: '',
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const policeReportInputRef = useRef<HTMLInputElement>(null);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const idDocumentInputRef = useRef<HTMLInputElement>(null);

  const allCities = getAllCitiesWithDistricts();

  const handleQuickSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'photo' && files && files[0]) {
      setQuickSignupData(prev => ({ ...prev, photo: files[0] }));
    } else {
      setQuickSignupData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    
    if (files && files[0]) {
      setVerificationData(prev => ({ ...prev, [name]: files[0] }));
    } else if (name === 'city') {
      setVerificationData(prev => ({ ...prev, city: value, district: '' }));
      setSelectedCity(value);
      const districts = getDistrictsForCity(value);
      setAvailableDistricts(districts);
      if (districts.length === 1) {
        setSelectedDistrict(districts[0].id);
        setVerificationData(prev => ({ ...prev, district: districts[0].id }));
      } else {
        setSelectedDistrict('');
      }
    } else if (name === 'district') {
      setSelectedDistrict(value);
      setVerificationData(prev => ({ ...prev, district: value }));
    } else {
      setVerificationData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleQuickSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Quick signup:', quickSignupData);
    // TODO: Submit to API
    alert('Quick signup successful! You can now verify your account for more opportunities.');
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Verification data:', verificationData);
    // TODO: Submit to API
    alert('Verification submitted! Your account will be reviewed and verified soon.');
    setShowVerificationModal(false);
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

          {/* Quick Signup Form */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quick Signup (2 minutes)
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Get started quickly with just the essentials
            </p>

            <form onSubmit={handleQuickSignupSubmit} className="space-y-6">
              <div>
                <label htmlFor="callingName" className="block text-sm font-medium text-gray-700 mb-2">
                  Calling Name *
                </label>
                <input
                  type="text"
                  id="callingName"
                  name="callingName"
                  value={quickSignupData.callingName}
                  onChange={handleQuickSignupChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={quickSignupData.phone}
                  onChange={handleQuickSignupChange}
                  placeholder="+94 77 123 4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="nicNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  NIC Number *
                </label>
                <input
                  type="text"
                  id="nicNumber"
                  name="nicNumber"
                  value={quickSignupData.nicNumber}
                  onChange={handleQuickSignupChange}
                  placeholder="123456789V"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                  Photo *
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    id="photo"
                    name="photo"
                    ref={photoInputRef}
                    onChange={handleQuickSignupChange}
                    accept="image/*"
                    className="hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {quickSignupData.photo ? quickSignupData.photo.name : 'Upload Photo'}
                  </button>
                  {quickSignupData.photo && (
                    <span className="ml-3 text-sm text-gray-600">{quickSignupData.photo.name}</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Sign Up
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </form>

            {/* Verify Account Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Get more chances to apply for Jobs/Tasks</strong>
                </p>
                <p className="text-xs text-gray-600 mb-4">
                  Verify your account to appear at the top of customer searches and get priority access to tasks.
                </p>
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(true)}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Verify Your Account
                </button>
              </div>
            </div>

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

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Verify Your Account</h2>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleVerificationSubmit} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Why verify?</strong> Verified taskers appear at the top of customer searches and get priority access to tasks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={verificationData.fullName}
                    onChange={handleVerificationChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={verificationData.email}
                    onChange={handleVerificationChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={verificationData.city}
                    onChange={handleVerificationChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    required
                  >
                    <option value="">Select City</option>
                    {allCities.map((item) => (
                      <option key={item.city.id} value={item.city.name}>
                        {item.city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                    District *
                  </label>
                  <select
                    id="district"
                    name="district"
                    value={verificationData.district}
                    onChange={handleVerificationChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    required
                    disabled={availableDistricts.length === 0}
                  >
                    <option value="">
                      {availableDistricts.length === 0 
                        ? 'Select City first' 
                        : availableDistricts.length > 1 
                        ? 'Select District' 
                        : availableDistricts[0]?.name}
                    </option>
                    {availableDistricts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {availableDistricts.length > 1 && (
                    <p className="mt-1 text-xs text-gray-500">
                      This city is in multiple districts. Please select the correct one.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="roadNameNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Road Name / Number *
                </label>
                <input
                  type="text"
                  id="roadNameNumber"
                  name="roadNameNumber"
                  value={verificationData.roadNameNumber}
                  onChange={handleVerificationChange}
                  placeholder="e.g., 123 Main Street"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  id="addressLine2"
                  name="addressLine2"
                  value={verificationData.addressLine2}
                  onChange={handleVerificationChange}
                  placeholder="e.g., Apartment, Building, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="policeReport" className="block text-sm font-medium text-gray-700 mb-2">
                  Police Report (Scanned Copy) *
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="policeReport"
                    name="policeReport"
                    ref={policeReportInputRef}
                    onChange={handleVerificationChange}
                    accept="image/*,.pdf"
                    className="hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => policeReportInputRef.current?.click()}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {verificationData.policeReport ? verificationData.policeReport.name : 'Upload Police Report (Image or PDF)'}
                  </button>
                  {verificationData.policeReport && (
                    <span className="ml-3 text-sm text-gray-600">{verificationData.policeReport.name}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">Accepted formats: JPG, PNG, PDF</p>
              </div>

              <div>
                <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture (Face Photo) *
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="profilePicture"
                    name="profilePicture"
                    ref={profilePictureInputRef}
                    onChange={handleVerificationChange}
                    accept="image/*"
                    className="hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => profilePictureInputRef.current?.click()}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {verificationData.profilePicture ? verificationData.profilePicture.name : 'Upload Profile Picture'}
                  </button>
                  {verificationData.profilePicture && (
                    <span className="ml-3 text-sm text-gray-600">{verificationData.profilePicture.name}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">Please upload a clear photo of your face</p>
              </div>

              <div>
                <label htmlFor="idDocument" className="block text-sm font-medium text-gray-700 mb-2">
                  ID / NIC / Passport *
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="idDocument"
                    name="idDocument"
                    ref={idDocumentInputRef}
                    onChange={handleVerificationChange}
                    accept="image/*,.pdf"
                    className="hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => idDocumentInputRef.current?.click()}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {verificationData.idDocument ? verificationData.idDocument.name : 'Upload ID Document (Image or PDF)'}
                  </button>
                  {verificationData.idDocument && (
                    <span className="ml-3 text-sm text-gray-600">{verificationData.idDocument.name}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">Accepted formats: JPG, PNG, PDF</p>
              </div>

              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                  Skills & Services
                </label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={verificationData.skills}
                  onChange={handleVerificationChange}
                  placeholder="e.g., Cleaning, Handyman, Delivery, Tutoring"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  id="experience"
                  name="experience"
                  value={verificationData.experience}
                  onChange={handleVerificationChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
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
                  value={verificationData.bio}
                  onChange={handleVerificationChange}
                  rows={4}
                  placeholder="Describe your experience, qualifications, and what makes you a great tasker..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Submit Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
