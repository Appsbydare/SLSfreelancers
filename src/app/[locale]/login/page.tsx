'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Image from 'next/image';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { login: authLogin, user, isLoggedIn } = useAuth();
  // Removed loginType state and effect
  // const [loginType, setLoginType] = useState<'customer' | 'tasker'>('customer');
  // useEffect(() => { ... }) matches searchParams which we don't need for type anymore

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
    setErrors({});

    try {
      console.log('[LOGIN] Starting login attempt...');

      // Add timeout to detect if Supabase is hanging
      console.log('[LOGIN] Environment Check:', {
        urlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });

      // Create a fresh client for this specific action to avoid any singleton state issues
      const localSupabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const authPromise = localSupabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login request timed out after 30 seconds')), 30000)
      );

      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;

      console.log('[LOGIN] Auth response received:', { hasUser: !!data?.user, hasError: !!error });

      if (error) {
        console.error('[LOGIN] Auth error:', error);
        setErrors({ submit: error.message });
        showToast.error(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        console.log('[LOGIN] User authenticated, fetching profile...');

        // Wait a moment for the session to be set in the client
        await new Promise(resolve => setTimeout(resolve, 500));

        // Fetch user profile to check role using auth_user_id
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, user_type, first_name')
          .eq('auth_user_id', data.user.id)
          .single();

        console.log('[LOGIN] Profile fetch complete:', { hasProfile: !!profile, hasError: !!profileError, errorDetails: profileError });

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          // If profile doesn't exist, this might be a new user from OAuth
          showToast.error('Profile not found. Please complete signup.');
          setIsLoading(false);
          return;
        }

        console.log('[LOGIN] Profile found:', profile);

        // Check if user has a tasker profile
        let isTasker = false;
        try {
          console.log('[LOGIN] Checking for tasker profile...');
          const { data: taskerProfile, error: taskerError } = await supabase
            .from('taskers')
            .select('id')
            .eq('user_id', profile.id)
            .single();

          if (taskerError && taskerError.code !== 'PGRST116') {
            console.log('[LOGIN] Tasker profile check error (ignoring):', taskerError);
          }

          isTasker = !!taskerProfile;
          console.log('[LOGIN] Tasker profile check result:', { isTasker, id: taskerProfile?.id });
        } catch (err) {
          console.error('[LOGIN] Error checking tasker profile:', err);
        }

        const userActualType = profile?.user_type;
        const firstName = profile?.first_name || 'User';

        // Show success message
        console.log('[LOGIN] Showing success message...');
        showToast.success(`Welcome back, ${firstName}!`);

        // Check if there's a redirect URL from the query params
        const nextUrl = searchParams.get('next');

        // Redirect based on user role or next parameter
        console.log('[LOGIN] Redirecting user...', { userActualType, isTasker, nextUrl });

        // Small delay to allow toast to show
        setTimeout(() => {
          console.log('[LOGIN] Executing redirect...');
          if (nextUrl && nextUrl !== '/login') {
            router.push(nextUrl);
          } else if (userActualType === 'admin') {
            router.push(`/${locale}/project-status`);
          } else if (userActualType === 'tasker' || isTasker) {
            // Redirect to seller dashboard if they are a tasker OR have a tasker profile
            router.push(`/${locale}/seller/dashboard`);
          } else {
            router.push(`/${locale}`);
          }
          // Force stop loading in case redirect is slow
          // setIsLoading(false); 
        }, 500);
      }
    } catch (error: any) {
      console.error('[LOGIN] Unexpected error:', error);
      const errorMessage = error?.message || 'An unexpected error occurred.';
      setErrors({ submit: errorMessage });
      showToast.error(errorMessage);
      setIsLoading(false);
    }
    // Note: We don't put setIsLoading(false) in finally because successful login
    // keeps loading state true until redirect happens to prevent form re-submission
    // But we must ensure all ERROR paths call setIsLoading(false)
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
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 font-geom">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back to EasyFinder
        </p>


        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`pl-10 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
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
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href={`/${locale}/forgot-password`} className="font-medium text-brand-green hover:text-brand-green/80">
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don&apos;t have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/${locale}/signup`}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green"
              >
                Create a new account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
