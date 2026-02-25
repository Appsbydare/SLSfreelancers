'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search, Settings, ArrowRight, Briefcase, User, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import SellerSidebar from '@/components/SellerSidebar';
import CustomerSidebar from '@/components/CustomerSidebar';

// Simple time formatter native to JS
function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        if (diffInSeconds >= secondsInUnit) {
            const value = Math.floor(diffInSeconds / secondsInUnit);
            return rtf.format(-value, unit as Intl.RelativeTimeFormatUnit);
        }
    }
    return 'just now';
}

export default function InboxPage() {
    const t = useTranslations('dashboard');
    const locale = useLocale();
    const router = useRouter();
    const { user, isLoggedIn, isLoading, switchRole } = useAuth();

    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'customer' | 'seller' | 'system'>('all');

    useEffect(() => {
        if (isLoading) return;

        if (!isLoggedIn || !user?.id) {
            router.push(`/${locale}/login?redirect=inbox`);
            return;
        }

        const fetchAllNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (data) {
                    setNotifications(data);
                }

                // Also mark all as read automatically when visiting the inbox
                await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
            } catch (err) {
                console.error("Error fetching notifications:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllNotifications();
    }, [isLoggedIn, isLoading, user?.id, locale, router]);

    const handleNotificationClick = async (notif: any) => {
        // Shared logic with Header.tsx
        if (notif.notification_type === 'verification') {
            if (user?.userType !== 'tasker') {
                localStorage.setItem('userPreferredMode', 'seller');
                await switchRole('tasker');
            }
            return router.push(`/${locale}/seller/dashboard/verifications`);
        }

        if (notif.notification_type === 'offer') {
            if (notif.data?.type === 'accepted') {
                if (user?.userType !== 'tasker') {
                    localStorage.setItem('userPreferredMode', 'seller');
                    await switchRole('tasker');
                }
                return router.push(`/${locale}/seller/dashboard/orders`);
            } else {
                if (user?.userType !== 'customer') {
                    localStorage.setItem('userPreferredMode', 'customer');
                    await switchRole('customer');
                }
                return router.push(`/${locale}/customer/dashboard/requests`);
            }
        }

        if (notif.notification_type === 'payout') {
            if (user?.userType !== 'customer') {
                localStorage.setItem('userPreferredMode', 'customer');
                await switchRole('customer');
            }
            return router.push(`/${locale}/customer/dashboard`);
        }
    };

    const getIconForType = (type: string, isTasker: boolean) => {
        switch (type) {
            case 'verification': return <ShieldCheck className="h-5 w-5 text-purple-500" />;
            case 'offer': return isTasker ? <Briefcase className="h-5 w-5 text-blue-500" /> : <User className="h-5 w-5 text-brand-green" />;
            case 'payout': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            default: return <Info className="h-5 w-5 text-gray-400" />;
        }
    };

    // Filter logic
    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'all') return true;
        if (activeTab === 'system') return n.notification_type === 'system' || n.notification_type === 'verification';

        // This is an estimation. In a real db you might have a strict 'target_role' column. 
        // We're classifying based on common platform patterns for this demo.
        if (activeTab === 'seller') {
            if (n.notification_type === 'verification') return true;
            if (n.notification_type === 'offer' && n.data?.type === 'accepted') return true;
            if (n.title?.toLowerCase().includes('gig')) return true;
            return false;
        }

        if (activeTab === 'customer') {
            if (n.notification_type === 'payout') return true;
            if (n.notification_type === 'offer' && n.data?.type !== 'accepted') return true;
            if (n.title?.toLowerCase().includes('task')) return true;
            return false;
        }

        return true;
    });

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    const isTaskerMode = user?.userType === 'tasker';

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
            {isTaskerMode ? (
                <SellerSidebar />
            ) : (
                <CustomerSidebar />
            )}

            <main className="flex-1 overflow-y-auto w-full">
                <div className="max-w-4xl mx-auto p-4 md:p-8">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inbox</h1>
                            <p className="text-gray-500">Manage your notifications and alerts</p>
                        </div>
                        {/* Future search/filter expansion could go here */}
                    </div>

                    <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 overflow-x-auto">
                            {['all', 'customer', 'seller', 'system'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-6 py-4 text-sm font-medium capitalize whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-brand-green' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="p-0">
                            {activeTab === 'seller' && (!user?.hasTaskerAccount && user?.userType !== 'tasker') ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                    <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                        <Briefcase className="h-10 w-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Upgrade to Seller</h3>
                                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                                        You don't have any seller notifications because you haven't set up a seller profile yet. Turn your skills into earnings today.
                                    </p>
                                    <Link
                                        href={`/${locale}/become-tasker`}
                                        className="bg-brand-green text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-green/90 transition-colors inline-flex items-center gap-2"
                                    >
                                        Become a Seller <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No {activeTab === 'all' ? '' : activeTab} notifications found.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 flex flex-col">
                                    {filteredNotifications.map((notif) => (
                                        <button
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className="p-6 hover:bg-gray-50 transition-colors text-left flex gap-4 w-full"
                                        >
                                            <div className="mt-1 flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                                                    {getIconForType(notif.notification_type, user?.userType === 'tasker')}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-4 mb-2">
                                                    <h4 className="text-base font-medium text-gray-900 transition-colors">
                                                        {notif.title}
                                                    </h4>
                                                    <span className="text-xs text-gray-500 whitespace-nowrap font-medium">
                                                        {formatRelativeTime(notif.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
