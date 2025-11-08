'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { animationClasses } from '@/lib/animations';
import { useAuth } from '@/contexts/AuthContext';
import VerifiedBadge from './VerifiedBadge';
import Image from 'next/image';

export default function Header() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const navigation = [
    { name: t('browseTasks'), href: `/${locale}/browse-tasks` },
    { name: t('postTask'), href: `/${locale}/post-task` },
    { name: t('howItWorks'), href: `/${locale}/how-it-works` },
    { name: t('becomeTasker'), href: `/${locale}/become-tasker` },
  ];

  // Add Project Status for admin users
  const displayNavigation = user?.userType === 'admin' 
    ? [...navigation, { name: 'Project Status', href: '/project-status' }]
    : navigation;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-black/95 backdrop-blur-md shadow-lg border-b border-gray-800' 
        : 'bg-black shadow-sm border-b border-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <nav className="hidden md:flex space-x-8">
            {displayNavigation.map((item, index) => (
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
            ))}
          </nav>

          {/* Right side - Language switcher and auth buttons */}
          <div className="flex items-center space-x-4">
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
              </div>
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
  );
}
