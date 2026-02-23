'use client';

import { useTransition } from 'react';
import { toggleCategoryPopularAdmin } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CategoryActions({ categoryId, isPopular }: { categoryId: string; isPopular: boolean }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleCategoryPopularAdmin(categoryId, !isPopular);
            if (result.success) {
                toast.success('Category ranking updated');
                router.refresh();
            } else {
                toast.error(result.message || 'Failed to update category');
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isPopular ? 'text-yellow-600 hover:bg-yellow-50' : 'text-gray-400 hover:bg-gray-100'}`}
            title={isPopular ? "Remove from Popular" : "Feature as Popular"}
        >
            <Star className={`w-4 h-4 ${isPopular ? 'fill-current' : ''}`} />
        </button>
    );
}
