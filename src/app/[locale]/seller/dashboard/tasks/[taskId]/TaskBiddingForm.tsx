'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { placeBid, updateOffer, deleteOffer } from '@/app/actions/tasks';
import { CheckCircle, AlertCircle, Trash2, Edit2, X } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Types
type BidData = {
    id?: string;
    proposed_price: number;
    estimated_hours: number;
    message: string;
    status: string;
    created_at: string;
    updated_at?: string;
};

type State = {
    message: string;
    errors?: any;
    success?: boolean;
    bid?: any;
} | null;

const initialState: State = {
    message: '',
    errors: {},
    success: false,
};

function SubmitButton({ label, loadingLabel }: { label: string, loadingLabel: string }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 transition-colors"
        >
            {pending ? loadingLabel : label}
        </button>
    );
}

function BidSuccessView({ bid, onEdit, onDelete }: { bid: BidData, onEdit: () => void, onDelete: () => void }) {
    const [isDeleting, startDeleteTransition] = useTransition();

    const handleDeleteClick = () => {
        if (confirm('Are you sure you want to retract your bid? This action cannot be undone.')) {
            startDeleteTransition(() => {
                onDelete();
            });
        }
    };

    return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 animate-fadeIn shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                        <h4 className="text-lg font-semibold text-green-900">Bid Placed Successfully</h4>
                        <p className="text-sm text-green-700">Your proposal has been sent to the customer.</p>
                    </div>
                </div>
                {(!bid.status || bid.status.toLowerCase() === 'pending') && (
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2 text-green-700 hover:bg-green-100 rounded-full transition-colors"
                            title="Edit Bid"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                            title="Retract Bid"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white/60 rounded-md p-4 space-y-3 text-sm border border-green-100/50">
                <div className="flex justify-between items-center border-b border-green-100 pb-2">
                    <span className="text-green-800 font-medium">Proposed Price</span>
                    <span className="font-bold text-green-900 text-base">
                        LKR {Number(bid.proposed_price).toLocaleString()}
                    </span>
                </div>

                <div className="flex justify-between items-center border-b border-green-100 pb-2">
                    <span className="text-green-800 font-medium">Delivery Time</span>
                    <span className="font-semibold text-green-900">
                        {bid.estimated_hours} Hours
                    </span>
                </div>

                <div className="flex justify-between items-center border-b border-green-100 pb-2">
                    <span className="text-green-800 font-medium">Date Placed</span>
                    <span className="text-green-900">
                        {new Date(bid.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>

                <div className="pt-1">
                    <span className="block text-green-800 font-medium text-xs mb-1 uppercase tracking-wide">Cover Letter</span>
                    <p className="text-green-900/80 text-sm italic bg-green-100/30 p-2 rounded border border-green-100/50 whitespace-pre-wrap">
                        {bid.message}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-green-600 font-medium">
                    Status: <span className="uppercase bg-green-200 text-green-800 px-2 py-0.5 rounded text-[10px] tracking-wider font-bold ml-1">{bid.status || 'PENDING'}</span>
                </p>
            </div>
        </div>
    );
}

function EditBidForm({ taskId, bid, onCancel, onSuccess }: { taskId: string, bid: BidData, onCancel: () => void, onSuccess: (bid: BidData) => void }) {
    const [state, formAction] = useFormState(updateOffer, initialState);

    useEffect(() => {
        if (state?.success && state.bid) {
            onSuccess(state.bid);
        }
    }, [state, onSuccess]);

    return (
        <form action={formAction} className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Edit Your Proposal</h3>
                <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {state?.message && !state?.success && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <p className="text-sm text-red-700">{state.message}</p>
                </div>
            )}

            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="offerId" value={bid.id} />

            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Offer (LKR)
                </label>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">LKR</span>
                    </div>
                    <input
                        type="number"
                        name="amount"
                        id="amount"
                        defaultValue={bid.proposed_price}
                        min="100"
                        required
                        className="focus:ring-brand-green focus:border-brand-green block w-full pl-12 sm:text-sm border-gray-300 rounded-md py-2"
                        placeholder="Enter amount"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Duration (Hours)
                </label>
                <input
                    type="number"
                    name="estimatedHours"
                    id="estimatedHours"
                    defaultValue={bid.estimated_hours}
                    min="1"
                    required
                    className="focus:ring-brand-green focus:border-brand-green block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
                    placeholder="e.g. 24"
                />
            </div>

            <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Letter
                </label>
                <textarea
                    name="message"
                    id="message"
                    rows={4}
                    defaultValue={bid.message}
                    required
                    className="focus:ring-brand-green focus:border-brand-green block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
                    placeholder="Describe why you are the best fit for this task..."
                ></textarea>
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                    Cancel
                </button>
                <div className="flex-1">
                    <SubmitButton label="Update Bid" loadingLabel="Updating..." />
                </div>
            </div>
        </form>
    );
}

function CreateBidForm({ taskId, onSuccess }: { taskId: string, onSuccess: (bid: BidData) => void }) {
    const [state, formAction] = useFormState(placeBid, initialState);

    useEffect(() => {
        if (state?.success && state.bid) {
            onSuccess(state.bid);
        }
    }, [state, onSuccess]);

    return (
        <form action={formAction} className="space-y-4">
            {state?.message && !state?.success && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <p className="text-sm text-red-700">{state.message}</p>
                </div>
            )}

            <input type="hidden" name="taskId" value={taskId} />

            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Offer (LKR)
                </label>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">LKR</span>
                    </div>
                    <input
                        type="number"
                        name="amount"
                        id="amount"
                        min="100"
                        required
                        className="focus:ring-brand-green focus:border-brand-green block w-full pl-12 sm:text-sm border-gray-300 rounded-md py-2"
                        placeholder="Enter amount"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Duration (Hours)
                </label>
                <input
                    type="number"
                    name="estimatedHours"
                    id="estimatedHours"
                    min="1"
                    required
                    className="focus:ring-brand-green focus:border-brand-green block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
                    placeholder="e.g. 24"
                />
            </div>

            <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Letter
                </label>
                <textarea
                    name="message"
                    id="message"
                    rows={4}
                    required
                    className="focus:ring-brand-green focus:border-brand-green block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
                    placeholder="Describe why you are the best fit for this task..."
                ></textarea>
            </div>

            <SubmitButton label="Place Bid" loadingLabel="Placing Bid..." />

            <p className="text-xs text-center text-gray-500 mt-3">
                By placing a bid, you agree to our Terms of Service.
            </p>
        </form>
    );
}

export default function TaskBiddingForm({ taskId, existingBid }: { taskId: string, existingBid: any }) {
    const [currentBid, setCurrentBid] = useState<BidData | null>(existingBid);
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Sync props if they change (optional, beneficial for real-time updates if revalidated)
        if (existingBid) setCurrentBid(existingBid);
    }, [existingBid]);

    const handleBidPlaced = (bid: BidData) => {
        setCurrentBid(bid);
        setIsEditing(false); // Can also keep as false, as viewed
    };

    const handleBidUpdated = (bid: BidData) => {
        setCurrentBid(prev => ({ ...prev, ...bid })); // Merge updates
        setIsEditing(false);
    };

    const handleBidDeleted = async () => {
        if (!currentBid?.id) return;
        const result = await deleteOffer(currentBid.id, taskId); // Server action
        if (result.success) {
            setCurrentBid(null);
            setIsEditing(false);
            router.refresh();
        } else {
            alert(result.message || 'Failed to delete bid');
        }
    };

    if (currentBid && isEditing) {
        return (
            <EditBidForm
                taskId={taskId}
                bid={currentBid}
                onCancel={() => setIsEditing(false)}
                onSuccess={handleBidUpdated}
            />
        );
    }

    if (currentBid) {
        return (
            <BidSuccessView
                bid={currentBid}
                onEdit={() => setIsEditing(true)}
                onDelete={handleBidDeleted}
            />
        );
    }

    return (
        <CreateBidForm taskId={taskId} onSuccess={handleBidPlaced} />
    );
}
