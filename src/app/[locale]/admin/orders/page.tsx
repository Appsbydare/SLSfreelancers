import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Search, ShoppingBag, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import OrderActions from '@/app/[locale]/admin/orders/OrderActions';

export const revalidate = 0;

export default async function AdminOrdersPage({
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
        .from('orders')
        .select(`
            *,
            customer:customers(user:users(first_name, last_name, email)),
            seller:taskers(user:users(first_name, last_name, email)),
            gig:gigs(title, slug)
        `, { count: 'exact' });

    if (query) {
        dbQuery = dbQuery.or(`order_number.ilike.%${query}%`);
    }

    if (statusFilter !== 'all') {
        dbQuery = dbQuery.eq('status', statusFilter);
    }

    const { data: orders, count, error } = await dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const totalPages = count ? Math.ceil(count / limit) : 1;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Active Orders</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor all gig purchases and mediate progress.</p>
                </div>

                <form className="flex flex-wrap items-center gap-2" method="GET">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Search Order Number..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-green focus:border-brand-green w-full sm:w-64 bg-white"
                        />
                    </div>

                    <select
                        name="status"
                        defaultValue={statusFilter}
                        className="py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-md text-sm focus:ring-brand-green focus:border-brand-green"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="delivered">Delivered</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                        Filter
                    </button>
                    {(query || statusFilter !== 'all') && (
                        <Link href={`/${locale}/admin/orders`} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gig Details</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Involved Parties</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders?.map((o) => (
                                <tr key={o.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 font-mono">{o.order_number}</div>
                                        <div className="text-xs text-gray-500 mt-1">{new Date(o.created_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={(o.gig as any)?.title}>
                                            {(o.gig as any)?.title || 'Gig Removed'}
                                        </div>
                                        <div className="text-xs text-brand-green font-medium capitalize mt-1">Tier: {o.package_tier}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900"><span className="text-xs text-gray-500">Buyer:</span> {(o.customer as any)?.user?.first_name} {(o.customer as any)?.user?.last_name}</div>
                                        <div className="text-sm text-gray-900"><span className="text-xs text-gray-500">Seller:</span> {(o.seller as any)?.user?.first_name} {(o.seller as any)?.user?.last_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">LKR {o.total_amount?.toLocaleString()}</div>
                                        <div className="text-xs text-gray-500 mt-1">Fee: LKR {o.platform_fee?.toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 border rounded-full text-xs font-medium capitalize
                                            ${['completed', 'delivered'].includes(o.status) ? 'bg-green-50 text-green-700 border-green-200' :
                                                o.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                            {o.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <OrderActions orderId={o.id} currentStatus={o.status} />
                                    </td>
                                </tr>
                            ))}
                            {(!orders || orders.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-900">No orders found</p>
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
                                    href={`/${locale}/admin/orders?q=${query}&status=${statusFilter}&page=${page - 1}`}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 bg-white"
                                >
                                    Previous
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/${locale}/admin/orders?q=${query}&status=${statusFilter}&page=${page + 1}`}
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
