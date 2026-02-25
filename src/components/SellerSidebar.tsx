'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  DollarSign,
  User,
  FileText,
  Menu,
  X,
  Lock,
  Bell
} from 'lucide-react';
import { useState } from 'react';

interface SellerSidebarProps {
  unreadMessages?: number;
  activeOrders?: number;
}

export default function SellerSidebar({
  unreadMessages = 0,
  activeOrders = 0
}: SellerSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isVerified = user?.isVerified;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/seller/dashboard',
      badge: null,
      locked: false,
    },
    {
      id: 'gigs',
      label: 'Gigs',
      icon: Package,
      href: '/seller/dashboard/gigs',
      badge: null,
      locked: !isVerified,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      href: '/seller/dashboard/orders',
      badge: activeOrders > 0 ? activeOrders : null,
      locked: !isVerified,
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      href: '/seller/dashboard/messages',
      badge: unreadMessages > 0 ? unreadMessages : null,
      locked: false, // Messaging is usually allowed even if not verified? Or restricted? User said Gigs should be locked.
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Bell,
      href: '/inbox',
      badge: null,
      locked: false,
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: DollarSign,
      href: '/seller/dashboard/earnings',
      badge: null,
      locked: !isVerified,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      href: '/seller/dashboard/profile',
      badge: null,
      locked: false,
    },
    {
      id: 'requests',
      label: 'Custom Requests',
      icon: FileText,
      href: '/seller/dashboard/requests',
      badge: null,
      locked: !isVerified,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/seller/dashboard') {
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
            <h2 className="text-xl font-bold text-gray-900">Seller Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your business</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const locked = item.locked;

                return (
                  <li key={item.id}>
                    {locked ? (
                      <div
                        className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-400 cursor-not-allowed opacity-70 group relative"
                        title="Complete verification to unlock"
                      >
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 mr-3 text-gray-400" />
                          <span>{item.label}</span>
                        </div>
                        <Lock className="h-4 w-4" />
                      </div>
                    ) : (
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
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {!isVerified ? (
              <button
                disabled
                className="w-full flex items-center justify-center px-4 py-3 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                title="Complete verification to create a gig"
              >
                <Lock className="h-5 w-5 mr-2" />
                Create New Gig
              </button>
            ) : (
              <Link
                href={`/${locale}/seller/gigs/create`}
                className="w-full flex items-center justify-center px-4 py-3 bg-brand-green text-white rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                <Package className="h-5 w-5 mr-2" />
                Create New Gig
              </Link>
            )}
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

