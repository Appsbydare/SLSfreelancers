import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Search, Package, Image as ImageIcon, Star, ShoppingCart } from 'lucide-react';
import GigActions from '@/app/[locale]/admin/gigs/GigActions';

export const revalidate = 0;

export default async function AdminGigsPage({
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
        .from('gigs')
        .select(`
            id, title, slug, category, status, rating, reviews_count, orders_count, images, created_at,
            seller:taskers(user:users(first_name, last_name, email))
        `, { count: 'exact' });

    if (query) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,category.ilike.%${query}%`);
    }

    if (statusFilter !== 'all') {
        dbQuery = dbQuery.eq('status', statusFilter);
    }

    const { data: gigs, count, error } = await dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const totalPages = count ? Math.ceil(count / limit) : 1;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gigs Directory</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage packaged services offered by taskers.</p>
                </div>

                <form className="flex flex-wrap items-center gap-2" method="GET">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Search gigs..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-green focus:border-brand-green w-full sm:w-64 bg-white"
                        />
                    </div>

                    <select
                        name="status"
                        defaultValue={statusFilter}
                        className="py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-md text-sm focus:ring-brand-green focus:border-brand-green"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="draft">Draft</option>
                    </select>

                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                        Filter
                    </button>
                    {(query || statusFilter !== 'all') && (
                        <Link href={`/${locale}/admin/gigs`} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gig Details</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {gigs?.map((g) => (
                                <tr key={g.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-12 w-16 bg-gray-100 rounded-md overflow-hidden relative border border-gray-200">
                                                {g.images && g.images.length > 0 ? (
                                                    <img src={g.images[0]} alt="Gig Thumbnail" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full w-full text-gray-400">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4 max-w-sm">
                                                <div className="text-sm font-medium text-gray-900 truncate" title={g.title}>
                                                    <Link href={`/${locale}/gigs/${g.slug}`} target="_blank" className="hover:underline">
                                                        {g.title}
                                                    </Link>
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">{g.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{(g.seller as any)?.user?.first_name} {(g.seller as any)?.user?.last_name}</div>
                                        <div className="text-xs text-gray-500">{(g.seller as any)?.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center text-sm text-gray-700">
                                                <Star className="w-4 h-4 text-yellow-400 mr-1 fill-current" />
                                                <span className="font-medium">{g.rating ? parseFloat(g.rating.toString()).toFixed(1) : 'New'}</span>
                                                <span className="text-gray-400 ml-1">({g.reviews_count || 0})</span>
                                            </div>
                                            <div className="flex items-center text-xs text-brand-green font-medium">
                                                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                                                {g.orders_count || 0} Orders
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 border rounded-full text-xs font-medium capitalize
                                            ${g.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                                g.status === 'paused' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                    'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                            {g.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <GigActions gigId={g.id} currentStatus={g.status} />
                                    </td>
                                </tr>
                            ))}
                            {(!gigs || gigs.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-900">No gigs found</p>
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
                                    href={`/${locale}/admin/gigs?q=${query}&status=${statusFilter}&page=${page - 1}`}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 bg-white"
                                >
                                    Previous
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/${locale}/admin/gigs?q=${query}&status=${statusFilter}&page=${page + 1}`}
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
