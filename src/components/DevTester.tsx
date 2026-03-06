'use client';

import { useState } from 'react';
import { updateTrustScore, simulateCompletedOrder, maxOutRating, refreshLevel, setOnTimeDeliveryRate, forceLevel } from '@/app/actions/dev-test';
import { Shield, CheckCircle, Star, RefreshCw, ChevronUp, ChevronDown, Plus, Minus, Clock, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DevTester({ userId }: { userId: string }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Only render in development mode
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    const handleAction = async (action: () => Promise<any>, successMessage: string) => {
        setLoading(true);
        try {
            const result = await action();
            if (result.success) {
                alert(successMessage);
                // Dispatch a custom event so the dashboard re-fetches without a full page reload.
                // This preserves the initialLoadDone ref so the level-up celebration fires.
                window.dispatchEvent(new CustomEvent('dashboard:reload'));
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-50 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
                title="Open Dev Tools"
            >
                <ChevronUp className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 overflow-hidden flex flex-col">
            <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(false)}>
                <h3 className="font-bold text-sm tracking-wide">Developer Tools</h3>
                <ChevronDown className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
            </div>

            <div className="p-4 space-y-3 bg-gray-50 max-h-[60vh] overflow-y-auto">
                <p className="text-xs text-gray-500 mb-2">Manipulate tasker stats to test level progression and badges.</p>

                {/* Trust Score Row */}
                <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Shield className="w-4 h-4 text-brand-green" />
                        Trust Score
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleAction(() => updateTrustScore(userId, -50), 'Removed 50 Trust Score points')}
                            disabled={loading}
                            title="Decrease (-50)"
                            className="p-1 rounded bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleAction(() => updateTrustScore(userId, 50), 'Added 50 Trust Score points')}
                            disabled={loading}
                            title="Increase (+50)"
                            className="p-1 rounded bg-gray-100 hover:bg-brand-green/20 hover:text-brand-green transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Orders/Earnings Row */}
                <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Orders (+/- 10)
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleAction(() => simulateCompletedOrder(userId, -10, -500), 'Removed 10 Orders and $500')}
                            disabled={loading}
                            title="Decrease (-10)"
                            className="p-1 rounded bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleAction(() => simulateCompletedOrder(userId, 10, 500), 'Added 10 Orders and $500')}
                            disabled={loading}
                            title="Increase (+10)"
                            className="p-1 rounded bg-gray-100 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Rating Row */}
                <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Rating
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleAction(() => maxOutRating(userId, 1.0), 'Rating set to 1.0')}
                            disabled={loading}
                            title="Reset to 1.0"
                            className="p-1 rounded bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleAction(() => maxOutRating(userId, 5.0), 'Rating set to 5.0')}
                            disabled={loading}
                            title="Max to 5.0"
                            className="p-1 rounded bg-gray-100 hover:bg-yellow-100 hover:text-yellow-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* On-Time Delivery Row */}
                <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Clock className="w-4 h-4 text-purple-500" />
                        On-Time (+/- 10%)
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleAction(() => setOnTimeDeliveryRate(userId, -10), 'On-time rate decreased by 10%')}
                            disabled={loading}
                            title="Decrease (-10%)"
                            className="p-1 rounded bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleAction(() => setOnTimeDeliveryRate(userId, 10), 'On-time rate increased by 10%')}
                            disabled={loading}
                            title="Increase (+10%)"
                            className="p-1 rounded bg-gray-100 hover:bg-purple-100 hover:text-purple-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Force Level Row */}
                <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Layers className="w-4 h-4 text-pink-500" />
                        Force Level
                    </div>
                    <div className="flex items-center gap-1">
                        {(['level_0', 'level_1', 'level_2', 'level_3'] as const).map((lvl, i) => (
                            <button
                                key={lvl}
                                onClick={() => handleAction(() => forceLevel(userId, lvl), `Forced to Level ${i}`)}
                                disabled={loading}
                                title={`Force Level ${i}`}
                                className={`w-7 h-7 rounded text-xs font-black transition-colors ${
                                    i === 3
                                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {i}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-gray-200 my-2" />

                <button
                    onClick={() => handleAction(() => refreshLevel(userId), 'Level recalculated successfully')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-900 text-white rounded-lg shadow-sm hover:bg-gray-800 transition-colors font-semibold text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Recalculate Level
                </button>
            </div>
        </div>
    );
}
