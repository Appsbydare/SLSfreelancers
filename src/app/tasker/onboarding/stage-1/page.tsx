'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, Lock, Eye, EyeOff, CreditCard, Globe } from 'lucide-react';
import Image from 'next/image';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';

export default function TaskerStage1Page() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nicNumber: '',
    password: '',
    confirmPassword: '',
    preferredLanguage: 'en',
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [existingUser, setExistingUser] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Check if email belongs to existing customer when email field changes
    if (name === 'email' && value.includes('@') && value.length > 5) {
      checkExistingUser(value);
    }
  };

  const checkExistingUser = async (email: string) => {
    setIsCheckingEmail(true);
    try {
      const response = await fetch('/api/users/upgrade-to-tasker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.canUpgrade && data.hasCustomerAccount) {
          setExistingUser(data);
          // Pre-fill form with existing user data
          setFormData(prev => ({
            ...prev,
            firstName: data.firstName || prev.firstName,
            lastName: data.lastName || prev.lastName,
            phone: data.phone || prev.phone,
          }));
        } else if (data.hasTaskerAccount) {
          setErrors(prev => ({
            ...prev,
            email: 'This email is already registered as a tasker. Please login instead.'
          }));
        }
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Pre-fill data if user is logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        // NIC is usually not in user object if they are just a customer, so we leave it blank
      }));
      // Also set existing user state so we know to upgrade instead of create
      setExistingUser({ canUpgrade: true, userId: user.id, isEmailVerified: true }); // Assuming logged in means email verified or good enough
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    // Check for pending data from become-tasker page
    const pendingBio = sessionStorage.getItem('pendingTaskerBio');
    const pendingSkills = sessionStorage.getItem('pendingTaskerSkills');
    if (pendingBio || pendingSkills) {
      // We might want to save these for later stages or just keep in session
      // Stage 1 doesn't use bio/skills, so we just let them persist in session for Stage 2/3
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+94|0)[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Sri Lankan phone number';
    }

    // NIC validation
    if (!formData.nicNumber.trim()) {
      newErrors.nicNumber = 'NIC number is required';
    } else if (!/^([0-9]{9}[vVxX]|[0-9]{12})$/.test(formData.nicNumber)) {
      newErrors.nicNumber = 'Please enter a valid NIC number (9 digits + V/X or 12 digits)';
    }

    // Password validation - only if not logged in
    if (!isLoggedIn) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, and number';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Terms agreement validation
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
      // If user is upgrading from customer, skip user creation
      if (existingUser && existingUser.canUpgrade) {
        // Show success message
        showToast.success('Upgrading your account to tasker! Proceeding to next step...');

        // Store user data for next stages
        sessionStorage.setItem('pendingTaskerEmail', formData.email);
        sessionStorage.setItem('pendingTaskerId', existingUser.userId);
        sessionStorage.setItem('isUpgradingToTasker', 'true');

        // Skip email verification if already verified
        if (existingUser.isEmailVerified) {
          sessionStorage.setItem('stage1Complete', 'true');
          // Important: Set verifiedTaskerId so Stage 2 doesn't kick us back
          sessionStorage.setItem('verifiedTaskerId', existingUser.userId);

          setTimeout(() => {
            router.push('/tasker/onboarding/stage-2');
          }, 1000);
        } else {
          // Still need email verification
          setTimeout(() => {
            router.push('/tasker/onboarding/email-verify');
          }, 1000);
        }
        return;
      }

      // New user - create account
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          nicNumber: formData.nicNumber.trim(),
          userType: 'tasker',
          password: formData.password,
          preferredLanguage: formData.preferredLanguage,
          profile: {
            bio: '',
            skills: [],
            rating: 0,
            completedTasks: 0,
            profileImage: null,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Show success message
        showToast.success('Account created successfully! Please verify your email.');

        // Store user data temporarily for email verification
        sessionStorage.setItem('pendingTaskerEmail', formData.email);
        sessionStorage.setItem('pendingTaskerId', data.user.id);

        // Redirect to email verification after short delay
        setTimeout(() => {
          router.push('/tasker/onboarding/email-verify');
        }, 1500);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Registration failed. Please try again.' });
        showToast.error(errorData.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Registration failed. Please try again.' });
      showToast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/logo.svg"
            alt="EasyFinder"
            width={141}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Become a Tasker
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Stage 1 of 4: Quick Signup
        </p>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-16 h-2 bg-brand-green rounded-full"></div>
            <div className="w-16 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-16 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-16 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {errors.submit}
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`pl-10 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`pl-10 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoggedIn}
                  className={`pl-10 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${errors.email ? 'border-red-300' : 'border-gray-300'
                    } ${isLoggedIn ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`pl-10 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="+94 77 123 4567"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* NIC Number */}
            <div>
              <label htmlFor="nicNumber" className="block text-sm font-medium text-gray-700">
                NIC Number *
              </label>
              <div className="mt-1 relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="nicNumber"
                  name="nicNumber"
                  type="text"
                  value={formData.nicNumber}
                  onChange={handleInputChange}
                  className={`pl-10 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${errors.nicNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="123456789V or 199012345678"
                />
              </div>
              {errors.nicNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.nicNumber}</p>
              )}
            </div>

            {/* Preferred Language */}
            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700">
                Preferred Language *
              </label>
              <div className="mt-1 relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green"
                >
                  <option value="en">English</option>
                  <option value="si">සිංහල (Sinhala)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>
            </div>

            {/* Password Fields - Only for new users */}
            {!isLoggedIn && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <div className="mt-1 relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`pl-10 pr-10 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <div className="mt-1 relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`pl-10 pr-10 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </>
            )}

            {/* Terms Agreement */}
            <div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className={`focus:ring-brand-green h-4 w-4 text-brand-green border-gray-300 rounded ${errors.agreeToTerms ? 'border-red-300' : ''
                      }`}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeToTerms" className="text-gray-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-brand-green hover:text-brand-green/80 font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-brand-green hover:text-brand-green/80 font-medium">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? (isLoggedIn ? 'Processing...' : 'Creating Account...')
                  : (isLoggedIn ? 'Continue to Next Step' : 'Continue to Email Verification')
                }
              </button>
            </div>
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
    </div>
  );
}

