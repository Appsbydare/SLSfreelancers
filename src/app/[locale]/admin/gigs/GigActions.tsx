'use client';

import { useTransition } from 'react';
import { deleteGigAdmin } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GigActions({ gigId, currentStatus }: { gigId: string; currentStatus: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        const reason = prompt('Admin Delete Gig: Enter reason for audit log:');
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error('Deletion reason required for audit log.');
            return;
        }

        startTransition(async () => {
            const result = await deleteGigAdmin(gigId, reason);
            if (result.success) {
                toast.success('Gig permanently deleted');
                router.refresh();
            } else {
                toast.error(result.message || 'Failed to delete gig');
            }
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
            title="Delete Gig Package"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
