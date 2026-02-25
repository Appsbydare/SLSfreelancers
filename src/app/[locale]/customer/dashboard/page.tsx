import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import {
    FileText, CheckCircle, Clock, AlertCircle, MessageSquare,
    ShoppingBag, TrendingUp, ChevronRight, Plus, Package
} from 'lucide-react';

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

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    open:        { label: 'Open',        color: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-500' },
    draft:       { label: 'Draft',       color: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400' },
    assigned:    { label: 'Assigned',    color: 'bg-purple-50 text-purple-600', dot: 'bg-purple-500' },
    in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-600',  dot: 'bg-amber-500' },
    completed:   { label: 'Completed',   color: 'bg-green-50 text-green-600',  dot: 'bg-green-500' },
    cancelled:   { label: 'Cancelled',   color: 'bg-red-50 text-red-500',      dot: 'bg-red-400' },
};

const orderStatusConfig: Record<string, { label: string; color: string }> = {
    pending:    { label: 'Pending',     color: 'bg-amber-50 text-amber-600' },
    active:     { label: 'Active',      color: 'bg-blue-50 text-blue-600' },
    delivered:  { label: 'Delivered',   color: 'bg-purple-50 text-purple-600' },
    completed:  { label: 'Completed',   color: 'bg-green-50 text-green-600' },
    cancelled:  { label: 'Cancelled',   color: 'bg-red-50 text-red-500' },
    revision:   { label: 'In Revision', color: 'bg-orange-50 text-orange-600' },
};

export default async function CustomerDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Resolve public user + customer ID
    const { data: userData } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('auth_user_id', user.id)
        .single();

    if (!userData) return null;

    const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle();

    // Fetch tasks
    const { data: tasks } = customer ? await supabase
        .from('tasks')
        .select('id, title, status, created_at, budget, category')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false }) : { data: [] };

    // Fetch orders (gig orders placed by this user)
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            id, order_number, status, total_amount, created_at,
            gig:gigs(title)
        `)
        .eq('customer_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(5);

    // Fetch recent offers on my tasks
    const { data: offers } = customer ? await supabase
        .from('offers')
        .select(`
            id, proposed_price, status, created_at,
            task:tasks!inner(title, customer_id)
        `)
        .eq('task.customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5) : { data: [] };

    // Fetch recent notifications
    const { data: recentNotifs } = await supabase
        .from('notifications')
        .select('id, title, message, notification_type, is_read, created_at, data')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(8);

    const allTasks = tasks || [];
    const allOrders = orders || [];
    const allOffers = offers || [];

    // Stats
    const activeTasks = allTasks.filter(t => ['open', 'assigned', 'in_progress'].includes(t.status)).length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const pendingOffers = allOffers.filter(o => o.status === 'pending').length;
    const activeOrders = allOrders.filter(o => ['pending', 'active', 'delivered'].includes(o.status)).length;

    // Build unified recent activity feed
    type ActivityItem = {
        id: string;
        type: 'task' | 'offer' | 'order' | 'notification';
        title: string;
        subtitle: string;
        status?: string;
        statusType?: 'task' | 'order';
        time: string;
        href?: string;
    };

    const activityItems: ActivityItem[] = [
        ...allTasks.slice(0, 4).map(t => ({
            id: `task-${t.id}`,
            type: 'task' as const,
            title: t.title,
            subtitle: t.category || 'Task request',
            status: t.status,
            statusType: 'task' as const,
            time: t.created_at,
            href: `/${locale}/customer/dashboard/tasks/${t.id}`,
        })),
        ...allOffers.slice(0, 3).map(o => ({
            id: `offer-${o.id}`,
            type: 'offer' as const,
            title: `New bid on "${(o.task as any)?.title}"`,
            subtitle: `LKR ${Number(o.proposed_price).toLocaleString()}`,
            time: o.created_at,
            href: `/${locale}/customer/dashboard/tasks/${(o.task as any)?.id || ''}`,
        })),
        ...allOrders.slice(0, 3).map(o => ({
            id: `order-${o.id}`,
            type: 'order' as const,
            title: `Order #${o.order_number}`,
            subtitle: (o.gig as any)?.title || 'Gig order',
            status: o.status,
            statusType: 'order' as const,
            time: o.created_at,
            href: `/${locale}/orders/${o.id}`,
        })),
        ...(recentNotifs || []).slice(0, 3).map(n => ({
            id: `notif-${n.id}`,
            type: 'notification' as const,
            title: n.title,
            subtitle: n.message,
            time: n.created_at,
            href: `/${locale}/inbox`,
        })),
    ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 8);

    const typeIcon: Record<string, React.ReactNode> = {
        task:         <FileText className="h-4 w-4 text-blue-500" />,
        offer:        <TrendingUp className="h-4 w-4 text-purple-500" />,
        order:        <ShoppingBag className="h-4 w-4 text-brand-green" />,
        notification: <MessageSquare className="h-4 w-4 text-amber-500" />,
    };

    const typeBg: Record<string, string> = {
        task:         'bg-blue-50',
        offer:        'bg-purple-50',
        order:        'bg-brand-green/10',
        notification: 'bg-amber-50',
    };

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {userData.first_name || 'there'} 👋
                </h1>
                <p className="text-sm text-gray-500 mt-1">Here's what's happening with your requests.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href={`/${locale}/customer/dashboard/requests`}
                    className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Active Requests</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{activeTasks}</p>
                </Link>

                <Link href={`/${locale}/customer/dashboard/requests`}
                    className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-100 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Completed</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{completedTasks}</p>
                </Link>

                <Link href={`/${locale}/customer/dashboard/requests`}
                    className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-100 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Pending Bids</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{pendingOffers}</p>
                </Link>

                <Link href={`/${locale}/orders`}
                    className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-green/30 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-brand-green/10 rounded-lg group-hover:bg-brand-green/20 transition-colors">
                            <Package className="h-5 w-5 text-brand-green" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Active Orders</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{activeOrders}</p>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity Feed */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
                        <Link href={`/${locale}/inbox`} className="text-xs text-brand-green font-medium hover:underline">
                            View all
                        </Link>
                    </div>

                    {activityItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <Clock className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">No activity yet</p>
                            <p className="text-xs text-gray-400 mb-4">Post your first request to get started</p>
                            <Link href={`/${locale}/post-task`}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-green/90 transition-colors">
                                <Plus className="h-3.5 w-3.5" /> Post a Request
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {activityItems.map((item) => {
                                const statusCfg = item.statusType === 'task'
                                    ? statusConfig[item.status || '']
                                    : orderStatusConfig[item.status || ''];

                                const row = (
                                    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                        {/* Icon */}
                                        <div className={`flex-shrink-0 h-8 w-8 rounded-lg ${typeBg[item.type]} flex items-center justify-center`}>
                                            {typeIcon[item.type]}
                                        </div>
                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                            <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                                        </div>
                                        {/* Right side */}
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

                {/* Quick Actions + My Tasks summary */}
                <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h2>
                        <div className="space-y-2">
                            <Link href={`/${locale}/post-task`}
                                className="flex items-center gap-3 p-3 rounded-lg border border-brand-green/20 bg-brand-green/5 hover:bg-brand-green/10 transition-colors group">
                                <div className="h-8 w-8 bg-brand-green rounded-lg flex items-center justify-center">
                                    <Plus className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Post a Request</p>
                                    <p className="text-xs text-gray-500">Find a tasker for your job</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                            </Link>
                            <Link href={`/${locale}/browse-services`}
                                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <ShoppingBag className="h-4 w-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Browse Gigs</p>
                                    <p className="text-xs text-gray-500">Hire from seller services</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                            </Link>
                            <Link href={`/${locale}/customer/dashboard/messages`}
                                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="h-4 w-4 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Messages</p>
                                    <p className="text-xs text-gray-500">Chat with taskers</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                            </Link>
                        </div>
                    </div>

                    {/* My Recent Tasks */}
                    {allTasks.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                                <h2 className="text-sm font-bold text-gray-900">My Requests</h2>
                                <Link href={`/${locale}/customer/dashboard/requests`} className="text-xs text-brand-green font-medium hover:underline">
                                    View all
                                </Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {allTasks.slice(0, 4).map(task => {
                                    const cfg = statusConfig[task.status] || statusConfig.draft;
                                    return (
                                        <Link key={task.id} href={`/${locale}/customer/dashboard/tasks/${task.id}`}
                                            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                            <span className={`flex-shrink-0 h-2 w-2 rounded-full ${cfg.dot}`} />
                                            <p className="flex-1 text-sm text-gray-700 truncate">{task.title}</p>
                                            <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
