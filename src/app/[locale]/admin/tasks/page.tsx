import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Search, Briefcase, FileText, XCircle, CheckCircle, Trash2 } from 'lucide-react';
import TaskActions from '@/app/[locale]/admin/tasks/TaskActions';

export const revalidate = 0;

export default async function AdminTasksPage({
    searchParams,
    params
}: {
    searchParams: Promise<{ q?: string; status?: string; page?: string }>;
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
    const statusFilter = resolvedSearchParams.status || 'all';
    const page = parseInt(resolvedSearchParams.page || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('tasks')
        .select(`
            *,
            customer:customers(user:users(first_name, last_name, email))
        `, { count: 'exact' });

    if (query) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (statusFilter !== 'all') {
        dbQuery = dbQuery.eq('status', statusFilter);
    }

    const { data: tasks, count, error } = await dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const totalPages = count ? Math.ceil(count / limit) : 1;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Custom Tasks & Bids</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor active job posts and intervene if necessary.</p>
                </div>

                <form className="flex flex-wrap items-center gap-2" method="GET">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Search tasks..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-green focus:border-brand-green w-full sm:w-64 bg-white"
                        />
                    </div>

                    <select
                        name="status"
                        defaultValue={statusFilter}
                        className="py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-md text-sm focus:ring-brand-green focus:border-brand-green"
                    >
                        <option value="all">All Statuses</option>
                        <option value="open">Open (Accepting Bids)</option>
                        <option value="assigned">Assigned (In Progress)</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                        Filter
                    </button>
                    {(query || statusFilter !== 'all') && (
                        <Link href={`/${locale}/admin/tasks`} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">
                            Clear
                        </Link>
                    )}
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tasks?.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-brand-green/10 rounded-lg flex items-center justify-center text-brand-green">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <div className="ml-4 max-w-xs">
                                                <div className="text-sm font-medium text-gray-900 truncate" title={t.title}>
                                                    <Link href={`/${locale}/tasks/${t.id}`} target="_blank" className="hover:underline">
                                                        {t.title}
                                                    </Link>
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">{t.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{(t.customer as any)?.user?.first_name} {(t.customer as any)?.user?.last_name}</div>
                                        <div className="text-xs text-gray-500">{(t.customer as any)?.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        LKR {t.budget?.toLocaleString()} <span className="text-xs text-gray-500">({t.budget_type})</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize
                                            ${t.status === 'open' ? 'bg-green-50 text-green-700 border-green-200' :
                                                t.status === 'assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    t.status === 'completed' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                                                        'bg-red-50 text-red-700 border-red-200'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(t.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <TaskActions taskId={t.id} currentStatus={t.status} />
                                    </td>
                                </tr>
                            ))}
                            {(!tasks || tasks.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-900">No tasks found</p>
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
                                    href={`/${locale}/admin/tasks?q=${query}&status=${statusFilter}&page=${page - 1}`}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 bg-white"
                                >
                                    Previous
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/${locale}/admin/tasks?q=${query}&status=${statusFilter}&page=${page + 1}`}
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
