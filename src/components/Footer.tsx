'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { animationClasses } from '@/lib/animations';
import Image from 'next/image';

export default function Footer() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  
  // Check if we're on a seller page
  const isSellerPage = pathname?.startsWith('/seller') || pathname?.startsWith('/tasker');
  
  // Darker green color for seller pages: #0a9a10 (darker than brand-green #0fcc17)
  const footerBgClass = isSellerPage ? 'bg-[#0a9a10] text-white' : 'bg-gray-900 text-white';

  return (
    <footer className={footerBgClass}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-24 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2 animate-fade-in-up">
            <div className="flex items-center mb-4">
              <Image
                src="/logo-white.svg"
                alt="EasyFinder"
                width={188}
                height={64}
                className="h-16 w-auto transition-all duration-300 hover:scale-110"
              />
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Connect with skilled professionals in Sri Lanka. Get any task done quickly and reliably.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281H7.83v6.281h8.449V7.707z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/browse-tasks" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  {t('browseTasks')}
                </Link>
              </li>
              <li>
                <Link href="/post-task" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  {t('postTask')}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  {t('howItWorks')}
                </Link>
              </li>
              <li>
                <Link href="/become-tasker" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  {t('becomeTasker')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Trust & Safety
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={`border-t ${isSellerPage ? 'border-[#088a0e]' : 'border-gray-800'} mt-8 pt-8 animate-fade-in-up`} style={{ animationDelay: '600ms' }}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 EasyFinder. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors duration-300 hover:translate-x-1 inline-block">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors duration-300 hover:translate-x-1 inline-block">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
