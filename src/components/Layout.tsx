'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    // Only redirect if user is in seller mode (userType === 'tasker')
    // Check localStorage for user's preferred mode
    if (!isLoading && isLoggedIn && user?.userType === 'tasker') {
      // Check if user has explicitly chosen customer mode
      const preferredMode = typeof window !== 'undefined' ? localStorage.getItem('userPreferredMode') : null;

      // If user prefers customer mode, don't redirect them to seller pages
      if (preferredMode === 'customer') {
        return;
      }

      // Don't redirect if already on seller pages, gig pages, or auth pages
      // Updated to strictly handle localized paths (e.g. /en/seller/...)
      const isSellerPage = pathname?.includes('/seller') ||
        pathname?.includes('/tasker') ||
        pathname?.includes('/gigs') || // Allow taskers to view gig detail pages
        pathname?.includes('/login') ||
        pathname?.includes('/signup');

      // Redirect to dashboard if on customer pages (homepage, browse-tasks, etc.)
      // This ensures sellers in seller mode are always on seller pages
      if (!isSellerPage && (pathname === '/en' || pathname === '/si' || pathname === '/ta' || pathname?.startsWith('/en/') || pathname?.startsWith('/si/') || pathname?.startsWith('/ta/'))) {
        router.push('/seller/dashboard');
      }
    }
    // If userType is 'customer', they can view customer pages freely (no redirect)
  }, [user, isLoggedIn, isLoading, pathname, router]);

  const isAdminPage = pathname?.includes('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminPage && <Header />}
      <main className={`flex-1 ${isAdminPage ? '' : 'pt-16'}`}>
        {children}
      </main>
      {!isAdminPage && <Footer />}
    </div>
  );
}
