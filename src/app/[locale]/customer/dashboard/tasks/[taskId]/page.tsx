import { getTaskById, getTaskOffers } from '@/app/actions/tasks';
import { notFound } from 'next/navigation';
import { MapPin, Calendar, Clock, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import TaskOffersList from './TaskOffersList';
import DeleteTaskButton from './DeleteTaskButton';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function CustomerTaskPage({ params }: { params: Promise<{ taskId: string, locale: string }> }) {
    const { taskId, locale } = await params;

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

    // 1. Fetch Task
    const task = await getTaskById(taskId);
    if (!task) {
        notFound();
    }

    // 2. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // Layout handles redirect, but good for safety
        return null;
    }

    // 3. Ownership Check
    const isOwner = user.id === task.customer.user.id;
    if (!isOwner) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-md">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
                    <p className="text-gray-600">You are not the owner of this request.</p>
                </div>
            </div>
        );
    }

    // 4. Fetch Offers
    const offers = await getTaskOffers(taskId);

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <div className="max-w-5xl mx-auto">
                {/* Back Link */}
                <div className="mb-6">
                    <Link href={`/${locale}/customer/dashboard/requests`} className="text-brand-green hover:underline flex items-center gap-2">
                        ← Back to My Requests
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Task Details Card */}
                        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${task.status === 'open' ? 'bg-green-100 text-green-800' :
                                    task.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                        task.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                            'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-green/10 text-brand-green mr-2">
                                        {task.category}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Posted {new Date(task.created_at).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {task.location}
                                </div>
                            </div>

                            <div className="prose prose-green max-w-none text-gray-600 mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="whitespace-pre-line">{task.description}</p>
                            </div>
                        </div>

                        {/* Bids List */}
                        <TaskOffersList offers={offers} />
                    </div>

                    <div className="lg:col-span-1">
                        {/* Summary Card */}
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6 space-y-6">
                            <div className="border-b border-gray-100 pb-4">
                                <p className="text-sm text-gray-500 mb-1">Estimated Budget</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    LKR {task.budget?.toLocaleString() || 'Negotiable'}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Statistics</h4>
                                <dl className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <dt className="text-xs text-gray-500">Bids</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{offers.length}</dd>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <dt className="text-xs text-gray-500">Views</dt>
                                        <dd className="text-lg font-semibold text-gray-900">-</dd>
                                    </div>
                                </dl>
                            </div>

                            <Link
                                href={`/${locale}/customer/dashboard/tasks/${taskId}/edit`}
                                className="block w-full text-center bg-gray-100 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors"
                            >
                                Edit Request
                            </Link>
                            <DeleteTaskButton taskId={taskId} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
