import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Search, ShieldAlert, FileClock } from 'lucide-react';

export const revalidate = 0;

export default async function AdminAuditLogsPage({
    searchParams,
    params
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const resolvedSearchParams = await searchParams;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const query = resolvedSearchParams.q || '';
    const page = parseInt(resolvedSearchParams.page || '1', 10);
    const limit = 30; // 30 logs per page
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('admin_actions')
        .select(`
            *,
            admin:users!admin_actions_admin_id_fkey(first_name, last_name, email),
            target_user:users!admin_actions_target_user_id_fkey(first_name, last_name, email),
            target_task:tasks!admin_actions_target_task_id_fkey(title)
        `, { count: 'exact' });

    if (query) {
        dbQuery = dbQuery.ilike('action_type', `%${query}%`);
    }

    const { data: logs, count, error } = await dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const totalPages = count ? Math.ceil(count / limit) : 1;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
                    <p className="text-sm text-gray-500 mt-1">Immutable ledger of all administrative actions. Strictly view-only.</p>
                </div>

                <form className="flex items-center gap-2" method="GET">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Filter by ACTION_TYPE..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-green focus:border-brand-green w-full sm:w-64 bg-white"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                        Filter
                    </button>
                    {query && (
                        <Link href={`/${locale}/admin/audit-logs`} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">
                            Clear
                        </Link>
                    )}
                </form>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md shadow-sm mb-6 flex items-start gap-4">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-sm font-bold text-red-800">High-Security Zone</h3>
                    <p className="text-sm text-red-700 mt-1">
                        This ledger is cryptographically secured at the database layer (via RLS). Administrators do NOT have deletion or modification privileges for any entries in this table.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Administrator</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Entity</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details Payload</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs?.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{new Date(log.created_at).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-brand-green">
                                            {(log.admin as any)?.first_name} {(log.admin as any)?.last_name}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono mt-1">{(log.admin as any)?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-300">
                                            {log.action_type?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {/* Identify who or what they acted upon based on relations or details */}
                                        {log.target_user && (
                                            <div className="text-sm text-gray-900 border border-gray-100 bg-gray-50 p-2 rounded">
                                                <span className="text-xs text-gray-500 block mb-0.5">User Target:</span>
                                                {(log.target_user as any)?.first_name} {(log.target_user as any)?.last_name} <br />
                                                <span className="text-xs text-blue-600 font-mono">{(log.target_user as any)?.email}</span>
                                            </div>
                                        )}
                                        {log.target_task && (
                                            <div className="text-sm text-gray-900 border border-gray-100 bg-gray-50 p-2 rounded mt-2">
                                                <span className="text-xs text-gray-500 block mb-0.5">Task Target:</span>
                                                {(log.target_task as any)?.title}
                                            </div>
                                        )}
                                        {!log.target_user && !log.target_task && log.details?.entity_id && (
                                            <div className="text-xs font-mono text-gray-500">
                                                ID: {log.details.entity_id}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-mono text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto max-w-xs">
                                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!logs || logs.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <FileClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-900">No log entries found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Page <span className="font-medium text-gray-900">{page}</span> of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            {page > 1 && (
                                <Link
                                    href={`/${locale}/admin/audit-logs?q=${query}&page=${page - 1}`}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 bg-white"
                                >
                                    Previous
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/${locale}/admin/audit-logs?q=${query}&page=${page + 1}`}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 bg-white"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
