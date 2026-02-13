import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MapPin, Clock, Calendar, ChevronRight, FileText } from 'lucide-react';

export default async function CustomerRequestsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    // Create authenticated Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null; // Should be handled by layout
    }

    // Fetch tasks created by this user (customer)
    // We need to join with customers table to filter by customer_id (which is linked to user.id)
    // Actually, tasks table has customer_id. We first need the customer_id for this user.

    // 1. Get user record from users table
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!userData) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Profile Found</h3>
                <p className="mt-1 text-sm text-gray-500">Please complete your profile to post requests.</p>
            </div>
        );
    }

    // 2. Get customer ID
    const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userData.id)
        .single();

    if (!customer) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Customer Profile Found</h3>
                <p className="mt-1 text-sm text-gray-500">Please complete your customer profile to post requests.</p>
            </div>
        );
    }

    // 3. Fetch tasks
    const { data: requests, error } = await supabase
        .from('tasks')
        .select(`
            *,
            offers!offers_task_id_fkey(count)
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching customer requests:', error);
    }

    const t = await getTranslations('tasks');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
                <Link
                    href={`/${locale}/post-task`}
                    className="bg-brand-green text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-green/90 transition-colors"
                >
                    Post New Request
                </Link>
            </div>

            {!requests || requests.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No requests yet</h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto mb-6">
                        You haven't posted any custom requests yet. Start by defining what you need help with.
                    </p>
                    <Link
                        href={`/${locale}/post-task`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green"
                    >
                        Post a Request
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {requests.map((request: any) => (
                        <Link
                            key={request.id}
                            href={`/${locale}/customer/dashboard/tasks/${request.id}`}
                            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 hover:border-brand-green/30 group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-green transition-colors">
                                            {request.title}
                                        </h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${request.status === 'open' ? 'bg-green-100 text-green-800' :
                                            request.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                                request.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 line-clamp-2 mb-4 text-sm">
                                        {request.description}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center">
                                            <MapPin className="h-3.5 w-3.5 mr-1" />
                                            {request.location}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-3.5 w-3.5 mr-1" />
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center font-medium text-brand-green bg-brand-green/5 px-2 py-1 rounded">
                                            LKR {request.budget?.toLocaleString() || 'Negotiable'}
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 min-w-[120px]">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900">{request.offers?.[0]?.count || 0}</p>
                                        <p className="text-xs text-gray-500">Bids Received</p>
                                    </div>
                                    <span className="text-sm font-medium text-brand-green flex items-center md:hidden">
                                        View Details <ChevronRight className="h-4 w-4 ml-1" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
