'use client';

import { useState } from 'react';
import { Info, X, Shield, Star, Award, TrendingUp, CheckCircle2, ChevronRight, Check } from 'lucide-react';

interface SellerLevelInfoModalProps {
    trustScore?: number;
    levelCode?: string;
    onTimeDeliveryRate?: number;
    completedOrders?: number;
    avgRating?: number;
    isHighRisk?: boolean;
}

export default function SellerLevelInfoModal({
    trustScore = 0,
    levelCode = 'level_0',
    onTimeDeliveryRate = 100,
    completedOrders = 0,
    avgRating = 0,
    isHighRisk = false
}: SellerLevelInfoModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        const btnAccent = levelCode === 'level_3' ? 'text-purple-600 hover:underline font-medium bg-purple-500/10 px-2 py-1 rounded' : levelCode === 'level_2' ? 'text-amber-700 hover:underline font-medium bg-amber-500/10 px-2 py-1 rounded' : 'text-brand-green hover:underline font-medium bg-brand-green/10 px-2 py-1 rounded';
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`text-xs flex items-center gap-1 ${btnAccent}`}
            >
                <Info className="h-3.5 w-3.5" /> How to level up?
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-gray-100 mt-20 md:mt-0 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-brand-green" />
                            Seller Levels & Trust Score
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Understand how to grow your business on EasyFinder
                        </p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 bg-gray-50 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8">
                    {/* Trust Score Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-500" />
                                Trust Score System
                            </h3>
                            <div className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-full border border-gray-200 shadow-sm">
                                Current Score: {trustScore}
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Your Trust Score proves to customers that you are a reliable and verified professional. The more documents you provide, the higher your score.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className={`border rounded-xl p-5 relative overflow-hidden transition-all ${trustScore >= 100 ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-200 opacity-80'}`}>
                                {trustScore >= 100 && (
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-bl-full flex items-start justify-end p-3 text-blue-500">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                )}
                                <h4 className={`font-bold flex items-center gap-2 ${trustScore >= 100 ? 'text-gray-900' : 'text-gray-700'}`}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${trustScore >= 100 ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                    Verified (100 pts)
                                </h4>
                                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                                    <li className="flex items-start gap-1">
                                        <ChevronRight className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                                        <span>Required to unlock full platform features.</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <ChevronRight className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                                        <span>Normal Sellers: NIC + Address Proof.</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <ChevronRight className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                                        <span className={isHighRisk ? 'font-semibold text-amber-600' : ''}>High-Risk Sellers: NIC + Address + Insurance.</span>
                                    </li>
                                    {trustScore >= 100 && (
                                        <li className="flex items-start gap-1 text-blue-700 font-medium">
                                            <Check className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                                            <span>Unlocked your 5 active gig limit!</span>
                                        </li>
                                    )}
                                </ul>
                                {trustScore < 100 && (
                                    <div className="mt-4">
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((trustScore / 100) * 100, 100)}%` }}></div>
                                        </div>
                                        <div className="text-xs text-gray-500 text-right">{trustScore} / 100</div>
                                    </div>
                                )}
                            </div>

                            <div className={`border rounded-xl p-5 relative overflow-hidden transition-all ${trustScore >= 200 ? 'bg-yellow-50 border-yellow-200 shadow-sm' : 'bg-white border-gray-200 opacity-80'}`}>
                                {trustScore >= 200 && (
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-200 rounded-bl-full flex items-start justify-end p-3 text-yellow-600">
                                        <Star className="h-5 w-5 fill-yellow-500" />
                                    </div>
                                )}
                                <h4 className={`font-bold flex items-center gap-2 ${trustScore >= 200 ? 'text-gray-900' : 'text-gray-700'}`}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${trustScore >= 200 ? 'bg-yellow-400' : 'bg-gray-300'}`}></span>
                                    Trust Verified (200 pts)
                                </h4>
                                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                                    <li className="flex items-start gap-1">
                                        <ChevronRight className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                                        <span>The highest level of identity trust.</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <ChevronRight className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                                        <span>Unlocked by providing a Police Clearance Certificate (100 pts).</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <ChevronRight className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                                        <span>Earns a glowing gold ring around your profile picture.</span>
                                    </li>
                                </ul>
                                {trustScore >= 100 && trustScore < 200 && (
                                    <div className="mt-4">
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                                            <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${Math.min(((trustScore - 100) / 100) * 100, 100)}%` }}></div>
                                        </div>
                                        <div className="text-xs text-gray-500 text-right">{trustScore} / 200 pts</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Level System Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2 w-full">
                                <Award className="h-5 w-5 text-purple-500" />
                                Seller Level Progression
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            While Trust Score is about identity, your Seller Level is about your performance history on EasyFinder.
                        </p>

                        <div className="space-y-4">
                            {/* Level 0 */}
                            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 border rounded-xl p-4 ${levelCode === 'level_0' ? 'bg-gray-50 border-gray-300 shadow-sm' : 'bg-white border-gray-100 opacity-60'}`}>
                                <div className={`border rounded-lg p-2 text-center w-20 flex-shrink-0 ${levelCode === 'level_0' ? 'bg-white border-gray-300 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="text-xs text-gray-500 font-bold">LEVEL</div>
                                    <div className="text-2xl font-black text-gray-700">0</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-gray-900">New Seller</h4>
                                        {levelCode === 'level_0' && <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">Current Level</span>}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Where everyone starts. Your goal is to get verified and complete your first few orders on time.
                                    </p>
                                </div>
                            </div>

                            {/* Level 1 */}
                            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 border rounded-xl p-4 relative overflow-hidden transition-all ${levelCode === 'level_1' ? 'bg-brand-green/5 border-brand-green/40 shadow-sm' : 'bg-white border-gray-200'}`}>
                                {levelCode === 'level_1' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-green"></div>}
                                <div className={`border rounded-lg p-2 text-center w-20 flex-shrink-0 ${levelCode === 'level_1' ? 'bg-brand-green/10 border-brand-green/30' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className={`text-xs font-bold ${levelCode === 'level_1' ? 'text-brand-green' : 'text-gray-500'}`}>LEVEL</div>
                                    <div className={`text-2xl font-black ${levelCode === 'level_1' ? 'text-brand-green' : 'text-gray-700'}`}>1</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-gray-900">Level 1 Seller</h4>
                                        {levelCode === 'level_1' && <span className="text-xs font-bold text-brand-green bg-brand-green/20 px-2 py-0.5 rounded-full">Current Level</span>}
                                    </div>
                                    <div className="text-xs font-semibold text-gray-500 mt-2 uppercase tracking-wider mb-2">Requirements:</div>
                                    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                                        <span className={`px-2 py-1 rounded flex items-center gap-1 ${trustScore >= 100 ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100'}`}>
                                            {trustScore >= 100 && <Check className="h-3 w-3" />} 100 Trust Score
                                        </span>
                                        <span className={`px-2 py-1 rounded flex items-center gap-1 ${(completedOrders > 0 && onTimeDeliveryRate >= 90) ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100'}`}>
                                            {(completedOrders > 0 && onTimeDeliveryRate >= 90) && <Check className="h-3 w-3" />} 90% On-Time Delivery
                                        </span>
                                        <span className={`px-2 py-1 rounded flex items-center gap-1 ${completedOrders >= 5 ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100'}`}>
                                            {completedOrders >= 5 && <Check className="h-3 w-3" />} 5 Completed Orders
                                        </span>
                                        <span className={`px-2 py-1 rounded flex items-center gap-1 ${avgRating >= 4.0 ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100'}`}>
                                            {avgRating >= 4.0 && <Check className="h-3 w-3" />} 4.0★ Minimum Rating
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Level 2 */}
                            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 border rounded-xl p-4 relative overflow-hidden transition-all ${levelCode === 'level_2' ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-white border-gray-200'}`}>
                                {levelCode === 'level_2' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>}
                                <div className={`border rounded-lg p-2 text-center w-20 flex-shrink-0 ${levelCode === 'level_2' ? 'bg-amber-100 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className={`text-xs font-bold ${levelCode === 'level_2' ? 'text-amber-700' : 'text-gray-500'}`}>LEVEL</div>
                                    <div className={`text-2xl font-black ${levelCode === 'level_2' ? 'text-amber-700' : 'text-gray-700'}`}>2</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-gray-900">Level 2 Seller</h4>
                                        {levelCode === 'level_2' && <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">Current Level</span>}
                                    </div>
                                    <div className="text-xs font-semibold text-gray-500 mt-2 uppercase tracking-wider mb-2">Requirements:</div>
                                    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                                        <span className={`px-2 py-1 rounded flex items-center gap-1 ${trustScore >= 200 ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100'}`}>
                                            {trustScore >= 200 && <Check className="h-3 w-3" />} 200 Trust Score (Trust Verified)
                                        </span>
                                        <span className={`px-2 py-1 rounded flex items-center gap-1 ${completedOrders >= 25 ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100'}`}>
                                            {completedOrders >= 25 && <Check className="h-3 w-3" />} 25 Completed Orders
                                        </span>
                                        <span className={`px-2 py-1 rounded flex items-center gap-1 ${avgRating >= 4.5 ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100'}`}>
                                            {avgRating >= 4.5 && <Check className="h-3 w-3" />} 4.5★ Minimum Rating
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Level 3 */}
                            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 border rounded-xl p-4 shadow-sm relative overflow-hidden transition-all ${levelCode === 'level_3' ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300' : 'bg-white border-gray-200 opacity-70'}`}>
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                                <div className={`border rounded-lg p-2 text-center w-20 flex-shrink-0 shadow-sm ${levelCode === 'level_3' ? 'bg-white border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className={`text-xs font-bold ${levelCode === 'level_3' ? 'text-purple-600' : 'text-gray-500'}`}>LEVEL</div>
                                    <div className={`text-2xl font-black ${levelCode === 'level_3' ? 'text-purple-600' : 'text-gray-700'}`}>3</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex items-center gap-2">
                                            Top Seller
                                            <Award className="h-4 w-4 text-pink-500" />
                                        </h4>
                                        {levelCode === 'level_3' && (
                                            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">Current Level</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">
                                        Admin-assigned for the highest-performing professionals. Grants the final <strong>+50 Trust Score</strong> points (200→250) and displays a special Top Seller badge on your profile.
                                    </p>
                                </div>
                            </div>

                            {/* EasyFinders' Choice — separate award */}
                            <div className="flex flex-col sm:flex-row items-start gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-4 shadow-sm relative overflow-hidden mt-2">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500"></div>
                                <div className="flex-shrink-0 w-20 flex items-center justify-center">
                                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-full w-12 h-12 flex items-center justify-center shadow-md">
                                        <span className="text-2xl">🏅</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 flex items-center gap-2">
                                        EasyFinders' Choice
                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full normal-case tracking-normal">Special Award</span>
                                    </h4>
                                    <p className="text-sm text-gray-700 mt-1">
                                        A separate, prestigious badge awarded by our team to truly exceptional sellers — not tied to any level. It recognises outstanding service, exceptional client feedback, and consistent excellence above and beyond the platform average.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        </div>
    );
}
