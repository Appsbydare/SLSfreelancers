'use client';

import { useTransition } from 'react';
import { deleteTaskAdmin } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TaskActions({ taskId, currentStatus }: { taskId: string; currentStatus: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        const reason = prompt('Admin Delete Task: Enter reason for audit log:');
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error('Deletion reason required for audit log.');
            return;
        }

        startTransition(async () => {
            const result = await deleteTaskAdmin(taskId, reason);
            if (result.success) {
                toast.success('Task permanently deleted');
                router.refresh();
            } else {
                toast.error(result.message || 'Failed to delete task');
            }
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
            title="Delete Custom Task"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
