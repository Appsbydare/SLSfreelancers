'use client';

import { useFormState } from 'react-dom';
import { placeBid } from '@/app/actions/tasks';
import { CheckCircle, AlertCircle, Upload, X, File, Paperclip } from 'lucide-react';
import { useState, useTransition } from 'react';
import { uploadFile } from '@/lib/supabase-storage';

// Define the state type explicitly to match server action return types
type State = {
    message: string;
    errors?: Record<string, string[]>;
    success?: boolean;
    bid?: any;
} | null;

const initialState: State = {
    message: '',
    errors: {},
    success: false,
};

export default function BiddingForm({ taskId, existingBid }: { taskId: string, existingBid: any }) {
    const [state, formAction] = useFormState(placeBid, initialState);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [localPending, startTransition] = useTransition();

    // If we have an existing bid passed in (SSR), or if successful submission (CSR)
    const isBidPlaced = existingBid || state?.success;
    const bidData = existingBid || (state?.success ? { proposed_price: '...', status: 'pending', file_url: state.bid?.file_url } : null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploadError('');
        const formData = new FormData(e.currentTarget);

        if (file) {
            setIsUploading(true);
            const result = await uploadFile(file, 'proposals', `bids/${taskId}`);
            setIsUploading(false);

            if (result.success && result.url) {
                formData.set('fileUrl', result.url);
            } else {
                setUploadError(result.error || 'Failed to upload file');
                return;
            }
        }

        startTransition(() => {
            formAction(formData);
        });
    };

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
                {bidData?.file_url && (
                    <div className="mb-3">
                        <a
                            href={bidData.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-brand-green bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-md transition-colors"
                        >
                            <Paperclip className="h-3.5 w-3.5 mr-1" />
                            View Attachment
                        </a>
                    </div>
                )}
                <p className="text-xs text-green-700">
                    Status: <span className="uppercase font-semibold">{bidData?.status || 'PENDING'}</span>
                </p>
            </div>
        );
    }

    const isPending = localPending || isUploading;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {state?.message && !state?.success && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <p className="text-sm text-red-700">{state.message}</p>
                </div>
            )}

            {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <p className="text-sm text-red-700">{uploadError}</p>
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

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachment (Optional)
                </label>
                {!file ? (
                    <div className="border border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.txt,.png,.jpg,.jpeg"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="h-6 w-6 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Click or drag file to upload (.pdf, .txt, .png, .jpeg)</p>
                    </div>
                ) : (
                    <div className="flex items-center justify-between border border-gray-200 bg-gray-50 rounded-md p-3">
                        <div className="flex items-center truncate max-w-[85%]">
                            <File className="h-5 w-5 text-brand-green mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFile(null)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 transition-colors"
            >
                {isUploading ? 'Uploading file...' : localPending ? 'Placing Bid...' : 'Place Bid'}
            </button>

            <p className="text-xs text-center text-gray-500 mt-3">
                By placing a bid, you agree to our Terms of Service.
            </p>
        </form>
    );
}
