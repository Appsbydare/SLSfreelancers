'use client';

import { useTransition } from 'react';
import { deleteReviewAdmin } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReviewActions({ reviewId }: { reviewId: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        const reason = prompt('Admin Delete Review: Enter reason for audit log:');
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error('Deletion reason required.');
            return;
        }

        if (!confirm('Permanently delete this review from the platform? This cannot be undone.')) return;

        startTransition(async () => {
            const result = await deleteReviewAdmin(reviewId, reason);
            if (result.success) {
                toast.success('Review permanently deleted');
                router.refresh();
            } else {
                toast.error(result.message || 'Failed to delete review');
            }
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
            title="Delete Abusive Review"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
