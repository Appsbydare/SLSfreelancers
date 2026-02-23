import React from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Briefcase,
    Package,
    ShoppingCart,
    DollarSign,
    MessageSquare,
    ListTree,
    ActivitySquare
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/app/actions/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    // Final safeguard to double-check admin status. Middleware should handle this, but server-side defense in depth is good.
    const isSuperAdmin = await isAdmin();

    if (!isSuperAdmin) {
        redirect(`/${locale}`);
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    let adminProfile = null;
    if (user) {
        const { data } = await supabase
            .from('users')
            .select('first_name, last_name, email, profile_image_url')
            .eq('auth_user_id', user.id)
            .single();
        adminProfile = data;
    }

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, href: `/${locale}/admin` },
        { label: 'Users & Roles', icon: Users, href: `/${locale}/admin/users` },
        { label: 'Verifications', icon: ShieldCheck, href: `/${locale}/admin/verifications` },
        { label: 'Tasks (Custom)', icon: Briefcase, href: `/${locale}/admin/tasks` },
        { label: 'Gigs (Packages)', icon: Package, href: `/${locale}/admin/gigs` },
        { label: 'Active Orders', icon: ShoppingCart, href: `/${locale}/admin/orders` },
        { label: 'Financials', icon: DollarSign, href: `/${locale}/admin/finances` },
        { label: 'Reviews', icon: MessageSquare, href: `/${locale}/admin/reviews` },
        { label: 'Categories', icon: ListTree, href: `/${locale}/admin/categories` },
        { label: 'Project Status', icon: ActivitySquare, href: `/${locale}/admin/project-status` },
        { label: 'Audit Logs', icon: ActivitySquare, href: `/${locale}/admin/audit-logs` },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar - Dark Mode styled */}
            <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col h-full border-r border-gray-800 shadow-xl z-20">
                <div className="h-16 flex items-center px-6 border-b border-gray-800">
                    <Link href={`/${locale}/admin`} className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
                        <ShieldCheck className="w-6 h-6 text-brand-green" />
                        Admin <span className="text-gray-400 font-normal text-sm">Portal</span>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center px-6 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-l-2 border-transparent hover:border-brand-green group"
                        >
                            <item.icon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-brand-green transition-colors" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800 mt-auto">
                    {adminProfile ? (
                        <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-3 text-sm">
                            {adminProfile.profile_image_url ? (
                                <img src={adminProfile.profile_image_url} alt="Admin" className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-medium border border-gray-600 uppercase">
                                    {adminProfile.first_name?.[0]}{adminProfile.last_name?.[0]}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{adminProfile.first_name} {adminProfile.last_name}</p>
                                <p className="text-xs text-brand-green truncate">Super Admin</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-400">
                            <p className="font-medium text-gray-200 mb-1">Super Admin</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative z-10 overflow-y-auto">
                {/* Top Navbar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
                    <div className="text-gray-800 font-semibold text-lg md:hidden">
                        Admin Portal
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/${locale}`}
                            className="text-sm font-medium text-gray-600 hover:text-brand-green transition-colors"
                        >
                            Exit to App &rarr;
                        </Link>
                    </div>
                </header>

                {/* Scrollable Main View */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
