import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, User, Shield, Briefcase, Mail, Phone, MapPin, Calendar, ActivitySquare } from 'lucide-react';
import UserActions from './UserActions';

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

    // Get specific profile details if tasker or customer
    let profileData = null;
    let table = user.user_type === 'tasker' ? 'taskers' : 'customers';

    // Attempt to fetch profile details 
    const { data: profile } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .single();

    if (profile) profileData = profile;

    // Fetch related audit logs
    const { data: auditLogs } = await supabase
        .from('admin_actions')
        .select('*, admin:users!admin_actions_admin_id_fkey(first_name, last_name)')
        .eq('entity_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

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
                                {profileData?.profile_image_url ? (
                                    <img src={profileData.profile_image_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user.first_name?.charAt(0) || user.email.charAt(0)
                                )}
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
                            <p className="text-sm text-gray-500 capitalize">{user.user_type}</p>

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

                {/* Right Column - Activity & Logs */}
                <div className="space-y-6 md:col-span-2">
                    {user.user_type === 'tasker' && profileData && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-gray-400" /> Professional Details
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Rating</p>
                                    <p className="text-xl font-bold text-gray-900">{profileData.rating?.toFixed(1) || '0.0'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Completed</p>
                                    <p className="text-xl font-bold text-gray-900">{profileData.completed_tasks || 0}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Response Rate</p>
                                    <p className="text-xl font-bold text-gray-900">{profileData.response_rate ? `${profileData.response_rate}%` : 'N/A'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Level Code</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{profileData.level_code || 'None'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 mb-2">Bio</p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    {profileData.bio || 'No biography provided.'}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <ActivitySquare className="w-5 h-5 text-gray-400" /> Moderation & Audit History
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {auditLogs && auditLogs.length > 0 ? (
                                auditLogs.map((log) => (
                                    <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                                        <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-gray-300"
                                            style={{ backgroundColor: log.action.includes('SUSPEND') ? '#ef4444' : log.action.includes('APPROVE') ? '#22c55e' : undefined }}
                                        />
                                        <div>
                                            <p className="text-sm text-gray-900 font-medium">{log.action.replace(/_/g, ' ')}</p>
                                            {log.details?.reason && (
                                                <p className="text-xs text-red-600 mt-1 mb-1 bg-red-50 p-1.5 rounded border border-red-100">
                                                    Reason: {log.details.reason}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                By: {(log.admin as any)?.first_name} {(log.admin as any)?.last_name} &bull; {new Date(log.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm italic">
                                    No administrative actions recorded for this user.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
