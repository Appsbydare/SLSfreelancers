import { getTaskById, getTaskerBid } from '@/app/actions/tasks';
import { notFound } from 'next/navigation';
import { MapPin, Calendar, Clock, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import BiddingForm from './BiddingForm';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Simple Submit Button Component removed (moved to BiddingForm.tsx)

export default async function TaskPage({ params }: { params: Promise<{ taskId: string, locale: string }> }) {
    const { taskId, locale } = await params;
    const task = await getTaskById(taskId);

    if (!task) {
        notFound();
    }

    const existingBid = await getTaskerBid(taskId);

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookies) => {
                    // Optional for read-only
                },
            },
        }
    );
    const { data: { user } } = await supabase.auth.getUser();
    const isOwner = user?.id === task.customer.user.auth_user_id;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link href={`/${locale}/seller/dashboard/requests`} className="text-brand-green hover:underline flex items-center">
                        &larr; Back to Requests
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content - Task Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-4">
                                        {task.category}
                                    </span>
                                    <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
                                </div>
                                {task.status === 'open' && (
                                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                        OPEN
                                    </span>
                                )}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                                    {task.location} {task.district ? `, ${task.district}` : ''}
                                </div>
                                {task.deadline && (
                                    <div className="flex items-center">
                                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                                        Deadline: {new Date(task.deadline).toLocaleDateString()}
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                                    Posted {new Date(task.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="mt-8 border-t border-gray-100 pt-8">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                                <div className="prose prose-green max-w-none text-gray-600 whitespace-pre-wrap">
                                    {task.description}
                                </div>
                            </div>

                            {/* Attachments if any - Placeholder for now as direct attachment handling might differ */}
                            {task.attachments && task.attachments.length > 0 && (
                                <div className="mt-8 border-t border-gray-100 pt-8">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
                                    <ul className="list-disc pl-5 text-gray-600">
                                        {task.attachments.map((att: string, index: number) => (
                                            <li key={index}>
                                                <a href={att} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">
                                                    Attachment {index + 1}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">About the Customer</h3>
                            <div className="flex items-center">
                                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {task.customer?.user?.profile_image_url ? (
                                        <Image
                                            src={task.customer.user.profile_image_url}
                                            alt="Customer"
                                            width={48}
                                            height={48}
                                            className="object-cover h-full w-full"
                                        />
                                    ) : (
                                        <User className="h-6 w-6 text-gray-400" />
                                    )}
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">
                                        {task.customer?.user?.first_name} {task.customer?.user?.last_name?.[0]}.
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Member since {new Date().getFullYear()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Bidding / Stats */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                            <div className="mb-6 pb-6 border-b border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Estimated Budget</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    LKR {task.budget?.toLocaleString() || 'Negotiable'}
                                </p>
                            </div>

                            {isOwner ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800 font-medium mb-2">
                                        This is your task.
                                    </p>
                                    <p className="text-xs text-blue-600 mb-3">
                                        You cannot place a bid on your own request.
                                    </p>
                                    <Link
                                        href={`/${locale}/customer/dashboard/tasks/${task.id}`}
                                        className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Manage Task
                                    </Link>
                                </div>
                            ) : (
                                <BiddingForm taskId={task.id} existingBid={existingBid} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
