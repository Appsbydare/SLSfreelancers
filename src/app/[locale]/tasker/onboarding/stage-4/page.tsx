'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { showToast } from '@/lib/toast';

export default function TaskerStage4Page() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({
    hasInsurance: false,
    insuranceProvider: '',
    insurancePolicyNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    agreeToBackgroundCheck: false,
    agreeToCodeOfConduct: false,
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const verifiedId = sessionStorage.getItem('verifiedTaskerId');
    
    if (!verifiedId) {
      router.push('/tasker/onboarding/stage-1');
      return;
    }
    
    setUserId(verifiedId);
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Insurance validation (optional)
    if (formData.hasInsurance) {
      if (!formData.insuranceProvider.trim()) {
        newErrors.insuranceProvider = 'Insurance provider is required';
      }
      if (!formData.insurancePolicyNumber.trim()) {
        newErrors.insurancePolicyNumber = 'Policy number is required';
      }
    }

    // Emergency contact validation
    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Emergency contact name is required';
    }

    if (!formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    } else if (!/^(\+94|0)[0-9]{9}$/.test(formData.emergencyContactPhone.replace(/\s/g, ''))) {
      newErrors.emergencyContactPhone = 'Please enter a valid phone number';
    }

    if (!formData.emergencyContactRelation.trim()) {
      newErrors.emergencyContactRelation = 'Relationship is required';
    }

    // Agreement validations
    if (!formData.agreeToBackgroundCheck) {
      newErrors.agreeToBackgroundCheck = 'You must agree to background checks';
    }

    if (!formData.agreeToCodeOfConduct) {
      newErrors.agreeToCodeOfConduct = 'You must agree to the code of conduct';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Save trust & safety information
      const response = await fetch('/api/taskers/safety', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          hasInsurance: formData.hasInsurance,
          insuranceProvider: formData.insuranceProvider || null,
          insurancePolicyNumber: formData.insurancePolicyNumber || null,
          emergencyContact: {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relation: formData.emergencyContactRelation,
          },
          agreements: {
            backgroundCheck: formData.agreeToBackgroundCheck,
            codeOfConduct: formData.agreeToCodeOfConduct,
            terms: formData.agreeToTerms,
            agreedAt: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        // Show success message
        showToast.success('Registration complete! Welcome to EasyFinder!');
        
        // Clear all session storage
        sessionStorage.removeItem('verifiedTaskerId');
        sessionStorage.removeItem('stage2Complete');
        sessionStorage.removeItem('stage3Complete');
        
        // Mark onboarding as complete
        sessionStorage.setItem('onboardingComplete', 'true');
        
        // Redirect to completion page after short delay
        setTimeout(() => {
          router.push('/tasker/onboarding/complete');
        }, 1500);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to save information' });
        showToast.error(errorData.message || 'Failed to save information');
      }
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save information. Please try again.';
      setErrors({ submit: errorMessage });
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.svg"
              alt="EasyFinder"
              width={141}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Trust & Safety
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Stage 4 of 4: Final Step
          </p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-16 h-2 bg-brand-green rounded-full"></div>
              <div className="w-16 h-2 bg-brand-green rounded-full"></div>
              <div className="w-16 h-2 bg-brand-green rounded-full"></div>
              <div className="w-16 h-2 bg-brand-green rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg p-6 sm:p-8">
          {/* Info Banner */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Building a Safe Community</p>
                <p>
                  This information helps us ensure the safety of both taskers and customers.
                  All data is kept confidential and secure.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {errors.submit}
              </div>
            )}

            {/* Insurance Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Information (Optional)</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="hasInsurance"
                      name="hasInsurance"
                      type="checkbox"
                      checked={formData.hasInsurance}
                      onChange={handleInputChange}
                      className="focus:ring-brand-green h-4 w-4 text-brand-green border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="hasInsurance" className="font-medium text-gray-700">
                      I have professional liability insurance
                    </label>
                    <p className="text-gray-500">Having insurance increases customer trust and may help you get more tasks</p>
                  </div>
                </div>

                {formData.hasInsurance && (
                  <>
                    <div>
                      <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700 mb-1">
                        Insurance Provider *
                      </label>
                      <input
                        id="insuranceProvider"
                        name="insuranceProvider"
                        type="text"
                        value={formData.insuranceProvider}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${
                          errors.insuranceProvider ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Ceylinco Insurance"
                      />
                      {errors.insuranceProvider && (
                        <p className="mt-1 text-sm text-red-600">{errors.insuranceProvider}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="insurancePolicyNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Policy Number *
                      </label>
                      <input
                        id="insurancePolicyNumber"
                        name="insurancePolicyNumber"
                        type="text"
                        value={formData.insurancePolicyNumber}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${
                          errors.insurancePolicyNumber ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Policy number"
                      />
                      {errors.insurancePolicyNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.insurancePolicyNumber}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${
                      errors.emergencyContactName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Emergency contact name"
                  />
                  {errors.emergencyContactName && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${
                      errors.emergencyContactPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+94 77 123 4567"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="emergencyContactRelation" className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship *
                  </label>
                  <select
                    id="emergencyContactRelation"
                    name="emergencyContactRelation"
                    value={formData.emergencyContactRelation}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${
                      errors.emergencyContactRelation ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="child">Child</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.emergencyContactRelation && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactRelation}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Agreements Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Agreements</h3>

              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToBackgroundCheck"
                      name="agreeToBackgroundCheck"
                      type="checkbox"
                      checked={formData.agreeToBackgroundCheck}
                      onChange={handleInputChange}
                      className={`focus:ring-brand-green h-4 w-4 text-brand-green border-gray-300 rounded ${
                        errors.agreeToBackgroundCheck ? 'border-red-300' : ''
                      }`}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToBackgroundCheck" className="text-gray-700">
                      I consent to background checks and verification of my submitted documents *
                    </label>
                  </div>
                </div>
                {errors.agreeToBackgroundCheck && (
                  <p className="ml-7 text-sm text-red-600">{errors.agreeToBackgroundCheck}</p>
                )}

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToCodeOfConduct"
                      name="agreeToCodeOfConduct"
                      type="checkbox"
                      checked={formData.agreeToCodeOfConduct}
                      onChange={handleInputChange}
                      className={`focus:ring-brand-green h-4 w-4 text-brand-green border-gray-300 rounded ${
                        errors.agreeToCodeOfConduct ? 'border-red-300' : ''
                      }`}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToCodeOfConduct" className="text-gray-700">
                      I agree to follow the{' '}
                      <a href="/code-of-conduct" target="_blank" className="text-brand-green hover:text-brand-green/80 font-medium">
                        Tasker Code of Conduct
                      </a>{' '}
                      and maintain professional standards *
                    </label>
                  </div>
                </div>
                {errors.agreeToCodeOfConduct && (
                  <p className="ml-7 text-sm text-red-600">{errors.agreeToCodeOfConduct}</p>
                )}

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className={`focus:ring-brand-green h-4 w-4 text-brand-green border-gray-300 rounded ${
                        errors.agreeToTerms ? 'border-red-300' : ''
                      }`}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="text-gray-700">
                      I agree to the{' '}
                      <a href="/terms" target="_blank" className="text-brand-green hover:text-brand-green/80 font-medium">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" target="_blank" className="text-brand-green hover:text-brand-green/80 font-medium">
                        Privacy Policy
                      </a>{' '}
                      *
                    </label>
                  </div>
                </div>
                {errors.agreeToTerms && (
                  <p className="ml-7 text-sm text-red-600">{errors.agreeToTerms}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/tasker/onboarding/stage-3')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Complete Registration'}
                <CheckCircle className="h-5 w-5 ml-2" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

