'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import CustomerSidebar from '@/components/CustomerSidebar';

export default function CustomerDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const locale = useLocale();
    const { user, isLoggedIn, isLoading, session } = useAuth();
    const [unreadMessages, setUnreadMessages] = useState(0);

    // Simple auth check
    useEffect(() => {
        if (!isLoading && !session) {
            router.push(`/${locale}/login`);
        }
    }, [isLoading, session, router, locale]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading portal...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null; // Will redirect
    }

    return (
        <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
            {/* Sidebar */}
            <CustomerSidebar unreadMessages={unreadMessages} />

            {/* Main Content */}
            <main className="flex-1 lg:ml-0 overflow-x-hidden">
                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
