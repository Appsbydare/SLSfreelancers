import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, User, Shield, Briefcase, Mail, Phone, MapPin, Calendar, ActivitySquare } from 'lucide-react';
import UserActions from './UserActions';
import UserDetailTabs from './UserDetailTabs';

export const revalidate = 0;

export default async function AdminUserDetailPage({
    params
}: {
    params: Promise<{ locale: string; userId: string }>;
}) {
    const { locale, userId } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return (
            <div className="max-w-3xl mx-auto py-12 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">User Not Found</h2>
                <Link href={`/${locale}/admin/users`} className="text-brand-green hover:underline">
                    &larr; Back to Directory
                </Link>
            </div>
        );
    }

    // Get all profile details (they might have both even if default type is one)
    const { data: taskerProfile } = await supabase
        .from('taskers')
        .select('*')
        .eq('user_id', userId)
        .single();

    const { data: customerProfile } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .single();

    // Fetch related audit logs
    const { data: auditLogs } = await supabase
        .from('admin_actions')
        .select('*, admin:users!admin_actions_admin_id_fkey(first_name, last_name)')
        .eq('entity_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    // Fetch aggregate statistics
    let stats = {
        gigs: 0,
        bids: 0,
        requests: 0,
        recentBids: [] as any[],
        ordersAsSeller: 0,
        ordersAsCustomer: 0,
    };

    if (taskerProfile) {
        const [{ count: gigsCount }, { count: bidsCount }, { data: recentBids }, { count: ordersAsSellerCount }] = await Promise.all([
            supabase.from('gigs').select('*', { count: 'exact', head: true }).eq('seller_id', taskerProfile.id),
            supabase.from('offers').select('*', { count: 'exact', head: true }).eq('tasker_id', taskerProfile.id), // assuming offers=bids
            supabase.from('offers').select('*, task:tasks(title, slug)').eq('tasker_id', taskerProfile.id).order('created_at', { ascending: false }).limit(5),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', taskerProfile.id)
        ]);
        stats.gigs = gigsCount || 0;
        stats.bids = bidsCount || 0;
        stats.recentBids = recentBids || [];
        stats.ordersAsSeller = ordersAsSellerCount || 0;
    }

    if (customerProfile) {
        const [{ count: requestsCount }, { count: ordersAsCustomerCount }] = await Promise.all([
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('customer_id', customerProfile.id),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('buyer_id', customerProfile.id) // note: buyer_id for customers table in orders 
        ]);
        stats.requests = requestsCount || 0;
        stats.ordersAsCustomer = ordersAsCustomerCount || 0;
    }

    const primaryProfileData = user.user_type === 'tasker' ? taskerProfile : customerProfile;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                <Link
                    href={`/${locale}/admin/users`}
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Back to Users"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {user.first_name} {user.last_name}
                        {user.is_super_admin && <span title="Platform Admin"><Shield className="w-5 h-5 text-purple-600" /></span>}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">User ID: {user.id}</p>
                </div>
                <div className="ml-auto">
                    <UserActions userId={user.id} status={user.status || 'active'} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Core Identity */}
                <div className="space-y-6 md:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 text-center border-b border-gray-100">
                            <div className="w-24 h-24 bg-brand-green/10 text-brand-green text-3xl font-bold rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                {primaryProfileData?.profile_image_url || user.profile_image_url ? (
                                    <img src={primaryProfileData?.profile_image_url || user.profile_image_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user.first_name?.charAt(0) || user.email.charAt(0)
                                )}
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
                            <p className="text-sm text-gray-500 capitalize">{user.user_type}</p>

                            {/* Badges for account presence */}
                            <div className="flex justify-center gap-1 mt-2">
                                {taskerProfile && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">Tasker Profile</span>}
                                {customerProfile && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">Customer Profile</span>}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                {user.status === 'suspended' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Suspended</span>
                                ) : <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Active</span>}

                                {user.is_verified ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Verified ID</span>
                                ) : <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Unverified</span>}
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3 text-sm">
                                <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900">{user.email}</p>
                                    <p className="text-gray-500 text-xs">Email Address</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900">{user.phone || 'N/A'}</p>
                                    <p className="text-gray-500 text-xs">Phone Number</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900">{[user.city, user.district, user.location].filter(Boolean).join(', ') || 'N/A'}</p>
                                    <p className="text-gray-500 text-xs">Location</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
                                    <p className="text-gray-500 text-xs">Joined</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Activity & Logs inside Tabs */}
                <div className="space-y-6 md:col-span-2">
                    <UserDetailTabs
                        user={user}
                        taskerProfile={taskerProfile}
                        customerProfile={customerProfile}
                        auditLogs={auditLogs || []}
                        stats={stats}
                    />
                </div>
            </div>
        </div>
    );
}
