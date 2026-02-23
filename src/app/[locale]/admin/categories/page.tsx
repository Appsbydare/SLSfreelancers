import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Search, ListTree, Settings, ShieldAlert, Star } from 'lucide-react';
import CategoryActions from '@/app/[locale]/admin/categories/CategoryActions';

export const revalidate = 0;

export default async function AdminCategoriesPage({
    searchParams,
    params
}: {
    searchParams: Promise<{ q?: string }>;
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

    let dbQuery = supabase
        .from('categories')
        .select('*');

    if (query) {
        dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    const { data: categories, error } = await dbQuery.order('name', { ascending: true });

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Platform Taxonomy</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage global categories used to classify all gigs and tasks.</p>
                </div>

                <form className="flex items-center gap-2" method="GET">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Find category..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-green focus:border-brand-green w-full sm:w-64 bg-white"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                        Search
                    </button>
                    {query && (
                        <Link href={`/${locale}/admin/categories`} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">
                            Clear
                        </Link>
                    )}
                </form>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-md shadow-sm mb-6 flex items-start gap-4">
                <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-sm font-bold text-orange-800">Caution with Taxonomy Deletion</h3>
                    <p className="text-sm text-orange-700 mt-1">
                        Deleting an active category that is currently attached to user tasks or gigs can cause orphan records and break the discovery UI for customers. Ensure no active gigs are utilizing a category before removing it.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <ListTree className="w-4 h-4" /> Root Categories ({categories?.length || 0})
                    </span>
                    <button
                        className="px-3 py-1.5 bg-brand-green text-white rounded-md text-sm font-medium hover:bg-brand-green/90 transition-colors"
                        title="Adding categories currently requires database administration for SVGs"
                        disabled
                    >
                        + Add Category (DB Only)
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon & System ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name (EN)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categories?.map((cat) => (
                                <tr key={cat.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md text-gray-500"
                                                dangerouslySetInnerHTML={{ __html: cat.icon || '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>' }}
                                            />
                                            <span className="text-sm font-mono text-gray-500">{cat.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{cat.name}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1 w-48" title={cat.description}>{cat.description || 'No description provided'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {cat.popular ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                <Star className="w-3 h-3 fill-current" /> Popular Spotlight
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                Standard
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <CategoryActions categoryId={cat.id} isPopular={cat.popular} />
                                    </td>
                                </tr>
                            ))}
                            {(!categories || categories.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-900">No categories found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
