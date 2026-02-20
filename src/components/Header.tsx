'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, Grid3X3, ChevronRight, ChevronLeft, Search, ArrowLeftRight, User as UserIcon, LayoutDashboard, Bell } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { animationClasses } from '@/lib/animations';
import { useAuth } from '@/contexts/AuthContext';
import VerifiedBadge from './VerifiedBadge';
import Image from 'next/image';
import serviceGroups from '@/data/service-groups.json';
import { useDistrict } from '@/contexts/DistrictContext';
import SriLankaMap from './SriLankaMap';
import { supabase } from '@/lib/supabase';

// Helper function to format relative time natively
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

export default function Header() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, logout, switchRole } = useAuth();
  const { setSelectedDistrict } = useDistrict();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [activeCategoryGroup, setActiveCategoryGroup] = useState(
    'trending'
  );
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isMapMenuOpen, setIsMapMenuOpen] = useState(false);
  const [isMapMenuClosing, setIsMapMenuClosing] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const groupScrollRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  // Fetch and Subscribe to Notifications
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      const fetchNotifications = async () => {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      };

      fetchNotifications();

      const channel = supabase.channel('header-notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications(prev => [payload.new, ...prev].slice(0, 10));
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isLoggedIn, user?.id]);

  const handleNotificationsOpen = async () => {
    setIsNotificationMenuOpen(!isNotificationMenuOpen);
    setIsProfileDropdownOpen(false);

    // Mark as read when opening
    if (!isNotificationMenuOpen && unreadCount > 0 && user?.id) {
      setUnreadCount(0);
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/en');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsCategoryMenuOpen(false);
    setIsQuickMenuOpen(false);
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
    setIsNotificationMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCategoryMenuOpen(false);
        setIsQuickMenuOpen(false);
        setIsProfileDropdownOpen(false);
        setIsNotificationMenuOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setIsNotificationMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigation = [
    { name: 'Browse Services', href: `/${locale}/browse-services` },
    { name: 'Post Request', href: `/${locale}/post-task` },
  ];

  // Check localStorage for user's preferred mode
  const [preferredMode, setPreferredMode] = useState<string | null>(null);

  useEffect(() => {

    if (user && isLoggedIn) {
      const savedMode = localStorage.getItem('userPreferredMode');

      // If we have a saved preference that differs from current auth state, sync it
      if (savedMode === 'seller' && user.userType !== 'tasker' && (user.hasTaskerAccount || user.originalUserType === 'tasker')) {
        switchRole('tasker');
      } else if (savedMode === 'customer' && user.userType !== 'customer') {
        switchRole('customer');
      }

      setPreferredMode(savedMode);
    }
  }, [user?.id, isLoggedIn]); // Only run when user session loads/changes

  // Add Project Status for admin users and seller-specific links
  let displayNavigation = [...navigation];
  // Trust user.userType as the source of truth for UI rendering
  const isSeller = user?.userType === 'tasker';

  if (isSeller) {
    displayNavigation = [
      { name: 'Dashboard', href: `/${locale}/seller/dashboard` },
      { name: 'My Gigs', href: `/${locale}/seller/dashboard/gigs` },
      { name: 'Orders', href: `/${locale}/seller/dashboard/orders` },
      { name: 'Earnings', href: `/${locale}/seller/dashboard/earnings` },
    ];
  } else if (user?.userType === 'admin') {
    displayNavigation = [...navigation, { name: 'Project Status', href: `/${locale}/project-status` }];
  }

  const handleToggleMode = () => {
    // Only allow toggle for users who have both accounts OR are registered as tasker
    const canToggle = user?.hasTaskerAccount || user?.originalUserType === 'tasker';

    if (!canToggle) return;

    // Determine current mode based on user.userType which is the source of truth in AuthContext
    const currentMode = user?.userType === 'tasker' ? 'seller' : 'customer';

    if (currentMode === 'seller') {
      // Switch to customer
      localStorage.setItem('userPreferredMode', 'customer');
      setPreferredMode('customer');
      switchRole('customer');
      router.push(`/${locale}/customer/dashboard`);
    } else {
      // Switch to seller
      localStorage.setItem('userPreferredMode', 'seller');
      setPreferredMode('seller');
      switchRole('tasker');
      router.push(`/${locale}/seller/dashboard`);
    }
  };


  const iconsById: Record<string, string> = useMemo(() => ({
    'home-property': '🏠',
    'automotive': '🚗',
    'health-wellness': '💊',
    'education-training': '🎓',
    'legal-financial': '⚖️',
    'events-entertainment': '🎉',
    'business-marketing': '📣',
    'transport-travel': '✈️',
    'personal-services': '🧍‍♂️',
    'construction-engineering': '🏗️',
    'pet-services': '🐾',
    'government-utility': '🏛️',
    'freelance-remote': '💻'
  }), []);

  const combinedGroups = useMemo(() => {
    const trendingServices = [
      'Logo Design',
      'UX Research',
      '2D Animation',
      'WordPress Speed Optimization',
      'Meta Ads Strategy',
      'AI Prompt Engineering',
      'Notion Consulting',
      'AR Filters',
      'Vertical Video Editing',
      'Shopify Migration'
    ];
    const withIcons = (serviceGroups as any).map((g: any) => {
      // Normalize section items to support optional badges
      const normalizedSections = g.sections
        ? g.sections.map((s: any) => ({
          title: s.title,
          items: (s.items || []).map((it: any) =>
            typeof it === 'string' ? { label: it } : it
          ),
        }))
        : undefined;

      // Randomly mark one item as NEW per group (if sections exist)
      if (normalizedSections && normalizedSections.length > 0) {
        const flat: any[] = [];
        normalizedSections.forEach((s: any) => {
          s.items.forEach((it: any) => flat.push(it));
        });
        if (flat.length > 0) {
          const idx = Math.floor(Math.random() * flat.length);
          if (!flat[idx].badge) {
            flat[idx].badge = 'new';
          }
        }
      }

      return {
        ...g,
        icon: iconsById[g.id] || '',
        sections: normalizedSections ?? undefined,
      };
    });
    return [
      {
        id: 'trending',
        name: 'Trending',
        icon: '🔥',
        description: 'Popular and rising services',
        services: trendingServices
      },
      ...withIcons
    ];
  }, [iconsById]);

  const activeGroup =
    combinedGroups.find((group: any) => group.id === activeCategoryGroup) ??
    combinedGroups[0];

  const quickMenuItems = [
    {
      id: 'how-it-works',
      label: t('howItWorks'),
      description: 'Understand how EasyFinder works for posters and taskers.',
      href: `/${locale}/how-it-works`,
    },
    {
      id: 'become-seller',
      label: 'Become a Seller',
      description: 'Start earning by offering your services as a verified seller.',
      href: `/${locale}/become-tasker`,
    },
    {
      id: 'terms',
      label: 'Terms & Conditions',
      description: 'Review the guidelines that keep the marketplace safe.',
      href: '#',
      disabled: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Manage notifications, language, and account security.',
      href: '#',
      disabled: true,
    },
    {
      id: 'help',
      label: 'Help',
      description: 'Reach our support team for quick answers.',
      href: '#',
      disabled: true,
    },
  ];

  // Smoothly close the map drawer with a slow slide-out
  const closeMapMenu = () => {
    setIsMapMenuClosing(true);
    // match CSS duration in animations.css (0.6s)
    setTimeout(() => {
      setIsMapMenuOpen(false);
      setIsMapMenuClosing(false);
    }, 600);
  };

  // Check if we're on a seller page
  const isSellerPage = pathname?.startsWith('/seller') || pathname?.startsWith('/tasker') ||
    pathname?.startsWith(`/${locale}/seller`) || pathname?.startsWith(`/${locale}/tasker`);

  // Darker green color for seller pages: #007413 (darker than brand-green #0fcc17)
  const headerBgClass = isSellerPage
    ? (isScrolled
      ? 'bg-[#007413]/95 backdrop-blur-md shadow-lg border-b border-[#004C0D]'
      : 'bg-[#007413] shadow-sm border-b border-[#004C0D]')
    : (isScrolled
      ? 'bg-black/95 backdrop-blur-md shadow-lg border-b border-gray-800'
      : 'bg-black shadow-sm border-b border-gray-800');

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBgClass}`}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-24">
          <div className="flex items-center h-16 gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                href={`/${locale}`}
                className="flex items-center group outline-none focus:outline-none focus:ring-0 ring-0"
              >
                <Image
                  src="/logo-white.svg"
                  alt="EasyFinder"
                  width={188}
                  height={64}
                  className="h-16 w-auto transition-all duration-300 group-hover:scale-110"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {displayNavigation.map((item, index) => {
                // Hide Browse Tasks category menu for sellers
                const isBrowseServices = item.href.includes('/browse-services');
                if (isBrowseServices && !isSeller) {
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onMouseEnter={() => {
                        setIsCategoryMenuOpen(true);
                        setIsQuickMenuOpen(false);
                      }}
                      onFocus={() => setIsCategoryMenuOpen(true)}
                      className={`px-3 py-2 text-sm font-medium transition-all duration-300 relative group ${isCategoryMenuOpen
                        ? 'text-brand-green'
                        : 'text-white hover:text-brand-green'
                        }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                      aria-haspopup="true"
                      aria-expanded={isCategoryMenuOpen}
                      aria-controls="category-mega-menu"
                    >
                      <span className="relative z-10">{t('browseTasks')}</span>
                      {isCategoryMenuOpen && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green animate-fade-in-up"></div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-300 relative group ${pathname === item.href || (item.href.includes('/seller/dashboard') && pathname.startsWith('/seller/dashboard'))
                      ? 'text-brand-green'
                      : 'text-white hover:text-brand-green'
                      }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="relative z-10">{item.name}</span>
                    {(pathname === item.href || (item.href.includes('/seller/dashboard') && pathname.startsWith('/seller/dashboard'))) && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green animate-fade-in-up"></div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </Link>
                );
              })}
            </nav>

            {/* Center - Search Bar */}
            {!isSeller && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsCategoryMenuOpen(false);
                  setIsQuickMenuOpen(false);
                  router.push(`/${locale}/browse-services`);
                }}
                className="hidden md:block flex-1 max-w-xl mx-6"
              >
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={headerSearch}
                    onChange={(e) => setHeaderSearch(e.target.value)}
                    placeholder="What service are you looking for today?"
                    className="w-full pl-9 pr-10 py-2 rounded-md bg-gray-900/70 border border-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
                    aria-label="Search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Right side - Language switcher and auth buttons */}
            <div className="flex items-center gap-3 ml-auto">
              <LanguageSwitcher />

              {isLoggedIn ? (
                <div className="hidden md:flex items-center gap-3">
                  {/* Notification Bell */}
                  <div className="relative" ref={notificationMenuRef}>
                    <button
                      onClick={handleNotificationsOpen}
                      className="p-2 rounded-md text-white hover:text-brand-green transition-all duration-300 hover:bg-gray-800/50 relative"
                      title="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-gray-900"></span>
                      )}
                    </button>

                    {isNotificationMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-gray-950 border border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                          <h4 className="text-white font-medium">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="bg-brand-green/20 text-brand-green text-xs px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="max-h-[350px] overflow-y-auto">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-800 flex flex-col">
                              {notifications.map((notif: any) => (
                                <div key={notif.id} className={`p-4 hover:bg-gray-900 transition-colors ${!notif.is_read ? 'bg-gray-900/50' : ''}`}>
                                  <div className="flex gap-3">
                                    <div className="mt-1 bg-brand-green/10 p-2 rounded-full h-fit flex-shrink-0">
                                      <Bell className="h-4 w-4 text-brand-green" />
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-medium text-white mb-1">{notif.title}</h5>
                                      <p className="text-xs text-gray-400 mb-2">{notif.message}</p>
                                      <span className="text-[10px] text-gray-500">
                                        {formatRelativeTime(notif.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                              <Bell className="h-8 w-8 text-gray-700 mb-3" />
                              <p className="text-gray-400 text-sm">You are all caught up!</p>
                            </div>
                          )}
                        </div>
                        <div className="p-3 border-t border-gray-800 bg-gray-900/50 text-center">
                          <Link
                            href={isSeller ? `/${locale}/seller/dashboard` : `/${locale}/customer/dashboard/requests`}
                            className="text-brand-green text-xs font-medium hover:underline inline-block"
                            onClick={() => setIsNotificationMenuOpen(false)}
                          >
                            Go to Dashboard
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(!isProfileDropdownOpen);
                        setIsNotificationMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-white hover:text-brand-green transition-all duration-300 hover:bg-gray-800/50"
                      title="Profile Menu"
                    >
                      <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-600 flex-shrink-0 bg-gray-800 flex items-center justify-center">
                        {user?.profileImage ? (
                          <Image
                            src={user.profileImage}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/70 text-sm">Welcome,</span>
                        <span className="text-white text-sm font-medium">
                          {user?.callingName || user?.firstName}
                        </span>
                        {user?.userType === 'tasker' && user?.isVerified && (
                          <VerifiedBadge size="sm" showText={false} />
                        )}
                      </div>
                    </button>

                    {/* Profile Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-gray-950 border border-gray-800 rounded-lg shadow-xl z-50">
                        <div className="p-4 border-b border-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-600 flex-shrink-0 bg-gray-800 flex items-center justify-center">
                              {user?.profileImage ? (
                                <Image
                                  src={user.profileImage}
                                  alt="Profile"
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <UserIcon className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{user?.callingName || user?.firstName}</p>
                              <p className="text-gray-400 text-sm">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2">
                          {/* Dashboard Link for Customers/Sellers */}
                          {(!isSeller) && (
                            <Link
                              href={`/${locale}/customer/dashboard`}
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:text-brand-green hover:bg-gray-800/50 rounded-md transition-all duration-300"
                            >
                              <LayoutDashboard className="h-4 w-4" />
                              Dashboard
                            </Link>
                          )}

                          {/* Mode Switch / Become a Seller */}
                          {user?.hasTaskerAccount || user?.userType === 'tasker' ? (
                            <button
                              onClick={() => {
                                handleToggleMode();
                                setIsProfileDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:text-brand-green hover:bg-gray-800/50 rounded-md transition-all duration-300"
                            >
                              <ArrowLeftRight className="h-4 w-4" />
                              {preferredMode === 'customer' || (user?.userType === 'customer' && !preferredMode)
                                ? 'Switch to Seller Mode'
                                : 'Switch to Customer Mode'}
                            </button>
                          ) : user?.hasCustomerAccount && !user?.hasTaskerAccount ? (
                            <Link
                              href={`/${locale}/become-tasker`}
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-green hover:text-white hover:bg-brand-green/10 rounded-md transition-all duration-300 border border-brand-green/30"
                            >
                              <ArrowLeftRight className="h-4 w-4" />
                              Become a Seller
                            </Link>
                          ) : null}

                          {/* Logout Button */}
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsProfileDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-all duration-300"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* District (Sri Lanka) map trigger - Hide for sellers */}
                  {!isSeller && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center p-2 rounded-md border border-white/10 text-white hover:text-brand-green hover:border-brand-green/60 transition-all duration-300"
                      onClick={() => {
                        setIsMapMenuOpen(true);
                        setIsCategoryMenuOpen(false);
                        setIsQuickMenuOpen(false);
                      }}
                      aria-label="Choose district"
                      title="Choose District"
                    >
                      <Image src="/images/SLIcon.png" alt="Sri Lanka" width={36} height={36} className="rounded-md" />
                    </button>
                  )}
                  {/* Quick menu trigger (rightmost) - Hide for sellers */}
                  {!isSeller && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center p-2 rounded-md border border-white/10 text-white hover:text-brand-green hover:border-brand-green/60 transition-all duration-300"
                      onClick={() => {
                        setIsQuickMenuOpen(true);
                        setIsCategoryMenuOpen(false);
                        setIsMapMenuOpen(false);
                        setIsProfileDropdownOpen(false);
                      }}
                      aria-label="Open quick menu"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href={`/${locale}/login`}
                    className="text-white hover:text-brand-green px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href={`/${locale}/signup`}
                    className="bg-brand-green text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-green/90 transition-all duration-300 hover:scale-105 hover:shadow-lg transform"
                  >
                    {t('signUp')}
                  </Link>
                  {/* District (Sri Lanka) map trigger */}
                  <button
                    type="button"
                    className="inline-flex items-center justify-center p-2 rounded-md border border-white/10 text-white hover:text-brand-green hover:border-brand-green/60 transition-all duration-300"
                    onClick={() => {
                      setIsMapMenuOpen(true);
                      setIsCategoryMenuOpen(false);
                      setIsQuickMenuOpen(false);
                      setIsProfileDropdownOpen(false);
                    }}
                    aria-label="Choose district"
                    title="Choose District"
                  >
                    <Image src="/images/SLIcon.png" alt="Sri Lanka" width={36} height={36} className="rounded-md" />
                  </button>
                  {/* Quick menu trigger (rightmost) */}
                  <button
                    type="button"
                    className="inline-flex items-center justify-center p-2 rounded-md border border-white/10 text-white hover:text-brand-green hover:border-brand-green/60 transition-all duration-300"
                    onClick={() => {
                      setIsQuickMenuOpen(true);
                      setIsCategoryMenuOpen(false);
                      setIsMapMenuOpen(false);
                      setIsProfileDropdownOpen(false);
                    }}
                    aria-label="Open quick menu"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Quick menu button (mobile) - Hide for sellers */}
              {!isSeller && (
                <button
                  type="button"
                  className="md:hidden p-2 rounded-md text-white hover:text-brand-green hover:bg-gray-800 transition-all duration-300"
                  onClick={() => {
                    setIsQuickMenuOpen(true);
                    setIsCategoryMenuOpen(false);
                    setIsProfileDropdownOpen(false);
                  }}
                  aria-label="Open quick menu"
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-white hover:text-brand-green hover:bg-gray-800 transition-all duration-300 hover:scale-110"
              >
                <div className="relative">
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6 animate-fade-in" />
                  ) : (
                    <Menu className="h-6 w-6 animate-fade-in" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden animate-slide-in-down">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-800">
                {displayNavigation.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 text-base font-medium transition-all duration-300 hover:scale-105 ${pathname === item.href
                      ? 'text-brand-green bg-brand-green/10'
                      : 'text-white hover:text-brand-green hover:bg-gray-800'
                      }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {item.name}
                  </Link>
                ))}
                {/* Hide Browse Tasks category menu for sellers in mobile */}
                {!isSeller && (serviceGroups as any).length > 0 && (
                  <button
                    type="button"
                    className="block w-full text-left px-3 py-2 text-base font-medium text-white hover:text-brand-green hover:bg-gray-800 transition-all duration-300"
                    onClick={() => {
                      setIsCategoryMenuOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {t('browseTasks')}
                  </button>
                )}
                {/* Mode Toggle button or Login as Tasker */}
                {user?.originalUserType === 'tasker' ? (
                  <button
                    onClick={() => {
                      handleToggleMode();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-base font-medium text-brand-green hover:text-brand-green/80 transition-all duration-300 flex items-center"
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    {isSeller ? 'Customer Mode' : 'Login as Tasker'}
                  </button>
                ) : isLoggedIn && (
                  <Link
                    href={`/${locale}/login?type=tasker`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-left px-3 py-2 text-base font-medium text-brand-green hover:text-brand-green/80 transition-all duration-300 flex items-center"
                  >
                    Login as Tasker
                  </Link>
                )}
                <div className="pt-4 pb-3 border-t border-gray-800">
                  {isLoggedIn ? (
                    <>
                      <div className="px-3 py-2 text-base font-medium text-white flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-600 flex-shrink-0 bg-gray-800 flex items-center justify-center">
                          {user?.profileImage ? (
                            <Image src={user.profileImage} alt="Profile" width={32} height={32} className="h-full w-full object-cover" />
                          ) : (
                            <UserIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <span className="truncate max-w-[150px]">{user?.callingName || user?.firstName}</span>
                        {user?.userType === 'tasker' && user?.isVerified && (
                          <VerifiedBadge size="sm" showText={false} />
                        )}
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 transition-all duration-300"
                      >
                        <LogOut className="h-4 w-4 inline mr-2" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/${locale}/login`}
                        className="block px-3 py-2 text-base font-medium text-white hover:text-brand-green transition-all duration-300 hover:scale-105"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('login')}
                      </Link>
                      <Link
                        href={`/${locale}/signup`}
                        className="block px-3 py-2 text-base font-medium text-brand-green hover:text-brand-green/80 transition-all duration-300 hover:scale-105"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('signUp')}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      {isCategoryMenuOpen && activeGroup && !isSeller && (
        <div
          id="category-mega-menu"
          className="fixed top-16 left-0 right-0 z-[55] bg-black/95 backdrop-blur-lg border-t border-b border-gray-800 shadow-2xl"
          onMouseEnter={() => setIsCategoryMenuOpen(true)}
          onMouseLeave={() => setIsCategoryMenuOpen(false)}
        >
          <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3">
            <div className="relative flex-1">
              {/* Horizontal scroll container with hidden scrollbar */}
              <div
                ref={groupScrollRef}
                onWheelCapture={(e) => {
                  if (!groupScrollRef.current) return;
                  e.preventDefault();
                  e.stopPropagation();
                  groupScrollRef.current.scrollBy({ left: e.deltaY, behavior: 'smooth' });
                }}
                onWheel={(e) => {
                  if (!groupScrollRef.current) return;
                  e.preventDefault();
                  e.stopPropagation();
                  groupScrollRef.current.scrollBy({ left: e.deltaY, behavior: 'smooth' });
                }}
                className="overflow-x-hidden overflow-y-hidden no-scrollbar"
              >
                <div className="flex items-center gap-2 min-w-max">
                  {combinedGroups.map((group: any) => {
                    const isActive = group.id === activeCategoryGroup;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onMouseEnter={() => setActiveCategoryGroup(group.id)}
                        onFocus={() => setActiveCategoryGroup(group.id)}
                        onClick={() => setActiveCategoryGroup(group.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${isActive
                          ? 'bg-brand-green text-black shadow-md'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        <span className="mr-2">{group.icon || ''}</span>
                        {group.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Left/Right scroll buttons */}
              <button
                type="button"
                className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10"
                onClick={() => groupScrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10"
                onClick={() => groupScrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen(false)}
              className="p-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/40 transition"
            >
              <span className="sr-only">Close categories</span>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="border-t border-gray-800 bg-[#060606] max-h-[70vh] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <p className="text-white/70 mb-4">{activeGroup.description}</p>
              {activeGroup.sections && activeGroup.sections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {activeGroup.sections.map((section: any) => (
                    <div key={section.title}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-brand-green mb-3">
                        {section.title}
                      </p>
                      <ul className="space-y-2">
                        {section.items.map((item: any) => {
                          const label = typeof item === 'string' ? item : item.label;
                          const badge = typeof item === 'string' ? undefined : item.badge;
                          return (
                            <li key={label} className="flex items-center justify-between gap-3">
                              <button
                                type="button"
                                className="w-full text-left text-sm text-white/90 hover:text-brand-green transition-colors"
                                onClick={() => {
                                  setIsCategoryMenuOpen(false);
                                  router.push(`/${locale}/browse-services?service=${encodeURIComponent(label)}`);
                                }}
                              >
                                {label}
                              </button>
                              {badge === 'new' && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-green/20 text-brand-green">
                                  NEW
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeGroup.services?.map((svc: string) => (
                    <li key={svc}>
                      <button
                        type="button"
                        className="w-full text-left text-sm text-white/90 hover:text-brand-green transition-colors"
                        onClick={() => {
                          setIsCategoryMenuOpen(false);
                          router.push(`/${locale}/browse-services?service=${encodeURIComponent(svc)}`);
                        }}
                      >
                        {svc}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      {isQuickMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-[70]"
            onClick={() => setIsQuickMenuOpen(false)}
            aria-hidden="true"
          ></div>
          <aside
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-gray-950 text-white z-[75] shadow-2xl animate-fade-in-right"
            role="dialog"
            aria-modal="true"
            aria-label="Quick menu"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
              <div>
                <p className="text-lg font-semibold">Quick Menu</p>
                <p className="text-sm text-white/60">
                  Jump to helpful sections in a click.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickMenuOpen(false)}
                className="p-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/40 transition"
              >
                <span className="sr-only">Close quick menu</span>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {quickMenuItems.map((item) =>
                item.disabled ? (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-gray-800 bg-gray-900/60 text-white/50"
                  >
                    <p className="text-base font-medium flex items-center gap-2">
                      {item.label}
                      <span className="text-[10px] uppercase tracking-widest bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
                        Coming soon
                      </span>
                    </p>
                    <p className="text-sm mt-1">{item.description}</p>
                  </div>
                ) : (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-800 hover:border-brand-green/60 hover:bg-gray-900/60 transition-colors group"
                    onClick={() => setIsQuickMenuOpen(false)}
                  >
                    <div>
                      <p className="text-base font-semibold text-white group-hover:text-brand-green">
                        {item.label}
                      </p>
                      <p className="text-sm text-white/70 mt-1">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-brand-green" />
                  </Link>
                )
              )}
            </div>
          </aside>
        </>
      )}
      {(isMapMenuOpen || isMapMenuClosing) && (
        <>
          <div
            className={`fixed inset-0 bg-black/70 z-[70] ${isMapMenuClosing ? 'animate-fade-out-slow' : 'animate-fade-in'}`}
            onClick={closeMapMenu}
            aria-hidden="true"
          ></div>
          <aside
            className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-950 text-white z-[75] shadow-2xl ${isMapMenuClosing ? 'animate-slide-out-right-slow' : 'animate-slide-in-right-slow'}`}
            role="dialog"
            aria-modal="true"
            aria-label="District selector"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
              <div>
                <p className="text-lg font-semibold">Select Your District</p>
                <p className="text-sm text-white/60">
                  Pick a district to filter services instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={closeMapMenu}
                className="p-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/40 transition"
              >
                <span className="sr-only">Close district selector</span>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <SriLankaMap
                showLabels={true}
                onDistrictSelect={(district) => {
                  setSelectedDistrict(district);
                  closeMapMenu();
                  router.push(`/browse-gigs?district=${district.name}`);
                }}
              />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
