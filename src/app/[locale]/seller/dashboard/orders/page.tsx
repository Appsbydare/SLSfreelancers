'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import {
  Package, Clock, CheckCircle, RefreshCw, XCircle, AlertTriangle,
  Search, ChevronRight, TrendingUp, DollarSign, AlertCircle,
  PlayCircle, Truck, RotateCcw, Eye, Upload, Filter, Calendar,
  User, ArrowUpRight, Inbox
} from 'lucide-react';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';
import DeliveryUploader from '@/components/DeliveryUploader';

type OrderStatus = 'pending' | 'in_progress' | 'delivered' | 'revision_requested' | 'completed' | 'cancelled';

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  package_tier: string;
  total_amount: number;
  platform_fee: number;
  seller_earnings: number;
  delivery_date: string;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  requirements_response: Record<string, any>;
  gigTitle: string;
  gigImage: string | null;
  customerName: string;
  customerAvatar: string | null;
  packageName: string | null;
  deliveries?: any[];
  revisions?: any[];
}

const STATUS_TABS: { id: string; label: string; statuses: string[] }[] = [
  { id: 'all', label: 'All', statuses: [] },
  { id: 'action', label: 'Needs Action', statuses: ['pending', 'revision_requested'] },
  { id: 'active', label: 'In Progress', statuses: ['in_progress'] },
  { id: 'delivered', label: 'Delivered', statuses: ['delivered'] },
  { id: 'completed', label: 'Completed', statuses: ['completed'] },
  { id: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
];

function getDaysUntilDeadline(deliveryDate: string) {
  const now = new Date();
  const deadline = new Date(deliveryDate);
  const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function DeadlinePill({ deliveryDate, status }: { deliveryDate: string; status: string }) {
  if (['completed', 'cancelled', 'delivered'].includes(status)) return null;
  const days = getDaysUntilDeadline(deliveryDate);
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <AlertCircle className="h-3 w-3" /> {Math.abs(days)}d overdue
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <AlertCircle className="h-3 w-3" /> Due today
      </span>
    );
  }
  if (days <= 2) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
        <Clock className="h-3 w-3" /> {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
      <Calendar className="h-3 w-3" /> {days}d left
    </span>
  );
}

