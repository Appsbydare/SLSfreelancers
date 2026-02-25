'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, ArrowRight, Briefcase, User, Info, CheckCircle2, ShieldCheck, MessageCircle } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'all' | 'messages' | 'customer' | 'seller' | 'system'>('all');

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
        // Mark as read
        if (!notif.is_read) {
            await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        }

        if (notif.notification_type === 'message') {
            const { sender_id, task_id, gig_id } = notif.data || {};
            const params = new URLSearchParams();
            if (sender_id) params.set('recipientId', sender_id);
            if (task_id) params.set('taskId', task_id);
            if (gig_id) params.set('gigId', gig_id);
            const query = params.toString() ? `?${params.toString()}` : '';
            // task messages → customer dashboard, gig messages → seller dashboard
            const base = task_id
                ? `/${locale}/customer/dashboard/messages`
                : `/${locale}/seller/dashboard/messages`;
            return router.push(`${base}${query}`);
        }

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

    const getIconForType = (type: string) => {
        switch (type) {
            case 'message':
                return (
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-blue-500" />
                    </div>
                );
            case 'verification':
                return (
                    <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-purple-500" />
                    </div>
                );
            case 'offer':
                return (
                    <div className="w-10 h-10 rounded-full bg-brand-green/5 border border-brand-green/20 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-brand-green" />
                    </div>
                );
            case 'payout':
                return (
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                );
            default:
                return (
                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <Info className="h-5 w-5 text-gray-400" />
                    </div>
                );
        }
    };

    // Classify each notification into customer / seller / system buckets
    const classifyNotif = (n: any): 'customer' | 'seller' | 'system' => {
        if (n.notification_type === 'message') {
            // task_id present → came via customer portal; gig_id → via seller portal
            return n.data?.task_id ? 'customer' : 'seller';
        }
        if (n.notification_type === 'verification') return 'seller';
        if (n.notification_type === 'offer') return n.data?.type === 'accepted' ? 'seller' : 'customer';
        if (n.notification_type === 'payout') return 'customer';
        return 'system';
    };

    const tabs = ['all', 'messages', 'customer', 'seller', 'system'] as const;
    type Tab = typeof tabs[number];

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'all') return true;
        if (activeTab === 'messages') return n.notification_type === 'message';
        if (activeTab === 'system') return classifyNotif(n) === 'system';
        return classifyNotif(n) === activeTab;
    });

    const tabCounts: Record<string, number> = {
        all: notifications.filter(n => !n.is_read).length,
        messages: notifications.filter(n => n.notification_type === 'message' && !n.is_read).length,
        customer: notifications.filter(n => classifyNotif(n) === 'customer' && !n.is_read).length,
        seller: notifications.filter(n => classifyNotif(n) === 'seller' && !n.is_read).length,
        system: notifications.filter(n => classifyNotif(n) === 'system' && !n.is_read).length,
    };

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
                            {(['all', 'messages', 'customer', 'seller', 'system'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-4 text-sm font-medium capitalize whitespace-nowrap transition-colors relative flex items-center gap-2 ${activeTab === tab ? 'text-brand-green' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                >
                                    {tab === 'messages' && <MessageCircle className="h-3.5 w-3.5" />}
                                    {tab}
                                    {tabCounts[tab] > 0 && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${activeTab === tab ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            {tabCounts[tab]}
                                        </span>
                                    )}
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
                                            className={`p-5 hover:bg-gray-50 transition-colors text-left flex gap-4 w-full ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className="mt-0.5 flex-shrink-0">
                                                {getIconForType(notif.notification_type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-1">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <h4 className={`text-sm font-semibold truncate ${!notif.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        {!notif.is_read && (
                                                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap font-medium flex-shrink-0">
                                                        {formatRelativeTime(notif.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                                {/* Badge showing which portal this belongs to */}
                                                <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                                                    notif.notification_type === 'message'
                                                        ? 'bg-blue-50 text-blue-500'
                                                        : classifyNotif(notif) === 'seller'
                                                            ? 'bg-brand-green/10 text-brand-green'
                                                            : classifyNotif(notif) === 'customer'
                                                                ? 'bg-purple-50 text-purple-600'
                                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {notif.notification_type === 'message'
                                                        ? (notif.data?.task_id ? 'Customer · Message' : 'Seller · Message')
                                                        : classifyNotif(notif)
                                                    }
                                                </span>
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
