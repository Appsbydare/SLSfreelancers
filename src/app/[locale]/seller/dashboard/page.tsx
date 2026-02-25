'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { getSellerDashboardData } from '@/app/actions/seller';

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
    pending:    { label: 'Pending',     color: 'bg-amber-50 text-amber-600',   dot: 'bg-amber-400' },
    active:     { label: 'Active',      color: 'bg-blue-50 text-blue-600',     dot: 'bg-blue-500' },
    in_progress:{ label: 'In Progress', color: 'bg-blue-50 text-blue-600',     dot: 'bg-blue-500' },
    delivered:  { label: 'Delivered',   color: 'bg-purple-50 text-purple-600', dot: 'bg-purple-500' },
    completed:  { label: 'Completed',   color: 'bg-green-50 text-green-600',   dot: 'bg-green-500' },
    cancelled:  { label: 'Cancelled',   color: 'bg-red-50 text-red-500',       dot: 'bg-red-400' },
    revision:   { label: 'Revision',    color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
};

const bidStatusConfig: Record<string, { label: string; color: string }> = {
    pending:  { label: 'Pending',  color: 'bg-amber-50 text-amber-600' },
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
    const [stats, setStats] = useState({
        activeGigs: 0, activeOrders: 0, totalEarnings: 0,
        pendingEarnings: 0, completedOrders: 0, totalOrders: 0
    });

    const loadDashboardData = useCallback(async () => {
        if (authLoading) return;
        if (!user) { router.push('/login?type=tasker'); return; }
        try {
            setLoading(true);
            const data = await getSellerDashboardData(user.id);
            if (data) {
                setTaskerData(data.tasker);
                setVerifications(data.verifications || []);
                setRecentOrders(data.recentOrders || []);
                setRecentNotifs(data.recentNotifs || []);
                setRecentBids(data.recentBids || []);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, [user, authLoading, router]);

    useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

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

    const typeIcon: Record<string, React.ReactNode> = {
        order:        <ShoppingBag className="h-4 w-4 text-brand-green" />,
        bid:          <FileText className="h-4 w-4 text-blue-500" />,
        notification: <MessageSquare className="h-4 w-4 text-amber-500" />,
    };
    const typeBg: Record<string, string> = {
        order:        'bg-brand-green/10',
        bid:          'bg-blue-50',
        notification: 'bg-amber-50',
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green" />
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-50 rounded-lg"><Star className="h-5 w-5 text-amber-400" /></div>
                        <span className="text-xs font-medium text-gray-500">Rating</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{taskerData?.rating ? taskerData.rating.toFixed(1) : '—'}</p>
                    <p className="text-xs text-gray-400 mt-1">{stats.completedOrders} completed orders</p>
                </div>

                <Link href={`/${locale}/seller/dashboard/gigs`}
                    className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors"><Package className="h-5 w-5 text-blue-500" /></div>
                        <span className="text-xs font-medium text-gray-500">Active Gigs</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeGigs}</p>
                    <p className="text-xs text-gray-400 mt-1">{stats.totalOrders} total orders</p>
                </Link>

                <Link href={`/${locale}/seller/dashboard/orders`}
                    className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-green/30 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-brand-green/10 rounded-lg group-hover:bg-brand-green/20 transition-colors"><Clock className="h-5 w-5 text-brand-green" /></div>
                        <span className="text-xs font-medium text-gray-500">Active Orders</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
                    <p className="text-xs text-gray-400 mt-1">in progress</p>
                </Link>

                <Link href={`/${locale}/seller/dashboard/earnings`}
                    className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors"><Wallet className="h-5 w-5 text-emerald-500" /></div>
                        <span className="text-xs font-medium text-gray-500">Total Earnings</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">LKR {stats.totalEarnings.toLocaleString()}</p>
                    {stats.pendingEarnings > 0 && (
                        <p className="text-xs text-amber-500 mt-1">+LKR {stats.pendingEarnings.toLocaleString()} pending</p>
                    )}
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Feed */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
                        <Link href={`/${locale}/inbox`} className="text-xs text-brand-green font-medium hover:underline">View all</Link>
                    </div>

                    {activityItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <TrendingUp className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">No activity yet</p>
                            <p className="text-xs text-gray-400 mb-4">Create your first gig to start receiving orders</p>
                            <Link href={isVerified ? `/${locale}/seller/dashboard/gigs/new` : `/${locale}/seller/dashboard/verifications`}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-green/90 transition-colors">
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
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-gray-900">Your Profile</h2>
                            <Link href={`/${locale}/seller/dashboard/profile`}
                                className="flex items-center gap-1 text-xs text-brand-green font-medium hover:underline">
                                <Edit className="h-3 w-3" /> Edit
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 flex-shrink-0">
                                {taskerData?.user?.profile_image_url ? (
                                    <Image src={taskerData.user.profile_image_url} alt="Profile" fill className="rounded-full object-cover" />
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-brand-green/10 flex items-center justify-center">
                                        <span className="text-brand-green text-lg font-bold">{user?.firstName?.charAt(0)}</span>
                                    </div>
                                )}
                                {isVerified && (
                                    <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-brand-green rounded-full flex items-center justify-center border-2 border-white">
                                        <ShieldCheck className="h-2.5 w-2.5 text-white" />
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                                <SellerLevelBadge level={taskerData?.level_code || 'starter_pro'} />
                            </div>
                        </div>

                        {/* Mini stats */}
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                            {[
                                { label: 'Orders', value: stats.totalOrders },
                                { label: 'Done', value: stats.completedOrders },
                                { label: 'Rating', value: taskerData?.rating ? taskerData.rating.toFixed(1) : '—' },
                            ].map(s => (
                                <div key={s.label} className="text-center">
                                    <p className="text-base font-bold text-gray-900">{s.value}</p>
                                    <p className="text-[10px] text-gray-400">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h2>
                        <div className="space-y-2">
                            {[
                                {
                                    icon: <Plus className="h-4 w-4 text-white" />, bg: 'bg-brand-green',
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
