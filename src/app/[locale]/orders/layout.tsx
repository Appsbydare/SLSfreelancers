'use client';

import { useAuth } from '@/contexts/AuthContext';
import CustomerDashboardLayout from '../customer/dashboard/layout';
import SellerDashboardLayout from '../seller/dashboard/layout';

export default function OrdersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    if (user?.userType === 'tasker') {
        return <SellerDashboardLayout>{children}</SellerDashboardLayout>;
    }

    return <CustomerDashboardLayout>{children}</CustomerDashboardLayout>;
}
