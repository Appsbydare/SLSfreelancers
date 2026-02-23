'use client';

import { useTransition } from 'react';
import { refundEscrowAdmin } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FinanceActions({ transactionId, currentStatus }: { transactionId: string; currentStatus: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleRefund = () => {
        if (currentStatus !== 'held_in_escrow') {
            toast.error('Only funds held in escrow can be refunded.');
            return;
        }

        const reason = prompt('Admin Refund Escrow: Enter reason to refund to buyer (Audit Log):');
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error('Refund reason required.');
            return;
        }

        startTransition(async () => {
            const result = await refundEscrowAdmin(transactionId, reason);
            if (result.success) {
                toast.success('Escrow refunded successfully');
                router.refresh();
            } else {
                toast.error(result.message || 'Failed to refund escrow');
            }
        });
    };

    if (currentStatus !== 'held_in_escrow') {
        // Can't refund already released or refunded
        return null;
    }

    return (
        <button
            onClick={handleRefund}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-medium rounded-md hover:bg-orange-100 disabled:opacity-50 transition-colors ml-auto"
            title="Force Refund to Buyer"
        >
            <Undo2 className="w-3.5 h-3.5" />
            Refund Escrow
        </button>
    );
}
