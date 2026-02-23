'use client';

import { useState, useTransition } from 'react';
import { suspendUser, activateUser } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { UserX, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserActions({ userId, status }: { userId: string, status: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSuspend = () => {
        const reason = prompt('Please enter a reason for suspending this user (recorded in audit logs):');
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error('Suspension reason is required for the audit log.');
            return;
        }

        startTransition(async () => {
            const result = await suspendUser(userId, reason);
            if (result.success) {
                toast.success('User account suspended');
                router.refresh();
            } else {
                toast.error(result.message || 'Failed to suspend user');
            }
        });
    };

    const handleActivate = () => {
        if (!confirm('Reactivate this account? They will regain full access.')) return;

        startTransition(async () => {
            const result = await activateUser(userId);
            if (result.success) {
                toast.success('User account reactivated');
                router.refresh();
            } else {
                toast.error(result.message || 'Failed to reactivate user');
            }
        });
    };

    if (status === 'suspended') {
        return (
            <button
                onClick={handleActivate}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 text-sm font-medium rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                title="Restore account access"
            >
                <CheckCircle className="w-4 h-4" />
                Reactivate Account
            </button>
        );
    }

    return (
        <button
            onClick={handleSuspend}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
            title="Block account access"
        >
            <UserX className="w-4 h-4" />
            Suspend Account
        </button>
    );
}
