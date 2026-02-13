import { getTaskById, getTaskerBid, getTaskOffers } from '@/app/actions/tasks';
import { notFound } from 'next/navigation';
import { MapPin, Calendar, Clock, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import TaskBiddingForm from './TaskBiddingForm';
import TaskOffersList from './TaskOffersList';
import { supabaseServer } from '@/lib/supabase-server';

// Simple Submit Button Component removed (moved to BiddingForm.tsx)

export default async function TaskPage({ params }: { params: Promise<{ taskId: string, locale: string }> }) {
    const { taskId, locale } = await params;
    const task = await getTaskById(taskId);

    if (!task) {
        notFound();
    }

    const { data: { user } } = await supabaseServer.auth.getUser();
    const isOwner = user?.id === task.customer.user.id;
    const existingBid = await getTaskerBid(taskId);
    const offers = isOwner ? await getTaskOffers(taskId) : [];

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link */}
                <div className="mb-6">
                    <Link href={`/${locale}/seller/dashboard/requests`} className="text-brand-green hover:underline flex items-center gap-2">
                        ← Back to Requests
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Task Details Card */}
                        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{task.title}</h1>

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

                            {/* Customer Info (Limited) */}
                            {task.customer?.user && (
                                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                    <div className="mr-4">
                                        {task.customer.user.profile_image_url ? (
                                            <Image
                                                src={task.customer.user.profile_image_url}
                                                alt="Customer"
                                                width={48}
                                                height={48}
                                                className="rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                <User className="h-6 w-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Posted by {task.customer.user.first_name || 'Client'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Member since {new Date().getFullYear()} {/* Ideally fetch join date */}
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Show Offers List ONLY if Owner */}
                        {isOwner && (
                            <TaskOffersList offers={offers} />
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        {/* Bidding/Action Card */}
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                            <div className="mb-6 pb-6 border-b border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Estimated Budget</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    LKR {task.budget?.toLocaleString() || 'Negotiable'}
                                </p>
                            </div>

                            {isOwner ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        This is your task. You cannot place a bid on your own request.
                                    </p>
                                </div>
                            ) : (
                                <TaskBiddingForm taskId={task.id} existingBid={existingBid} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
