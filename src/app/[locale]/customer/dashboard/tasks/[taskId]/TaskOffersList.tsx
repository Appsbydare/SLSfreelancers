'use client';

import { User, Clock, MapPin, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Offer {
    id: string;
    task_id: string;
    proposed_price: number;
    estimated_hours: number;
    message: string;
    status: string;
    created_at: string;
    tasker: {
        user_id?: string;
        user: {
            id: string;
            first_name: string | null;
            last_name: string | null;
            profile_image_url: string | null;
        } | null;
    } | null;
}

export default function TaskOffersList({ offers }: { offers: any[] }) {
    const visibleOffers = offers.filter(offer => offer.status !== 'rejected');

    if (!visibleOffers || visibleOffers.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <User className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No Bids Yet</h3>
                <p className="mt-1 text-sm text-gray-500">Wait for taskers to place their bids on your request.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Received Bids ({visibleOffers.length})</h3>
            <div className="space-y-4">
                {visibleOffers.map((offer: Offer) => (
                    <div key={offer.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-brand-green/30 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                                <div className="mr-4">
                                    {offer.tasker?.user?.profile_image_url ? (
                                        <Image
                                            src={offer.tasker.user.profile_image_url}
                                            alt={offer.tasker.user.first_name || 'Tasker'}
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
                                    <h4 className="text-md font-medium text-gray-900">
                                        {offer.tasker?.user?.first_name} {offer.tasker?.user?.last_name?.[0]}.
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        Bid placed on {new Date(offer.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-gray-900">
                                    LKR {offer.proposed_price.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {offer.estimated_hours} Hours
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-md p-4 mb-4">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{offer.message}</p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Link
                                href={
                                    offer.tasker?.user?.id || offer.tasker?.user_id
                                        ? `/customer/dashboard/messages?taskId=${offer.task_id}&recipientId=${offer.tasker?.user?.id || offer.tasker?.user_id}`
                                        : '#'
                                }
                                className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green flex items-center justify-center ${offer.tasker?.user?.id || offer.tasker?.user_id
                                    ? 'text-gray-700 hover:bg-gray-50'
                                    : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                                    }`}
                                onClick={(e) => {
                                    if (!offer.tasker?.user?.id && !offer.tasker?.user_id) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                Message
                            </Link>

                            {offer.status === 'accepted' ? (
                                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md text-sm font-medium flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Accepted
                                </div>
                            ) : offer.status === 'pending' ? (
                                <AcceptBidButton
                                    taskId={offer.task_id}
                                    offerId={offer.id}
                                    taskerId={offer.tasker?.user?.id || offer.tasker?.user_id}
                                />
                            ) : (
                                <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md text-sm font-medium flex items-center">
                                    Rejected
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

import { acceptOffer } from '@/app/actions/tasks';
import { toast } from '@/lib/toast';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';


function AcceptBidButton({ taskId, offerId, taskerId }: { taskId: string, offerId: string, taskerId: string | undefined }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleAccept = () => {
        if (!taskerId) {
            toast.error('Cannot message this tasker');
            return;
        }

        if (!confirm('Are you sure you want to accept this bid? This will assign the task to the tasker.')) {
            return;
        }

        startTransition(async () => {
            try {
                const result = await acceptOffer(taskId, offerId);
                if (result.success) {
                    toast.success(result.message);
                    // Redirect to messages with the tasker
                    router.push(`/customer/dashboard/messages?taskId=${taskId}&recipientId=${taskerId}&action=accepted`);
                } else {
                    toast.error(result.message);
                }
            } catch (error) {
                console.error('Error accepting bid:', error);
                toast.error('An error occurred');
            }
        });
    };

    return (
        <button
            onClick={handleAccept}
            disabled={isPending || !taskerId}
            className="px-4 py-2 bg-brand-green text-white rounded-md text-sm font-medium hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPending ? 'Accepting...' : 'Accept Bid'}
        </button>
    );
}
