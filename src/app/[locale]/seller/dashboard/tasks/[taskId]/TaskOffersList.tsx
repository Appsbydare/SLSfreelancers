'use client';

import { User, Clock, MapPin, CheckCircle, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { acceptOffer } from '@/app/actions/tasks';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';

interface Offer {
    id: string;
    amount: number;
    estimated_hours: number;
    message: string;
    status: string;
    created_at: string;
    tasker: {
        id: string;
        user_id: string;
        user: {
            first_name: string | null;
            last_name: string | null;
            profile_image_url: string | null;
        } | null;
    } | null;
}

export default function TaskOffersList({ offers, taskId }: { offers: any[], taskId: string }) {
    const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
    const router = useRouter();
    const locale = useLocale();

    const handleAccept = async (offerId: string) => {
        if (!confirm('Are you sure you want to accept this bid? This will assign the task to this seller.')) {
            return;
        }

        setAcceptingOfferId(offerId);
        try {
            const result = await acceptOffer(taskId, offerId);
            if (result.success) {
                // Success feedback
                alert('Offer accepted successfully! You can now communicate with the seller.');
                router.refresh(); // Refresh to update UI (hide other bids or show assigned status)
            } else {
                alert(result.message || 'Failed to accept offer');
            }
        } catch (error) {
            console.error('Error accepting offer:', error);
            alert('An unexpected error occurred');
        } finally {
            setAcceptingOfferId(null);
        }
    };

    const handleMessage = (taskerId: string) => {
        // Redirect to messages with this tasker
        // Assuming we have a way to start a chat via URL or just go to messages
        router.push(`/${locale}/seller/dashboard/messages?recipient=${taskerId}`);
    };

    if (!offers || offers.length === 0) {
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
            <h3 className="text-lg font-semibold text-gray-900">Received Bids ({offers.length})</h3>
            <div className="space-y-4">
                {offers.map((offer: Offer) => (
                    <div key={offer.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-brand-green/30 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <Link href={`/${locale}/seller/profile/${offer.tasker?.id}`} className="flex items-center group">
                                <div className="mr-4">
                                    {offer.tasker?.user?.profile_image_url ? (
                                        <Image
                                            src={offer.tasker.user.profile_image_url}
                                            alt={offer.tasker.user.first_name || 'Tasker'}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover border border-gray-200 group-hover:border-brand-green transition-colors"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border border-gray-200 group-hover:border-brand-green transition-colors">
                                            <User className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 group-hover:text-brand-green transition-colors">
                                        {offer.tasker?.user?.first_name
                                            ? `${offer.tasker.user.first_name} ${offer.tasker.user.last_name?.[0] || ''}.`
                                            : 'Tasker'
                                        }
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        Bid placed on {new Date(offer.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </Link>
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-gray-900">
                                    LKR {offer.amount.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {offer.estimated_hours} Hours
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-md p-4 mb-4">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{offer.message}</p>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <Link
                                href={`/${locale}/seller/profile/${offer.tasker?.id}`}
                                className="flex items-center px-4 py-2 border border-brand-green/30 text-brand-green rounded-md text-sm font-medium hover:bg-brand-green/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors"
                            >
                                <User className="h-4 w-4 mr-2" />
                                View Profile
                            </Link>

                            <button
                                onClick={() => offer.tasker?.user_id && handleMessage(offer.tasker.user_id)}
                                disabled={!offer.tasker?.user_id}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Message
                            </button>

                            {offer.status === 'accepted' ? (
                                <span className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Accepted
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleAccept(offer.id)}
                                    disabled={acceptingOfferId === offer.id || offer.status !== 'pending'}
                                    className="px-4 py-2 bg-brand-green text-white rounded-md text-sm font-medium hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 transition-colors"
                                >
                                    {acceptingOfferId === offer.id ? 'Accepting...' : 'Accept Bid'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
