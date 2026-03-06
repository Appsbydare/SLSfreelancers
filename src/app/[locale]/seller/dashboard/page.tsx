'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Star, Clock, DollarSign, Package, TrendingUp, Edit,
    ShieldCheck, Plus, MessageSquare, ChevronRight,
    ShoppingBag, CheckCircle, Wallet, AlertCircle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import SellerLevelBadge from '@/components/SellerLevelBadge';
import SellerLevelInfoModal from '@/components/SellerLevelInfoModal';
import LevelUpCelebration from '@/components/LevelUpCelebration';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerDashboardData } from '@/app/actions/seller';
import SuperVerifiedAvatar from '@/components/SuperVerifiedAvatar';
import DevTester from '@/components/DevTester';
import { supabase } from '@/lib/supabase';

const LEVEL_ORDER = ['level_0', 'level_1', 'level_2', 'level_3'];

function levelRank(code: string) {
    const idx = LEVEL_ORDER.indexOf(code);
    return idx === -1 ? 0 : idx;
}

function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

const orderStatusConfig: Record<string, { label: string; color: string; dot: string }> = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-600', dot: 'bg-amber-400' },
    active: { label: 'Active', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
    in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
    delivered: { label: 'Delivered', color: 'bg-purple-50 text-purple-600', dot: 'bg-purple-500' },
    completed: { label: 'Completed', color: 'bg-green-50 text-green-600', dot: 'bg-green-500' },
    cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-500', dot: 'bg-red-400' },
    revision: { label: 'Revision', color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
};

const bidStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-600' },
    accepted: { label: 'Accepted', color: 'bg-green-50 text-green-600' },
    rejected: { label: 'Rejected', color: 'bg-red-50 text-red-500' },
};

