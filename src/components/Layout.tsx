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
    // If they've toggled to customer mode, allow them to view customer pages
    if (!isLoading && isLoggedIn && user?.userType === 'tasker') {
      // Don't redirect if already on seller pages
      const isSellerPage = pathname?.startsWith('/seller') || 
                          pathname?.startsWith('/tasker') ||
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
