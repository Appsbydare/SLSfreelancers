import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Search, UserX, Shield, CheckCircle, MoreVertical, ShieldAlert } from 'lucide-react';

export const revalidate = 0;

export default async function AdminUsersPage({
    searchParams,
    params
}: {
    searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const resolvedSearchParams = await searchParams;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );

    const query = resolvedSearchParams.q || '';
    const roleFilter = resolvedSearchParams.role || 'all';
    const statusFilter = resolvedSearchParams.status || 'all';
    const page = parseInt(resolvedSearchParams.page || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('users')
        .select('*', { count: 'exact' });

    if (query) {
        dbQuery = dbQuery.or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
    }

    if (roleFilter !== 'all') {
        dbQuery = dbQuery.eq('user_type', roleFilter);
    }

    if (statusFilter !== 'all') {
        if (statusFilter === 'verified') dbQuery = dbQuery.eq('is_verified', true);
        if (statusFilter === 'unverified') dbQuery = dbQuery.eq('is_verified', false);
        if (statusFilter === 'suspended') dbQuery = dbQuery.eq('status', 'suspended'); // Assuming status column is used for bans
        if (statusFilter === 'admin') dbQuery = dbQuery.eq('is_super_admin', true);
    }

    // Always sort newest first
    const { data: users, count, error } = await dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const totalPages = count ? Math.ceil(count / limit) : 1;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Directory</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all taskers, customers, and staff accounts.</p>
                </div>

                {/* Search & Filters */}
                <form className="flex flex-wrap items-center gap-2" method="GET">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Find name or email..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-green focus:border-brand-green w-full sm:w-64 bg-white"
                        />
                    </div>

                    <select
                        name="role"
                        defaultValue={roleFilter}
                        className="py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-md text-sm focus:ring-brand-green focus:border-brand-green"
                    >
                        <option value="all">All Roles</option>
                        <option value="customer">Customer</option>
                        <option value="tasker">Tasker</option>
                    </select>

                    <select
                        name="status"
                        defaultValue={statusFilter}
                        className="py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-md text-sm focus:ring-brand-green focus:border-brand-green"
                    >
                        <option value="all">Any Status</option>
                        <option value="verified">Verified Taskers</option>
                        <option value="unverified">Unverified Taskers</option>
                        <option value="suspended">Suspended Accounts</option>
                        <option value="admin">System Admins</option>
                    </select>

                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                        Filter
                    </button>
                    {(query || roleFilter !== 'all' || statusFilter !== 'all') && (
                        <Link href={`/${locale}/admin/users`} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">
                            Clear
                        </Link>
                    )}
                </form>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users?.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold shadow-inner">
                                                {u.first_name?.charAt(0) || u.email.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                                                    {u.first_name} {u.last_name}
                                                    {u.is_super_admin && <span title="Super Admin"><Shield className="w-3.5 h-3.5 text-purple-600" /></span>}
                                                </div>
                                                <div className="text-sm text-gray-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                                            ${u.user_type === 'tasker' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                            {u.user_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {u.status === 'suspended' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                <UserX className="w-3 h-3" /> Suspended
                                            </span>
                                        ) : u.is_verified ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                <CheckCircle className="w-3 h-3" /> Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                <ShieldAlert className="w-3 h-3" /> Unverified
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/${locale}/admin/users/${u.id}`}
                                            className="text-brand-green hover:text-brand-green/80 flex border items-center justify-center p-1.5 rounded-md mx-auto w-fit hover:bg-brand-green/10 transition-colors"
                                            title="View Details"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(!users || users.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <UserX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-900">No users found</p>
                                        <p className="mt-1">Try adjusting your search or filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
                        </div>
                        <div className="flex gap-2">
                            {page > 1 && (
                                <Link
                                    href={`/${locale}/admin/users?q=${query}&role=${roleFilter}&status=${statusFilter}&page=${page - 1}`}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 bg-white"
                                >
                                    Previous
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/${locale}/admin/users?q=${query}&role=${roleFilter}&status=${statusFilter}&page=${page + 1}`}
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
