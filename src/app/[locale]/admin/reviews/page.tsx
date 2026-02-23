import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Search, Star, MessageSquare } from 'lucide-react';
import ReviewActions from '@/app/[locale]/admin/reviews/ReviewActions';

export const revalidate = 0;

export default async function AdminReviewsPage({
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
    const limit = 20;
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('reviews')
        .select(`
            id, rating, comment, created_at,
            reviewer:users!reviews_reviewer_id_fkey(first_name, last_name, email),
            reviewee:users!reviews_reviewee_id_fkey(first_name, last_name, email),
            task:tasks(title)
        `, { count: 'exact' });

    if (query) {
        dbQuery = dbQuery.ilike('comment', `%${query}%`);
    }

    const { data: reviews, count, error } = await dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const totalPages = count ? Math.ceil(count / limit) : 1;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor the global feed of user feedback and delete abusive instances.</p>
                </div>

                <form className="flex flex-wrap items-center gap-2" method="GET">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Search feedback content..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-green focus:border-brand-green w-full sm:w-64 bg-white"
                        />
                    </div>

                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                        Search
                    </button>
                    {query && (
                        <Link href={`/${locale}/admin/reviews`} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">From (Author)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">To (Subject)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Context & Feedback</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reviews?.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-medium">{(r.reviewer as any)?.first_name} {(r.reviewer as any)?.last_name}</div>
                                        <div className="text-xs text-gray-500">{(r.reviewer as any)?.email}</div>
                                        <div className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-medium">{(r.reviewee as any)?.first_name} {(r.reviewee as any)?.last_name}</div>
                                        <div className="text-xs text-gray-500">{(r.reviewee as any)?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 mb-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                            ))}
                                            <span className="text-xs text-gray-500 ml-2 font-medium">{(r.task as any)?.title || 'Service Delivery'}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-2 line-clamp-3 bg-gray-50 p-3 rounded-md border border-gray-100 italic">
                                            &ldquo;{r.comment}&rdquo;
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <ReviewActions reviewId={r.id} />
                                    </td>
                                </tr>
                            ))}
                            {(!reviews || reviews.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-900">No reviews found</p>
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
                                    href={`/${locale}/admin/reviews?q=${query}&page=${page - 1}`}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 bg-white"
                                >
                                    Previous
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/${locale}/admin/reviews?q=${query}&page=${page + 1}`}
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