export default function SellerDashboardPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';
    const { user, isLoading: authLoading, refreshProfile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [taskerData, setTaskerData] = useState<any>(null);
    const [verifications, setVerifications] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
    const [recentBids, setRecentBids] = useState<any[]>([]);
    const [isHighRisk, setIsHighRisk] = useState<boolean>(false);
    const [stats, setStats] = useState({
        activeGigs: 0, activeOrders: 0, totalEarnings: 0,
        pendingEarnings: 0, completedOrders: 0, totalOrders: 0
    });
    const [celebrationLevel, setCelebrationLevel] = useState<string | null>(null);
    const [badgeCelebrateLevel, setBadgeCelebrateLevel] = useState<string | null>(null);
    const [badgePrevLevel, setBadgePrevLevel] = useState<string | null>(null);
    // track whether we've done the initial load (skip celebration on first paint)
    const initialLoadDone = useRef(false);

    const loadDashboardData = useCallback(async () => {
        if (authLoading) return;
        if (!user) { router.push('/login?type=tasker'); return; }
        try {
            setLoading(true);
            const data = await getSellerDashboardData(user.id);
            if (data) {
                const newLevel: string = data.tasker?.level_code || 'level_0';
                const storageKey = `seller_level_${user.id}`;
                const storedLevel = localStorage.getItem(storageKey) || 'level_0';

                // Detect a real promotion (not first paint, not a demotion)
                if (initialLoadDone.current && levelRank(newLevel) > levelRank(storedLevel)) {
                    setBadgePrevLevel(storedLevel);
                    setCelebrationLevel(newLevel);
                    // Insert an in-app notification so the bell also lights up
                    try {
                        await supabase.from('notifications').insert({
                            user_id: user.id,
                            notification_type: 'level_up',
                            title: `🏆 Congratulations! You reached ${newLevel.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
                            message: 'Your hard work has paid off — you\'ve unlocked a new seller level!',
                            data: { level: newLevel },
                        });
                    } catch { /* non-critical */ }
                }

                // Always persist the latest known level
                localStorage.setItem(storageKey, newLevel);
                initialLoadDone.current = true;

                setTaskerData(data.tasker);
                setVerifications(data.verifications || []);
                setRecentOrders(data.recentOrders || []);
                setRecentNotifs(data.recentNotifs || []);
                setRecentBids(data.recentBids || []);
                setIsHighRisk(data.isHighRisk || false);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, [user, authLoading, router]);

    useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

    // Listen for dev-tool reload trigger (fires after dev actions so celebration fires without full reload)
    useEffect(() => {
        const handler = () => loadDashboardData();
        window.addEventListener('dashboard:reload', handler);
        return () => window.removeEventListener('dashboard:reload', handler);
    }, [loadDashboardData]);

    useEffect(() => {
        if (taskerData?.user?.is_verified && !user?.isVerified && refreshProfile) {
            refreshProfile();
        }
    }, [taskerData?.user?.is_verified, user?.isVerified, refreshProfile]);

    // Verification helpers
    const getLatestDoc = (type: string) => {
        const docs = verifications.filter((v: any) => v.verification_type === type);
        if (!docs.length) return null;
        return docs.reduce((a: any, b: any) =>
            new Date(b.submitted_at) > new Date(a.submitted_at) ? b : a);
    };
    const docTypes = ['nic_front', 'nic_back', 'address_proof'];
    const hasAllDocs = docTypes.every(d => !!getLatestDoc(d));
    const hasRejected = docTypes.some(d => getLatestDoc(d)?.status === 'rejected');
    const isVerified = user?.isVerified || taskerData?.user?.is_verified;

    // Build unified activity feed
    type ActivityItem = { id: string; type: string; title: string; subtitle: string; status?: string; time: string; href?: string };
    const activityItems: ActivityItem[] = [
        ...recentOrders.slice(0, 4).map(o => ({
            id: `order-${o.id}`,
            type: 'order',
            title: `Order #${o.order_number}`,
            subtitle: (o.gig as any)?.title || 'Gig order',
            status: o.status,
            time: o.updated_at || o.created_at,
            href: `/${locale}/orders/${o.id}`,
        })),
        ...recentBids.slice(0, 3).map(b => ({
            id: `bid-${b.id}`,
            type: 'bid',
            title: `Bid on "${(b.task as any)?.title}"`,
            subtitle: `LKR ${Number(b.proposed_price).toLocaleString()}`,
            status: b.status,
            time: b.created_at,
            href: `/${locale}/tasks/${(b.task as any)?.id || ''}`,
        })),
        ...recentNotifs.slice(0, 3).map(n => ({
            id: `notif-${n.id}`,
            type: 'notification',
            title: n.title,
            subtitle: n.message,
            time: n.created_at,
            href: `/${locale}/inbox`,
        })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

    const levelCode = taskerData?.level_code || 'level_0';
    const accent = levelCode === 'level_3' ? { text: 'text-purple-600', hover: 'group-hover:text-purple-600', bg: 'bg-purple-600', bgHover: 'hover:bg-purple-500', border: 'border-purple-300', borderHover: 'hover:border-purple-300', bgLight: 'bg-purple-500/10', bgLightHover: 'group-hover:bg-purple-500/20', barFrom: 'from-purple-600', barTo: 'to-purple-400', dot: 'bg-purple-600', card: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-purple-500/5', cardHover: 'hover:border-purple-300' }
        : levelCode === 'level_2' ? { text: 'text-amber-700', hover: 'group-hover:text-amber-700', bg: 'bg-amber-500', bgHover: 'hover:bg-amber-600', border: 'border-amber-300', borderHover: 'hover:border-amber-300', bgLight: 'bg-amber-500/10', bgLightHover: 'group-hover:bg-amber-500/20', barFrom: 'from-amber-500', barTo: 'to-amber-400', dot: 'bg-amber-500', card: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-amber-500/5', cardHover: 'hover:border-amber-300' }
        : { text: 'text-brand-green', hover: 'group-hover:text-brand-green', bg: 'bg-brand-green', bgHover: 'hover:bg-brand-green/90', border: 'border-brand-green/30', borderHover: 'hover:border-brand-green/30', bgLight: 'bg-brand-green/10', bgLightHover: 'group-hover:bg-brand-green/20', barFrom: 'from-brand-green', barTo: 'to-emerald-400', dot: 'bg-brand-green', card: 'bg-white border-gray-100', cardHover: 'hover:border-gray-200' };

    const typeIcon: Record<string, React.ReactNode> = {
        order: <ShoppingBag className={`h-4 w-4 ${accent.text}`} />,
        bid: <FileText className="h-4 w-4 text-blue-500" />,
        notification: <MessageSquare className="h-4 w-4 text-amber-500" />,
    };
    const typeBg: Record<string, string> = {
        order: accent.bgLight,
        bid: 'bg-blue-50',
        notification: 'bg-amber-50',
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${accent.text.replace('text-', 'border-')}`} />
            </div>
        );
    }

    // Verification banner style
    const bannerVariant = hasRejected
        ? { bg: 'bg-red-50 border-red-200', text: 'text-red-800', body: 'text-red-700', btn: 'bg-red-600 hover:bg-red-700', label: 'Action Required: Document Rejected' }
        : hasAllDocs
            ? { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', body: 'text-amber-700', btn: 'bg-amber-500 hover:bg-amber-600', label: 'Verification In Progress' }
            : { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', body: 'text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700', label: 'Action Required: Upload Identity Documents' };

    return (
        <div className="space-y-6">
            {/* Level-up celebration — modal + confetti */}
            {celebrationLevel && (
                <LevelUpCelebration
                    newLevel={celebrationLevel}
                    onDone={(level) => {
                        setCelebrationLevel(null);
                        setBadgeCelebrateLevel(level);
                        setTimeout(() => { setBadgeCelebrateLevel(null); setBadgePrevLevel(null); }, 3000);
                    }}
                />
            )}

            {user?.id && <DevTester userId={user.id} />}
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.firstName || 'there'} 👋
                </h1>
                <p className="text-sm text-gray-500 mt-1">Here's your seller business overview.</p>
            </div>

            {/* Verification Banner */}
            {!isVerified && (
                <div className={`rounded-xl border p-4 flex gap-3 items-start ${bannerVariant.bg}`}>
                    <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${bannerVariant.text}`} />
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${bannerVariant.text}`}>{bannerVariant.label}</p>
                        <p className={`text-xs mt-0.5 ${bannerVariant.body}`}>
                            {hasRejected
                                ? 'One or more documents were rejected. Re-submit to unlock your account.'
                                : hasAllDocs
                                    ? 'Your documents are under review. We\'ll notify you once verified.'
                                    : 'Upload your NIC and Proof of Address to activate your seller account.'}
                        </p>
                        {/* Progress steps */}
                        <div className="flex items-center gap-2 mt-3">
                            {['Upload Docs', 'In Review', 'Verified'].map((step, i) => {
                                const done = (i === 0 && hasAllDocs) || (i === 1 && isVerified) || (i === 2 && isVerified);
                                const active = (i === 0 && !hasAllDocs) || (i === 1 && hasAllDocs && !isVerified);
                                return (
                                    <div key={step} className="flex items-center gap-1.5">
                                        <span className={`h-6 w-6 rounded-full text-[10px] font-bold flex items-center justify-center ${done ? 'bg-brand-green text-white' : active ? `${bannerVariant.btn} text-white` : 'bg-gray-200 text-gray-500'}`}>
                                            {i + 1}
                                        </span>
                                        <span className={`text-xs hidden sm:block ${active ? bannerVariant.text + ' font-semibold' : done ? 'text-gray-700' : 'text-gray-400'}`}>{step}</span>
                                        {i < 2 && <div className={`h-0.5 w-6 rounded ${done ? 'bg-brand-green' : 'bg-gray-200'}`} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <Link
                        href={`/${locale}/seller/dashboard/verifications`}
                        className={`flex-shrink-0 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-colors ${bannerVariant.btn}`}
                    >
                        {hasAllDocs ? 'Check Status' : 'Upload Docs'}
                    </Link>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className={`p-5 rounded-xl border shadow-sm ${accent.card}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-50 rounded-lg"><Star className="h-5 w-5 text-amber-400" /></div>
                        <span className="text-xs font-medium text-gray-500">Rating</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{taskerData?.rating ? Number(taskerData.rating).toFixed(1) : '—'}</p>
                    <p className="text-xs text-gray-400 mt-1">{taskerData?.total_reviews || 0} reviews</p>
                </div>

                <div className={`p-5 rounded-xl border shadow-sm ${accent.card}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 ${accent.bgLight} rounded-lg`}><CheckCircle className={`h-5 w-5 ${accent.text}`} /></div>
                        <span className="text-xs font-medium text-gray-500">Completed</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{taskerData?.completed_tasks || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">orders completed</p>
                </div>

                <Link href={`/${locale}/seller/dashboard/gigs`}
                    className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-all group ${accent.card} ${levelCode !== 'level_0' ? accent.cardHover : 'hover:border-blue-100'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors"><Package className="h-5 w-5 text-blue-500" /></div>
                        <span className="text-xs font-medium text-gray-500">Active Gigs</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeGigs}</p>
                    <p className="text-xs text-gray-400 mt-1">{stats.totalOrders} total orders</p>
                </Link>

                <Link href={`/${locale}/seller/dashboard/orders`}
                    className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-all group ${accent.card} ${levelCode !== 'level_0' ? accent.cardHover : accent.borderHover}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 ${accent.bgLight} rounded-lg ${accent.bgLightHover} transition-colors`}><Clock className={`h-5 w-5 ${accent.text}`} /></div>
                        <span className="text-xs font-medium text-gray-500">Active Orders</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
                    <p className="text-xs text-gray-400 mt-1">in progress</p>
                </Link>

                <div className={`p-5 rounded-xl border shadow-sm ${accent.card}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-50 rounded-lg"><TrendingUp className="h-5 w-5 text-purple-500" /></div>
                        <span className="text-xs font-medium text-gray-500">Acceptance</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        {taskerData?.acceptance_rate != null ? `${Number(taskerData.acceptance_rate).toFixed(0)}%` : '—'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {taskerData?.on_time_delivery_rate != null ? `${Number(taskerData.on_time_delivery_rate).toFixed(0)}% on-time` : 'acceptance rate'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Feed */}
                <div className={`lg:col-span-2 rounded-xl border shadow-sm overflow-hidden ${accent.card}`}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
                        <Link href={`/${locale}/inbox`} className={`text-xs ${accent.text} font-medium hover:underline`}>View all</Link>
                    </div>

                    {activityItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <TrendingUp className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">No activity yet</p>
                            <p className="text-xs text-gray-400 mb-4">Create your first gig to start receiving orders</p>
                            <Link href={isVerified ? `/${locale}/seller/dashboard/gigs/new` : `/${locale}/seller/dashboard/verifications`}
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${accent.bg} text-white px-4 py-2 rounded-lg ${accent.bgHover} transition-colors`}>
                                <Plus className="h-3.5 w-3.5" /> {isVerified ? 'Create a Gig' : 'Get Verified'}
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {activityItems.map((item) => {
                                const orderCfg = item.type === 'order' ? orderStatusConfig[item.status || ''] : null;
                                const bidCfg = item.type === 'bid' ? bidStatusConfig[item.status || ''] : null;
                                const statusCfg = orderCfg || bidCfg;

                                const row = (
                                    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                        <div className={`flex-shrink-0 h-8 w-8 rounded-lg ${typeBg[item.type]} flex items-center justify-center`}>
                                            {typeIcon[item.type]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                            <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                                        </div>
                                        <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                            {statusCfg && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                                                    {statusCfg.label}
                                                </span>
                                            )}
                                            <span className="text-[11px] text-gray-400">{formatRelativeTime(item.time)}</span>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                                    </div>
                                );

                                return item.href ? (
                                    <Link key={item.id} href={item.href}>{row}</Link>
                                ) : (
                                    <div key={item.id}>{row}</div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    {/* Profile card */}
                    <div className={`rounded-xl border shadow-sm p-5 ${
                      taskerData?.level_code === 'level_3'
                        ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-purple-500/5'
                        : taskerData?.level_code === 'level_2'
                          ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-amber-500/5'
                          : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-gray-900 flex my-auto items-center gap-2">Your Profile <SellerLevelInfoModal
                                trustScore={taskerData?.trust_score || 0}
                                levelCode={taskerData?.level_code || 'level_0'}
                                onTimeDeliveryRate={Number(taskerData?.on_time_delivery_rate ?? 0)}
                                completedOrders={taskerData?.completed_tasks || 0}
                                avgRating={Number(taskerData?.rating ?? 0)}
                                isHighRisk={isHighRisk}
                            /></h2>
                            <Link href={`/${locale}/seller/dashboard/profile`}
                                className={`flex items-center gap-1 text-xs ${accent.text} font-medium hover:underline`}>
                                <Edit className="h-3 w-3" /> Edit
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <SuperVerifiedAvatar
                                src={taskerData?.user?.profile_image_url}
                                name={user?.firstName}
                                size={48}
                                isVerified={(taskerData?.trust_score ?? 0) >= 100}
                                isSuperVerified={(taskerData?.trust_score ?? 0) >= 200}
                                isLevel2={taskerData?.level_code === 'level_2'}
                                isTopSeller={taskerData?.level_code === 'level_3'}
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                                <SellerLevelBadge level={taskerData?.level_code || 'starter_pro'} animate celebrate={badgeCelebrateLevel === (taskerData?.level_code || '')} prevLevel={badgePrevLevel || undefined} />
                            </div>
                        </div>

                        {/* Mini stats */}
                        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                            {[
                                { label: 'Orders', value: stats.totalOrders, icon: <Package className="h-4 w-4 text-blue-500" />, bg: 'bg-blue-50' },
                                { label: 'Done', value: taskerData?.completed_tasks ?? 0, icon: <CheckCircle className={`h-4 w-4 ${accent.text}`} />, bg: accent.bgLight },
                                { label: 'Rating', value: taskerData?.rating ? Number(taskerData.rating).toFixed(1) : '—', icon: <Star className="h-4 w-4 text-yellow-500" />, bg: 'bg-yellow-50' },
                                { label: 'On Time', value: (taskerData?.on_time_delivery_rate ?? 0) > 0 ? `${Math.round(Number(taskerData.on_time_delivery_rate))}%` : '—', icon: <Clock className="h-4 w-4 text-purple-500" />, bg: 'bg-purple-50' },
                            ].map((s, idx) => (
                                <div key={idx} className={`flex flex-col items-center justify-center p-2 rounded-lg ${s.bg} border border-white shadow-sm`}>
                                    <div className="mb-1">{s.icon}</div>
                                    <p className="text-sm font-bold text-gray-900">{s.value}</p>
                                    <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trust Score Card */}
                    <Link
                        href={`/${locale}/seller/dashboard/verifications`}
                        className={`block rounded-xl border shadow-sm p-5 transition-all group ${
                          taskerData?.level_code === 'level_3'
                            ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-md hover:border-purple-300'
                            : taskerData?.level_code === 'level_2'
                              ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 hover:shadow-md hover:border-amber-300'
                              : 'bg-white border-gray-100 hover:shadow-md hover:border-brand-green/30'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-gray-900">Trust Score</h2>
                            {(taskerData?.trust_score ?? 0) >= 200 ? (
                                <span className={`text-xs font-bold flex items-center gap-1 ${levelCode === 'level_3' ? 'text-purple-600' : 'text-amber-600'}`}>⭐ Trust Verified</span>
                            ) : (
                                <span className={`text-xs text-gray-400 ${accent.hover} transition-colors`}>View details →</span>
                            )}
                        </div>

                        <div className="flex items-end justify-between mb-2">
                            <span className={`text-4xl font-black ${accent.text}`}>{taskerData?.trust_score ?? 0}</span>
                            <span className="text-sm text-gray-400 mb-1">/ 250 pts</span>
                        </div>

                        {/* Three-segment bar: 0→100 Verified (60%) | 100→200 Trust Verified (30%) | 200→250 Top Seller only (10%) */}
                        <div className="relative mb-5 mt-2 px-1">
                            <div className="w-full bg-gray-100 rounded-full h-2 flex overflow-hidden">
                                {/* Segment 1: 0→100 Verified */}
                                <div
                                    className={`h-full bg-gradient-to-r ${accent.barFrom} ${accent.barTo} transition-all duration-700`}
                                    style={{ width: `${Math.min(((taskerData?.trust_score ?? 0) / 100) * 60, 60)}%` }}
                                />
                                {/* Segment 2: 100→200 Trust Verified */}
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-700"
                                    style={{ width: `${(taskerData?.trust_score ?? 0) >= 100 ? Math.min((((taskerData?.trust_score ?? 0) - 100) / 100) * 30, 30) : 0}%` }}
                                />
                                {/* Segment 3: 200→250 Top Seller (admin-only) */}
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-red-400 transition-all duration-700"
                                    style={{ width: `${(taskerData?.trust_score ?? 0) >= 200 ? Math.min((((taskerData?.trust_score ?? 0) - 200) / 50) * 10, 10) : 0}%` }}
                                />
                            </div>

                            {/* Verified milestone dot at 60% */}
                            <div className="absolute top-1/2 left-[60%] -translate-y-1/2 -translate-x-1/2 z-10 mt-[-0.5px]">
                                <div className={`w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${(taskerData?.trust_score ?? 0) >= 100 ? accent.dot : 'bg-gray-200'} shadow-sm`}>
                                    {(taskerData?.trust_score ?? 0) >= 100 && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* Trust Verified milestone dot at 90% */}
                            <div className="absolute top-1/2 left-[90%] -translate-y-1/2 -translate-x-1/2 z-10 mt-[-0.5px]">
                                <div className={`w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${(taskerData?.trust_score ?? 0) >= 200 ? 'bg-amber-400' : 'bg-gray-200'} shadow-sm`}>
                                    {(taskerData?.trust_score ?? 0) >= 200 && <span className="text-[8px]">⭐</span>}
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] mt-2">
                            {(taskerData?.trust_score ?? 0) >= 250
                                ? <span className={`font-medium ${accent.text}`}>🎉 Maximum trust level reached!</span>
                                : ((taskerData?.trust_score ?? 0) >= 200
                                    ? <span className="text-orange-600 font-medium">Top Seller tier — last 50 pts awarded by admin</span>
                                    : ((taskerData?.trust_score ?? 0) >= 100
                                        ? <span className="text-yellow-600 font-medium">{Math.max(0, 200 - (taskerData?.trust_score ?? 0))} pts to reach Trust Verified</span>
                                        : <span className={`${accent.text} font-medium`}>{100 - Math.min(taskerData?.trust_score ?? 0, 100)} pts to reach Verified</span>
                                    )
                                )
                            }
                        </p>
                    </Link>

                    <div className={`rounded-xl border shadow-sm p-5 ${
                      taskerData?.level_code === 'level_3'
                        ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                        : taskerData?.level_code === 'level_2'
                          ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
                          : 'bg-white border-gray-100'
                    }`}>
                        <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h2>
                        <div className="space-y-2">
                            {[
                                {
                                    icon: <Plus className="h-4 w-4 text-white" />, bg: accent.bg,
                                    label: 'Create Gig', sub: 'Add a new service offering',
                                    href: isVerified ? `/${locale}/seller/dashboard/gigs/new` : null,
                                    locked: !isVerified,
                                },
                                {
                                    icon: <ShoppingBag className="h-4 w-4 text-blue-500" />, bg: 'bg-blue-50',
                                    label: 'View Orders', sub: 'Track all your orders',
                                    href: `/${locale}/seller/dashboard/orders`,
                                },
                                {
                                    icon: <MessageSquare className="h-4 w-4 text-purple-500" />, bg: 'bg-purple-50',
                                    label: 'Messages', sub: 'Chat with customers',
                                    href: `/${locale}/seller/dashboard/messages`,
                                },
                                {
                                    icon: <Wallet className="h-4 w-4 text-emerald-500" />, bg: 'bg-emerald-50',
                                    label: 'Earnings', sub: 'View your payouts',
                                    href: `/${locale}/seller/dashboard/earnings`,
                                },
                            ].map((action) => {
                                const inner = (
                                    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${action.locked ? 'border-gray-100 opacity-60 cursor-not-allowed' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <div className={`h-8 w-8 ${action.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                            {action.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                                            <p className="text-xs text-gray-500">{action.sub}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-300 ml-auto flex-shrink-0" />
                                    </div>
                                );
                                return action.locked ? (
                                    <button key={action.label} type="button" onClick={() => toast.error('Complete verification to use this feature.')} className="w-full text-left">
                                        {inner}
                                    </button>
                                ) : (
                                    <Link key={action.label} href={action.href!}>{inner}</Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
