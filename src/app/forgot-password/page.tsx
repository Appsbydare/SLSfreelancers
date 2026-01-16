'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { showToast } from '@/lib/toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSubmitted(true);
                showToast.success('Password reset link sent!');
                // For development/demo purposes if the link is returned in response
                if (data.resetLink) {
                    console.log("Reset Link:", data.resetLink);
                }
            } else {
                setError(data.message || 'Failed to send reset link');
                showToast.error(data.message || 'Failed to send reset link');
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            setError('An unexpected error occurred');
            showToast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
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
                        Reset your password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your email and we'll send you a link to reset your password
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        {isSubmitted ? (
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                    <Mail className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    We have sent a password reset link to <strong>{email}</strong>.
                                </p>
                                <div className="mt-6">
                                    <Link
                                        href="/login"
                                        className="text-sm font-medium text-brand-green hover:text-brand-green/80 flex items-center justify-center"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to sign in
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form className="space-y-6" onSubmit={handleSubmit}>
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
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={`pl-10 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${error ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    {error && (
                                        <p className="mt-1 text-sm text-red-600">{error}</p>
                                    )}
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Sending link...
                                            </div>
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center justify-center">
                                    <Link
                                        href="/login"
                                        className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to sign in
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
