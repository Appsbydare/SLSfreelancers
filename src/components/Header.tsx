'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, Grid3X3, ChevronRight, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { animationClasses } from '@/lib/animations';
import { useAuth } from '@/contexts/AuthContext';
import VerifiedBadge from './VerifiedBadge';
import Image from 'next/image';
import { categoryGroups } from '@/data/categoryGroups';
import { useDistrict } from '@/contexts/DistrictContext';
import SriLankaMap from './SriLankaMap';

export default function Header() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const { setSelectedDistrict } = useDistrict();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [activeCategoryGroup, setActiveCategoryGroup] = useState(
    categoryGroups[0]?.id ?? ''
  );
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isMapMenuOpen, setIsMapMenuOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const handleLogout = () => {
    logout();
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
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCategoryMenuOpen(false);
        setIsQuickMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigation = [
    { name: t('browseTasks'), href: `/${locale}/browse-tasks` },
    { name: t('postTask'), href: `/${locale}/post-task` },
  ];

  // Add Project Status for admin users
  const displayNavigation = user?.userType === 'admin' 
    ? [...navigation, { name: 'Project Status', href: '/project-status' }]
    : navigation;

  const activeGroup =
    categoryGroups.find((group) => group.id === activeCategoryGroup) ??
    categoryGroups[0];

  const quickMenuItems = [
    {
      id: 'how-it-works',
      label: t('howItWorks'),
      description: 'Understand how EasyFinder works for posters and taskers.',
      href: `/${locale}/how-it-works`,
    },
    {
      id: 'become-tasker',
      label: t('becomeTasker'),
      description: 'Kick-start your earning journey as a verified tasker.',
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

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-black/95 backdrop-blur-md shadow-lg border-b border-gray-800' 
        : 'bg-black shadow-sm border-b border-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-24">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href={`/${locale}`} className="flex items-center group">
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
          <nav className="hidden md:flex items-center space-x-8">
            {displayNavigation.map((item, index) => {
              const isBrowseTasks = item.href.includes('/browse-tasks');
              if (isBrowseTasks) {
                return (
                  <button
                    key={item.name}
                    type="button"
                    onMouseEnter={() => {
                      setIsCategoryMenuOpen(true);
                      setIsQuickMenuOpen(false);
                    }}
                    onFocus={() => setIsCategoryMenuOpen(true)}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-300 relative group ${
                      isCategoryMenuOpen
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
                  className={`px-3 py-2 text-sm font-medium transition-all duration-300 relative group ${
                    pathname === item.href
                      ? 'text-brand-green'
                      : 'text-white hover:text-brand-green'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="relative z-10">{item.name}</span>
                  {pathname === item.href && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green animate-fade-in-up"></div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </Link>
              );
            })}
          </nav>

          {/* Right side - Search, Language switcher, and auth buttons */}
          <div className="flex items-center space-x-4">
            {/* Search (desktop) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsCategoryMenuOpen(false);
                setIsQuickMenuOpen(false);
                router.push(`/${locale}/browse-tasks`);
              }}
              className="hidden md:block"
            >
              <div className="relative w-[420px]">
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

            <LanguageSwitcher />
            
            {isLoggedIn ? (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">
                    Welcome, {user?.callingName || user?.firstName}
                  </span>
                  {user?.userType === 'tasker' && user?.isVerified && (
                    <VerifiedBadge size="sm" showText={false} />
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center text-white hover:text-red-600 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
                {/* District (Sri Lanka) map trigger */}
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
                {/* Quick menu trigger (rightmost) */}
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md border border-white/10 text-white hover:text-brand-green hover:border-brand-green/60 transition-all duration-300"
                  onClick={() => {
                    setIsQuickMenuOpen(true);
                    setIsCategoryMenuOpen(false);
                    setIsMapMenuOpen(false);
                  }}
                  aria-label="Open quick menu"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-white hover:text-brand-green px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/signup"
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
                  }}
                  aria-label="Open quick menu"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Quick menu button (mobile) */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-white hover:text-brand-green hover:bg-gray-800 transition-all duration-300"
              onClick={() => {
                setIsQuickMenuOpen(true);
                setIsCategoryMenuOpen(false);
              }}
              aria-label="Open quick menu"
            >
              <Grid3X3 className="h-5 w-5" />
            </button>

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
                  className={`block px-3 py-2 text-base font-medium transition-all duration-300 hover:scale-105 ${
                    pathname === item.href
                      ? 'text-brand-green bg-brand-green/10'
                      : 'text-white hover:text-brand-green hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {item.name}
                </Link>
              ))}
              {categoryGroups.length > 0 && (
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
              <div className="pt-4 pb-3 border-t border-gray-800">
                {isLoggedIn ? (
                  <>
                    <div className="px-3 py-2 text-base font-medium text-white flex items-center gap-2">
                      Welcome, {user?.callingName || user?.firstName}
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
                      href="/login"
                      className="block px-3 py-2 text-base font-medium text-white hover:text-brand-green transition-all duration-300 hover:scale-105"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href="/signup"
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
    {isCategoryMenuOpen && activeGroup && (
      <div
        id="category-mega-menu"
        className="fixed top-16 left-0 right-0 z-[55] bg-black/95 backdrop-blur-lg border-t border-b border-gray-800 shadow-2xl"
        onMouseEnter={() => setIsCategoryMenuOpen(true)}
        onMouseLeave={() => setIsCategoryMenuOpen(false)}
      >
        <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {categoryGroups.map((group) => {
                const isActive = group.id === activeCategoryGroup;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onMouseEnter={() => setActiveCategoryGroup(group.id)}
                    onFocus={() => setActiveCategoryGroup(group.id)}
                    onClick={() => setActiveCategoryGroup(group.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-brand-green text-black shadow-md'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {group.icon && <span className="mr-2">{group.icon}</span>}
                    {group.label}
                  </button>
                );
              })}
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeGroup.sections.map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-green">
                    {section.title}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {section.items.map((item) => (
                      <li key={`${section.title}-${item.label}`}>
                        <button
                          type="button"
                          className="w-full text-left text-sm text-white/90 hover:text-brand-green flex items-center justify-between gap-3 transition-colors"
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                item.badge === 'new'
                                  ? 'bg-brand-green/20 text-brand-green'
                                  : 'bg-orange-500/20 text-orange-400'
                              }`}
                            >
                              {item.badge === 'new' ? 'NEW' : 'HOT'}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
    {isMapMenuOpen && (
      <>
        <div
          className="fixed inset-0 bg-black/70 z-[70]"
          onClick={() => setIsMapMenuOpen(false)}
          aria-hidden="true"
        ></div>
        <aside
          className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-950 text-white z-[75] shadow-2xl animate-fade-in-right"
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
              onClick={() => setIsMapMenuOpen(false)}
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
                setIsMapMenuOpen(false);
                router.push(`/${locale}/browse-tasks`);
              }}
            />
          </div>
        </aside>
      </>
    )}
  </>
  );
}