export default function SellerOrdersPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const hasFetched = useRef(false);

  const fetchOrders = async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?userId=${uid}&userType=seller&limit=100`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      const mapped = (json.orders ?? []).map((o: any) => ({
        ...o,
        gigTitle: o.gigTitle || o.gig?.title || 'Unknown Gig',
        gigImage: o.gigImage || o.gig?.images?.[0] || null,
        customerName: o.customerName || 'Unknown Customer',
        customerAvatar: o.customerAvatar || null,
        packageName: o.packageName || null,
        total_amount: Number(o.total_amount),
        platform_fee: Number(o.platform_fee),
        seller_earnings: Number(o.seller_earnings),
      }));
      setOrders(mapped);
    } catch {
      showToast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}/login?type=tasker`); return; }
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchOrders(user.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // Stats
  const stats = {
    needsAction: orders.filter(o => ['pending', 'revision_requested'].includes(o.status)).length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalEarnings: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.seller_earnings, 0),
    pendingEarnings: orders.filter(o => ['pending', 'in_progress', 'delivered', 'revision_requested'].includes(o.status)).reduce((s, o) => s + o.seller_earnings, 0),
  };

  const filtered = orders.filter(o => {
    const tab = STATUS_TABS.find(t => t.id === activeTab);
    if (tab && tab.statuses.length && !tab.statuses.includes(o.status)) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.gigTitle.toLowerCase().includes(q) ||
        o.order_number.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q);
    }
    return true;
  });

  const openDrawer = async (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
    setShowDeliveryForm(false);
    // Fetch full order details
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.order) {
          setSelectedOrder(prev => prev ? {
            ...prev,
            ...json.order,
            gigTitle: json.order.gigTitle || prev.gigTitle,
            customerName: json.order.customerName || prev.customerName,
            total_amount: Number(json.order.total_amount),
            platform_fee: Number(json.order.platform_fee),
            seller_earnings: Number(json.order.seller_earnings),
          } : null);
        }
      }
    } catch { /* keep shallow data */ }
  };

  const handleAccept = async (orderId: string) => {
    if (!user) return;
    setActionLoading(orderId + '_accept');
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: 'in_progress' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      showToast.success('Order accepted! You can now start working.');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'in_progress' } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: 'in_progress' } : null);
    } catch (e: any) {
      showToast.error(e.message || 'Failed to accept order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (message: string, attachments: string[]) => {
    if (!user || !selectedOrder) return;
    setActionLoading(selectedOrder.id + '_deliver');
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, message, attachments }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      showToast.success('Work delivered successfully!');
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'delivered' } : o));
      setSelectedOrder(prev => prev ? { ...prev, status: 'delivered' } : null);
      setShowDeliveryForm(false);
    } catch (e: any) {
      showToast.error(e.message || 'Failed to deliver work');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-green mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} total orders</p>
        </div>
        <button
          onClick={() => { hasFetched.current = false; if (user) fetchOrders(user.id); }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Needs Action</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.needsAction}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <PlayCircle className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-brand-green/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-brand-green" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Earned</span>
          </div>
          <p className="text-2xl font-bold text-brand-green">LKR {stats.totalEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending Pay</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">LKR {stats.pendingEarnings.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-gray-100 overflow-x-auto">
          {STATUS_TABS.map(tab => {
            const count = tab.statuses.length
              ? orders.filter(o => tab.statuses.includes(o.status)).length
              : orders.length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-green text-brand-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-xs font-semibold ${
                    activeTab === tab.id ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders, gigs, customers..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-gray-50"
            />
          </div>
        </div>

        {/* Orders Table */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try a different search term' : 'Orders will appear here once customers place them'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-50 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Order</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Deadline</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Earnings</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(order => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      ['pending', 'revision_requested'].includes(order.status) ? 'bg-yellow-50/30' : ''
                    }`}
                  >
                    {/* Order */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {order.gigImage ? (
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={order.gigImage} alt={order.gigTitle} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{order.gigTitle}</p>
                          <p className="text-xs text-gray-400 mt-0.5">#{order.order_number} · <span className="capitalize">{order.package_tier}</span></p>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-green text-xs font-bold">
                            {order.customerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700 truncate max-w-[130px]">{order.customerName}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </td>

                    {/* Deadline */}
                    <td className="px-4 py-4">
                      {order.delivery_date ? (
                        <DeadlinePill deliveryDate={order.delivery_date} status={order.status} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Earnings */}
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-brand-green">LKR {order.seller_earnings.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">of LKR {order.total_amount.toLocaleString()}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleAccept(order.id)}
                            disabled={actionLoading === order.id + '_accept'}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 disabled:opacity-60 transition-colors"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            {actionLoading === order.id + '_accept' ? 'Accepting...' : 'Accept'}
                          </button>
                        )}
                        {order.status === 'revision_requested' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-lg border border-orange-200">
                            <RotateCcw className="h-3.5 w-3.5" /> Revision
                          </span>
                        )}
                <button
                  onClick={() => router.push(`/${locale}/seller/dashboard/orders/${order.id}`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      {drawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => { setDrawerOpen(false); setShowDeliveryForm(false); }}
          />
          {/* Panel */}
          <div className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Order #{selectedOrder.order_number}</p>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5 truncate max-w-[300px]">{selectedOrder.gigTitle}</h2>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={selectedOrder.status} size="sm" />
                <button
                  onClick={() => { setDrawerOpen(false); setShowDeliveryForm(false); }}
                  className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-500 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* Customer + Package */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Customer</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-brand-green/10 flex items-center justify-center">
                      <span className="text-brand-green text-sm font-bold">{selectedOrder.customerName.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{selectedOrder.customerName}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Package</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{selectedOrder.package_tier}</p>
                  {selectedOrder.packageName && (
                    <p className="text-xs text-gray-500 mt-0.5">{selectedOrder.packageName}</p>
                  )}
                </div>
              </div>

              {/* Financials */}
              <div className="bg-gradient-to-br from-brand-green/5 to-brand-green/10 rounded-xl p-4 border border-brand-green/20">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Financials</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Value</span>
                    <span className="font-semibold">LKR {selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Platform Fee (15%)</span>
                    <span className="text-red-500">- LKR {selectedOrder.platform_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-brand-green/20 pt-2 mt-2">
                    <span className="font-bold text-gray-900">Your Earnings</span>
                    <span className="font-bold text-brand-green text-base">LKR {selectedOrder.seller_earnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deadline */}
              {selectedOrder.delivery_date && (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Delivery Deadline</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedOrder.delivery_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <DeadlinePill deliveryDate={selectedOrder.delivery_date} status={selectedOrder.status} />
                </div>
              )}

              {/* Requirements */}
              {selectedOrder.requirements_response && Object.keys(selectedOrder.requirements_response).length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Customer Requirements</p>
                  <div className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-100">
                    {Object.entries(selectedOrder.requirements_response).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs font-semibold text-blue-700">{key}</p>
                        <p className="text-sm text-gray-700 mt-0.5">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliveries */}
              {selectedOrder.deliveries && selectedOrder.deliveries.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
                    Deliveries ({selectedOrder.deliveries.length})
                  </p>
                  <div className="space-y-3">
                    {selectedOrder.deliveries.map((d: any, i: number) => (
                      <div key={d.id || i} className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-purple-700">Delivery #{i + 1}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(d.delivered_at).toLocaleDateString()}
                          </span>
                        </div>
                        {d.message && <p className="text-sm text-gray-700">{d.message}</p>}
                        {d.attachments?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {d.attachments.map((url: string, j: number) => (
                              <a key={j} href={url} target="_blank" rel="noopener noreferrer"
                                className="block text-xs text-brand-green hover:underline truncate">
                                📎 Attachment {j + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revisions */}
              {selectedOrder.revisions && selectedOrder.revisions.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
                    Revision Requests ({selectedOrder.revisions.length})
                  </p>
                  <div className="space-y-3">
                    {selectedOrder.revisions.map((r: any, i: number) => (
                      <div key={r.id || i} className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-orange-700 capitalize">{r.status}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{r.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Form */}
              {showDeliveryForm && user && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Submit Delivery</p>
                  <DeliveryUploader
                    orderId={selectedOrder.id}
                    sellerId={user.id}
                    onSubmit={handleDeliver}
                    onCancel={() => setShowDeliveryForm(false)}
                  />
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 space-y-2">
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => handleAccept(selectedOrder.id)}
                  disabled={actionLoading === selectedOrder.id + '_accept'}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 disabled:opacity-60 transition-colors"
                >
                  <PlayCircle className="h-5 w-5" />
                  {actionLoading === selectedOrder.id + '_accept' ? 'Accepting...' : 'Accept & Start Order'}
                </button>
              )}
              {(selectedOrder.status === 'in_progress' || selectedOrder.status === 'revision_requested') && !showDeliveryForm && (
                <button
                  onClick={() => setShowDeliveryForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 transition-colors"
                >
                  <Truck className="h-5 w-5" />
                  Deliver Work
                </button>
              )}
              {selectedOrder.status === 'revision_requested' && (
                <p className="text-center text-sm text-orange-600 font-medium bg-orange-50 rounded-lg py-2 px-4 border border-orange-100">
                  <RotateCcw className="h-4 w-4 inline mr-1" />
                  Customer requested a revision — please re-deliver
                </p>
              )}
              <button
                onClick={() => router.push(`/${locale}/seller/dashboard/orders/${selectedOrder.id}`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                <ArrowUpRight className="h-4 w-4" />
                Open Full Order Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
