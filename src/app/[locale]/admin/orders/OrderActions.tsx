'use client';

import { useTransition } from 'react';
import { cancelOrderAdmin } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleCancel = () => {
        if (currentStatus === 'completed' || currentStatus === 'cancelled') {
            toast.error('Cannot cancel a completed or already cancelled order.');
            return;
        }

        const reason = prompt('Admin Cancel Order: Enter reason to notify customer/seller & save to audit log:');
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error('Cancellation reason required.');
            return;
        }

        startTransition(async () => {
            const result = await cancelOrderAdmin(orderId, reason);
            if (result.success) {
                toast.success('Order cancelled successfully');
                router.refresh();
            } else {
                toast.error(result.message || 'Failed to cancel order');
            }
        });
    };

    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
        return null;
    }

    return (
        <button
            onClick={handleCancel}
            disabled={isPending}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
            title="Force Cancel Order"
        >
            <XCircle className="w-4 h-4" />
        </button>
    );
}
