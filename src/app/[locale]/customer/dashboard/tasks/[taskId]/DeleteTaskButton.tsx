'use client';

import { useState, useTransition } from 'react';
import { deleteTask } from '@/app/actions/tasks';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

export default function DeleteTaskButton({ taskId }: { taskId: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        if (!confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
            return;
        }

        startTransition(async () => {
            const result = await deleteTask(taskId);
            if (result.success) {
                toast.success(result.message);
                router.push('/customer/dashboard/requests');
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="w-full border border-red-200 text-red-600 py-2 rounded-md font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPending ? 'Deleting...' : 'Delete Request'}
        </button>
    );
}
