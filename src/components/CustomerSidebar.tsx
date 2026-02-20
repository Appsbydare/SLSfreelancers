'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
    LayoutDashboard,
    FileText,
    MessageSquare,
    User,
    Menu,
    X,
    PlusCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CustomerSidebarProps {
    unreadMessages?: number; // Kept for backward compat but overriden by realtime
}

export default function CustomerSidebar({
    unreadMessages = 0,
}: CustomerSidebarProps) {
    const pathname = usePathname();
    const locale = useLocale();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        let publicUserId: string | null = null;

        const fetchUnreadCount = async () => {
            if (!publicUserId) return;
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', publicUserId)
                .is('read_at', null);

            setUnreadCount(count || 0);
        };

        const init = async () => {
            // Get Public User ID
            const { data } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', user.id)
                .single();

            if (data) {
                publicUserId = data.id;
                fetchUnreadCount();

                // Subscribe to changes
                const channel = supabase.channel('sidebar-badges')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'messages',
                            filter: `recipient_id=eq.${publicUserId}`
                        },
                        () => {
                            // On any change (new message or read status update), refresh count
                            fetchUnreadCount();
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        };

        const cleanupPromise = init();

        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [user]);

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/customer/dashboard',
            badge: null,
        },
        {
            id: 'my-requests',
            label: 'My Requests',
            icon: FileText,
            href: '/customer/dashboard/requests',
            badge: null,
        },
        {
            id: 'messages',
            label: 'Messages',
            icon: MessageSquare,
            href: '/customer/dashboard/messages',
            badge: unreadCount > 0 ? unreadCount : null,
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: User,
            href: '/customer/dashboard/profile',
            badge: null,
        },
    ];

    const isActive = (href: string) => {
        if (href === '/customer/dashboard') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-brand-green text-white rounded-md shadow-lg"
                aria-label="Toggle menu"
            >
                {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:sticky top-0 left-0 h-screen lg:h-auto
          w-64 bg-white border-r border-gray-200
          z-40 transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Header */}
                    <div className="p-6 border-b border-gray-200">
                        <Link href={`/${locale}`} className="flex items-center gap-2">
                            {/* You can add logo here if needed */}
                            <h2 className="text-xl font-bold text-gray-900">Customer Portal</h2>
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">Manage your requests</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4">
                        <ul className="space-y-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);

                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={`/${locale}${item.href}`}
                                            onClick={() => setIsMobileOpen(false)}
                                            className={`
                        flex items-center justify-between px-4 py-3 rounded-lg
                        transition-all duration-200
                        ${active
                                                    ? 'bg-brand-green/10 text-brand-green font-semibold'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }
                      `}
                                        >
                                            <div className="flex items-center">
                                                <Icon className={`h-5 w-5 mr-3 ${active ? 'text-brand-green' : 'text-gray-500'}`} />
                                                <span>{item.label}</span>
                                            </div>
                                            {item.badge && (
                                                <span className="bg-brand-green text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[20px] text-center">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <Link
                            href={`/${locale}/post-task`}
                            className="w-full flex items-center justify-center px-4 py-3 bg-brand-green text-white rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
                        >
                            <PlusCircle className="h-5 w-5 mr-2" />
                            Post a Request
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
}
