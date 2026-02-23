import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Users, Briefcase, Activity, AlertCircle, ShieldCheck } from 'lucide-react';

export const revalidate = 0; // Don't cache admin page

export default async function AdminDashboardPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for global aggregation
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );

    // 1. Fetch total users
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    // 2. Fetch pending verifications
    const { count: pendingVerifications } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');

    // 3. Fetch active tasks
    const { count: activeTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

    // 4. Recent audit logs snippet
    const { data: recentLogs } = await supabase
        .from('admin_actions')
        .select('*, admin:users!admin_actions_admin_id_fkey(first_name, last_name, email)')
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
                <p className="text-sm text-gray-500 mt-1">Global overview of the Sri Lanka Services platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="p-3 rounded-full bg-blue-50">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Users</p>
                        <h3 className="text-2xl font-bold text-gray-900">{totalUsers || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="p-3 rounded-full bg-orange-50">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Pending Actions</p>
                        <h3 className="text-2xl font-bold text-gray-900">{pendingVerifications || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="p-3 rounded-full bg-green-50">
                        <Briefcase className="w-6 h-6 text-brand-green" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Active Tasks</p>
                        <h3 className="text-2xl font-bold text-gray-900">{activeTasks || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="p-3 rounded-full bg-purple-50">
                        <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">System Status</p>
                        <h3 className="text-2xl font-bold text-gray-900">Online</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="font-semibold text-gray-800">Recent Audit Logs</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentLogs && recentLogs.length > 0 ? (
                            recentLogs.map((log) => (
                                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-900">
                                            <span className="font-medium">{(log.admin as any)?.first_name || 'System Admin'}</span> {log.action_type?.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-tight">Entity: {log.details?.entity_type || 'System'}</p>
                                        <p className="text-xs text-brand-green/80 mt-1 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-gray-500 text-sm italic">
                                No recent admin actions recorded.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="font-semibold text-gray-800">Action Required</h2>
                    </div>
                    <div className="p-6 flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="w-8 h-8 text-orange-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Seller Verifications</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-sm">
                            {pendingVerifications || 0} taskers are awaiting document verification before they can place bids.
                        </p>
                        <a href="/en/admin/verifications" className="mt-6 px-4 py-2 bg-brand-green text-white rounded-md text-sm font-medium hover:bg-brand-green/90 transition-colors">
                            Review Queue
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
