'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { animationClasses } from '@/lib/animations';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Add admin navigation
  const adminNavigation = [
    ...navigation,
    { name: 'Project Status', href: '/project-status' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
        : 'bg-white shadow-sm border-b'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href={`/${locale}`} className="flex items-center group">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                <span className="text-white font-bold text-lg">SL</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-blue-600">
                Sri Lanka Tasks
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {(user?.userType === 'admin' ? adminNavigation : navigation).map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium transition-all duration-300 relative group ${
                  pathname === item.href
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="relative z-10">{item.name}</span>
                {pathname === item.href && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 animate-fade-in-up"></div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            ))}
          </nav>

          {/* Right side - Language switcher and auth buttons */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href={`/${locale}/login`}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105"
              >
                {t('login')}
              </Link>
              <Link
                href={`/${locale}/signup`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg transform"
              >
                {t('signUp')}
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-all duration-300 hover:scale-110"
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
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {(user?.userType === 'admin' ? adminNavigation : navigation).map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-base font-medium transition-all duration-300 hover:scale-105 ${
                    pathname === item.href
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 pb-3 border-t border-gray-200">
                <Link
                  href={`/${locale}/login`}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/signup`}
                  className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-blue-700 transition-all duration-300 hover:scale-105"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('signUp')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
