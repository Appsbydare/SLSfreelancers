'use client';

import { useState, useTransition } from 'react';
import { approveVerification, rejectVerification } from '@/app/actions/admin';
import toast from 'react-hot-toast';

export default function VerificationActions({ verificationId, userId }: { verificationId: string, userId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleApprove = () => {
        if (!confirm('Approve this verification? This tasker will be fully unlocked.')) return;

        startTransition(async () => {
            const result = await approveVerification(verificationId, userId);
            if (result.success) {
                toast.success('Tasker approved successfully');
            } else {
                toast.error(result.message || 'Failed to approve tasker');
            }
        });
    };

    const handleReject = () => {
        const reason = prompt('Please enter a reason for rejecting this document (sent to tasker):');
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error('Rejection reason is required.');
            return;
        }

        startTransition(async () => {
            const result = await rejectVerification(verificationId, userId, reason);
            if (result.success) {
                toast.success('Document rejected and tasker notified');
            } else {
                toast.error(result.message || 'Failed to reject document');
            }
        });
    };

    return (
        <div className="flex gap-2 justify-end">
            <button
                onClick={handleApprove}
                disabled={isPending}
                className="px-3 py-1 bg-brand-green text-white text-xs font-semibold rounded hover:bg-brand-green/90 disabled:opacity-50 transition-colors"
            >
                Approve
            </button>
            <button
                onClick={handleReject}
                disabled={isPending}
                className="px-3 py-1 bg-white text-red-600 border border-red-200 text-xs font-semibold rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
                Reject
            </button>
        </div>
    );
}
