'use client';

import { useTransition } from 'react';
import { toggleCategoryPopularAdmin } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { Star, ShieldAlert, ShieldOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CategoryActions({
    categoryId,
    isPopular,
    isHighRisk,
}: {
    categoryId: string;
    isPopular: boolean;
    isHighRisk: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleTogglePopular = () => {
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

    const handleToggleHighRisk = () => {
        startTransition(async () => {
            const { error } = await supabase
                .from('categories')
                .update({ is_high_risk: !isHighRisk })
                .eq('id', categoryId);

            if (error) {
                toast.error('Failed to update high-risk status');
            } else {
                toast.success(isHighRisk ? 'Removed high-risk flag' : 'Marked as high-risk');
                router.refresh();
            }
        });
    };

    return (
        <div className="flex items-center gap-1 justify-end">
            {/* High Risk Toggle */}
            <button
                onClick={handleToggleHighRisk}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 border ${isHighRisk
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                title={isHighRisk ? 'Remove high-risk flag' : 'Mark as high-risk'}
            >
                {isHighRisk ? (
                    <>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        High Risk
                    </>
                ) : (
                    <>
                        <ShieldOff className="w-3.5 h-3.5" />
                        Standard
                    </>
                )}
            </button>

            {/* Popular Toggle */}
            <button
                onClick={handleTogglePopular}
                disabled={isPending}
                className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isPopular ? 'text-yellow-600 hover:bg-yellow-50' : 'text-gray-400 hover:bg-gray-100'}`}
                title={isPopular ? 'Remove from Popular' : 'Feature as Popular'}
            >
                <Star className={`w-4 h-4 ${isPopular ? 'fill-current' : ''}`} />
            </button>
        </div>
    );
}
