'use client';

import { useState, useTransition } from 'react';
import { approveVerification, rejectVerification } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VerificationActions({ verificationId, userId }: { verificationId: string, userId: string }) {
    const [isPending, startTransition] = useTransition();
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const router = useRouter();

    const handleApprove = () => {
        startTransition(async () => {
            const result = await approveVerification(verificationId, userId);
            if (result.success) {
                toast.success(result.message || 'Document approved successfully');
                setShowApproveModal(false);
                router.refresh();
            } else {
                toast.error(result.message || 'Failed to approve document');
            }
        });
    };

    const handleReject = () => {
        if (!rejectReason.trim()) {
            toast.error('Rejection reason is required.');
            return;
        }

        startTransition(async () => {
            const result = await rejectVerification(verificationId, userId, rejectReason);
            if (result.success) {
                toast.success('Document rejected and tasker notified');
                setShowRejectModal(false);
                setRejectReason('');
                router.refresh();
            } else {
                toast.error(result.message || 'Failed to reject document');
            }
        });
    };

    return (
        <>
            <div className="flex gap-2 justify-end">
                <button
                    onClick={() => setShowApproveModal(true)}
                    disabled={isPending}
                    className="px-3 py-1 bg-brand-green text-white text-xs font-semibold rounded hover:bg-brand-green/90 disabled:opacity-50 transition-colors"
                >
                    Approve
                </button>
                <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isPending}
                    className="px-3 py-1 bg-white text-red-600 border border-red-200 text-xs font-semibold rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                    Reject
                </button>
            </div>

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4 mx-auto">
                                <CheckCircle className="w-6 h-6 text-brand-green" />
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Approve Document?</h3>
                            <p className="text-center text-gray-500 mb-6 whitespace-normal break-words text-sm">
                                Approving this document will mark it as verified. The seller will only be fully unlocked once all their mandatory documents are approved.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowApproveModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    disabled={isPending}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                                    disabled={isPending}
                                >
                                    {isPending ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Yes, Approve'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowRejectModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Reject Document</h3>
                            <p className="text-center text-gray-500 mb-4 text-sm whitespace-normal break-words">
                                Please provide a clear reason for rejecting this document. This will be shown directly to the seller so they can correct it.
                            </p>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason <span className="text-red-500">*</span></label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                                    placeholder="e.g., The image is too blurry to read the details..."
                                    disabled={isPending}
                                />
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    disabled={isPending}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                                    disabled={isPending || !rejectReason.trim()}
                                >
                                    {isPending ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Reject Document'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
