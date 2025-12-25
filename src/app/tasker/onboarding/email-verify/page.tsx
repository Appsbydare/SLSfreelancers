'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function EmailVerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Get email and userId from sessionStorage
    const pendingEmail = sessionStorage.getItem('pendingTaskerEmail');
    const pendingId = sessionStorage.getItem('pendingTaskerId');
    
    if (!pendingEmail || !pendingId) {
      router.push('/tasker/onboarding/stage-1');
      return;
    }
    
    setEmail(pendingEmail);
    setUserId(pendingId);
    
    // Auto-send OTP on page load
    sendOTP(pendingEmail);
  }, [router]);

  useEffect(() => {
    // Countdown timer for resend
    if (resendTimer > 0 && !canResend) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer, canResend]);

  const sendOTP = async (emailAddress: string) => {
    try {
      // In a real implementation, this would call an API to send OTP via email
      // For now, we'll simulate it
      console.log('Sending OTP to:', emailAddress);
      // TODO: Implement actual OTP sending via email service
      
      // For demo purposes, show the OTP in console
      const demoOTP = '123456';
      console.log('Demo OTP:', demoOTP);
    } catch (error) {
      console.error('Error sending OTP:', error);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear errors when user types
    if (errors.otp) {
      setErrors({});
    }

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp.slice(0, 6));
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(val => !val);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || isResending) return;
    
    setIsResending(true);
    await sendOTP(email);
    setIsResending(false);
    setCanResend(false);
    setResendTimer(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setErrors({ otp: 'Please enter the complete 6-digit code' });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement actual OTP verification
      // For demo purposes, accept '123456' as valid OTP
      if (otpValue === '123456') {
        // Mark email as verified
        // In real implementation, this would update the database
        sessionStorage.removeItem('pendingTaskerEmail');
        sessionStorage.removeItem('pendingTaskerId');
        
        // Store verified user info for next stage
        sessionStorage.setItem('verifiedTaskerId', userId);
        
        // Redirect to Stage 2
        router.push('/tasker/onboarding/stage-2');
      } else {
        setErrors({ otp: 'Invalid verification code. Please try again.' });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setErrors({ otp: 'Verification failed. Please try again.' });
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
          Verify Your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Stage 1 of 4: Email Verification
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
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-brand-green/10 mb-4">
              <Mail className="h-8 w-8 text-brand-green" />
            </div>
            <p className="text-sm text-gray-600">
              We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {email}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              (Demo: Use code <strong>123456</strong>)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.otp && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm text-center">
                {errors.otp}
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 text-center mb-3">
                Enter Verification Code
              </label>
              <div className="flex justify-center space-x-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green ${
                      errors.otp ? 'border-red-300' : 'border-gray-300'
                    }`}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Resend OTP */}
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="text-sm text-brand-green hover:text-brand-green/80 font-medium disabled:opacity-50"
                >
                  {isResending ? 'Sending...' : 'Resend Code'}
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend code in {resendTimer}s
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/tasker/onboarding/stage-1"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to signup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

