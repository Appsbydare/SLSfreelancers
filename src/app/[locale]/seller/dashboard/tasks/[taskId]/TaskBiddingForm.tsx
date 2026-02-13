'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { placeBid } from '@/app/actions/tasks';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 transition-colors"
        >
            {pending ? 'Placing Bid...' : 'Place Bid'}
        </button>
    );
}

// Define the state type explicitly to match server action return types
type State = {
    message: string;
    errors?: Record<string, string[]>;
    success?: boolean;
} | null;

const initialState: State = {
    message: '',
    errors: {},
    success: false,
};

export default function TaskBiddingForm({ taskId, existingBid }: { taskId: string, existingBid: any }) {
    const [state, formAction] = useFormState(placeBid, initialState);

    // If we have an existing bid passed in (SSR), or if successful submission (CSR)
    const isBidPlaced = existingBid || state?.success;
    const bidData = existingBid || (state?.success ? { proposed_price: '...', status: 'pending' } : null);

    if (isBidPlaced) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fadeIn">
                <div className="flex items-center mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="font-medium text-green-900">Bid Placed</h4>
                </div>
                <p className="text-sm text-green-800 mb-2">
                    Your proposal has been sent successfully.
                </p>
                <p className="text-xs text-green-700">
                    Status: <span className="uppercase font-semibold">{bidData?.status || 'PENDING'}</span>
                </p>
            </div>
        );
    }

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

            <SubmitButton />

            <p className="text-xs text-center text-gray-500 mt-3">
                By placing a bid, you agree to our Terms of Service.
            </p>
        </form>
    );
}
