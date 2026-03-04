'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import {
  ArrowLeft, Clock, CheckCircle, Package, RefreshCw, XCircle,
  AlertCircle, PlayCircle, Truck, RotateCcw, DollarSign,
  User, Calendar, FileText, ChevronRight, Download, Paperclip,
  MessageSquare, Send, AlertTriangle, Star, TrendingUp, Ban
} from 'lucide-react';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import DeliveryUploader from '@/components/DeliveryUploader';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';

/* ─── Types ──────────────────────────────────────────────────────────── */
interface Requirement {
  id: string;
  question: string;
  answer_type: string;
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
}

interface Delivery {
  id: string;
  message: string | null;
  attachments: string[];
  delivered_at: string;
}

interface Revision {
  id: string;
  requested_by: string;
  message: string;
  status: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  package_tier: string;
  total_amount: number;
  platform_fee: number;
  seller_earnings: number;
  delivery_date: string;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  requirements_response: Record<string, any>;
  gigTitle: string;
  gigImage: string | null;
  gigSlug: string | null;
  gigCategory: string | null;
  customerName: string;
  customerEmail: string | null;
  customerUserId: string | null;
  customerAvatar: string | null;
  sellerName: string;
  sellerLevel: string | null;
  packageName: string | null;
  deliveries: Delivery[];
  revisions: Revision[];
  gig: {
    id: string;
    title: string;
    images: string[];
    requirements: Requirement[];
  } | null;
  package: {
    id: string;
    name: string;
    tier: string;
    price: number;
    delivery_days: number;
    revisions: number;
    features: any;
    description: string | null;
  } | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function getDaysUntilDeadline(deliveryDate: string) {
  const diff = Math.ceil((new Date(deliveryDate).getTime() - Date.now()) / 86400000);
  return diff;
}

function DeadlineBanner({ deliveryDate, status }: { deliveryDate: string; status: string }) {
  if (['completed', 'cancelled'].includes(status)) return null;
  const days = getDaysUntilDeadline(deliveryDate);
  if (days < 0) return (
    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>Overdue by {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''} — deliver immediately</span>
    </div>
  );
  if (days === 0) return (
    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>Due today — last chance to deliver on time</span>
    </div>
  );
  if (days <= 2) return (
    <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm font-semibold">
      <Clock className="h-4 w-4 flex-shrink-0" />
      <span>{days} day{days !== 1 ? 's' : ''} left until deadline</span>
    </div>
  );
  return null;
}

const TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: FileText, color: 'bg-green-100 text-green-600' },
  { key: 'accepted', label: 'Accepted', icon: PlayCircle, color: 'bg-blue-100 text-blue-600' },
  { key: 'delivered', label: 'Delivered', icon: Truck, color: 'bg-purple-100 text-purple-600' },
  { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-brand-green/10 text-brand-green' },
];

function statusToStep(status: string): number {
  if (status === 'pending') return 0;
  if (status === 'in_progress' || status === 'revision_requested') return 1;
  if (status === 'delivered') return 2;
  if (status === 'completed') return 3;
  return 0;
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const hasFetched = useRef(false);
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  useEffect(() => {
    params.then(({ id }) => setOrderId(id));
  }, [params]);

  const fetchOrder = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.status === 404) {
        setError('Order not found');
        setTimeout(() => routerRef.current.push(`/${locale}/seller/dashboard/orders`), 2000);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch order');
      const json = await res.json();
      const d = json.order;
      if (!d) throw new Error('No order data');
      setOrder({
        ...d,
        gigTitle: d.gigTitle || d.gig?.title || 'Unknown Gig',
        gigImage: d.gigImage || d.gig?.images?.[0] || null,
        customerName: d.customerName || 'Unknown Customer',
        customerUserId: d.customer?.user?.id || null,
        total_amount: Number(d.total_amount),
        platform_fee: Number(d.platform_fee),
        seller_earnings: Number(d.seller_earnings || (d.total_amount - d.platform_fee)),
        deliveries: d.deliveries || [],
        revisions: d.revisions || [],
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load order');
      setTimeout(() => routerRef.current.push(`/${locale}/seller/dashboard/orders`), 2500);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}/login`); return; }
    if (!orderId) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchOrder(orderId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, orderId]);

  const reload = () => { if (orderId) fetchOrder(orderId); };

  /* ── Actions ── */
  const handleAccept = async () => {
    if (!user || !order) return;
    setActionLoading('accept');
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: 'in_progress' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      showToast.success('Order accepted! Start working on it now.');
      reload();
    } catch (e: any) {
      showToast.error(e.message || 'Failed to accept order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (message: string, attachments: string[]) => {
    if (!user || !order) return;
    setActionLoading('deliver');
    try {
      const res = await fetch(`/api/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, message, attachments }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      showToast.success('Work delivered successfully! Waiting for customer approval.');
      setShowDeliveryForm(false);
      reload();
    } catch (e: any) {
      showToast.error(e.message || 'Failed to deliver work');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 20 || !user || !order) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: 'cancelled', cancellationReason: cancelReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      showToast.success('Order cancelled.');
      setShowCancelModal(false);
      setCancelReason('');
      reload();
    } catch (e: any) {
      showToast.error(e.message || 'Failed to cancel order');
    } finally {
      setCancelLoading(false);
    }
  };

  /* ── Loading / Error ── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4" />
        <p className="text-gray-500">Loading order details...</p>
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">{error || 'Order not found'}</h2>
        <p className="text-gray-500 mb-4 text-sm">Redirecting back to orders...</p>
        <button onClick={() => router.push(`/${locale}/seller/dashboard/orders`)}
          className="text-brand-green font-semibold hover:underline text-sm">
          Go back now
        </button>
      </div>
    </div>
  );

  const currentStep = statusToStep(order.status);
  const requirements: Requirement[] = order.gig?.requirements || [];
  const canDeliver = order.status === 'in_progress' || order.status === 'revision_requested';
  const isRevision = order.status === 'revision_requested';

  return (
    <>
    <div className="space-y-6 max-w-6xl">

      {/* ── Back + Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${locale}/seller/dashboard/orders`)}
            className="h-9 w-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{order.gigTitle}</h1>
              <OrderStatusBadge status={order.status as any} size="sm" />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Order #{order.order_number} &middot; Placed {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <button onClick={reload} className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* ── Deadline Alert ── */}
      {order.delivery_date && (
        <DeadlineBanner deliveryDate={order.delivery_date} status={order.status} />
      )}

      {/* ── Revision Notice ── */}
      {isRevision && order.revisions.length > 0 && (
        <div className="flex items-start gap-3 px-5 py-4 bg-orange-50 border border-orange-200 rounded-xl">
          <RotateCcw className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-orange-800">Revision Requested</p>
            <p className="text-sm text-orange-700 mt-0.5">
              {order.revisions[order.revisions.length - 1]?.message}
            </p>
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Progress Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Order Progress</h2>
            <div className="relative">
              {/* connector line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100" style={{ zIndex: 0 }} />
              <div
                className="absolute top-5 left-5 h-0.5 bg-brand-green transition-all duration-500"
                style={{ width: `${(currentStep / (TIMELINE_STEPS.length - 1)) * (100 - (100 / TIMELINE_STEPS.length))}%`, zIndex: 1 }}
              />
              <div className="relative flex justify-between z-10">
                {TIMELINE_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const done = i <= currentStep;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-2">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        done ? 'bg-brand-green shadow-md shadow-brand-green/20' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${done ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <span className={`text-xs font-medium text-center leading-tight max-w-[64px] ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dates row */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Order Date</p>
                <p className="text-xs font-semibold text-gray-900">
                  {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Deadline</p>
                <p className={`text-xs font-semibold ${getDaysUntilDeadline(order.delivery_date) <= 1 && !['completed','cancelled'].includes(order.status) ? 'text-red-600' : 'text-gray-900'}`}>
                  {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Revisions</p>
                <p className="text-xs font-semibold text-gray-900">
                  {order.revisions.length} requested{order.package?.revisions != null ? ` / ${order.package.revisions} allowed` : ''}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Deliveries</p>
                <p className="text-xs font-semibold text-gray-900">{order.deliveries.length} submitted</p>
              </div>
            </div>
          </div>

          {/* Customer Requirements */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900">Customer Requirements</h2>
            </div>
            {requirements.length === 0 && Object.keys(order.requirements_response).length === 0 ? (
              <div className="text-center py-6">
                <FileText className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No requirements were specified for this order.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requirements.length > 0
                  ? requirements
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((req, i) => {
                        const answer = order.requirements_response[req.id];
                        return (
                          <div key={req.id} className="rounded-xl border border-gray-100 overflow-hidden">
                            <div className="flex items-start gap-3 bg-gray-50 px-4 py-3">
                              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">
                                {i + 1}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{req.question}</p>
                                <p className="text-xs text-gray-400 mt-0.5 capitalize">
                                  {req.answer_type} {req.is_required ? '· Required' : '· Optional'}
                                </p>
                              </div>
                            </div>
                            <div className="px-4 py-3 bg-white">
                              {answer !== undefined && answer !== '' ? (
                                <p className="text-sm text-gray-900 font-medium">{String(answer)}</p>
                              ) : (
                                <p className="text-sm text-gray-400 italic">No answer provided</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                  : Object.entries(order.requirements_response).map(([key, val], i) => (
                      <div key={key} className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3">
                          <p className="text-xs text-gray-400 font-mono">{key}</p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-sm text-gray-900 font-medium">{String(val)}</p>
                        </div>
                      </div>
                    ))
                }
              </div>
            )}
          </div>

          {/* Deliveries History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-purple-500" />
                <h2 className="text-sm font-semibold text-gray-900">Delivery History</h2>
                {order.deliveries.length > 0 && (
                  <span className="inline-flex items-center justify-center h-5 w-5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                    {order.deliveries.length}
                  </span>
                )}
              </div>
              {canDeliver && !showDeliveryForm && (
                <button
                  onClick={() => setShowDeliveryForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-xl hover:bg-brand-green/90 transition-colors shadow-sm"
                >
                  <Send className="h-4 w-4" />
                  {isRevision ? 'Re-deliver Work' : 'Deliver Work'}
                </button>
              )}
            </div>

            {/* Delivery Upload Form */}
            {showDeliveryForm && user && (
              <div className="mb-6 border-2 border-brand-green/20 rounded-2xl p-5 bg-brand-green/5">
                <div className="flex items-center gap-2 mb-4">
                  <Send className="h-5 w-5 text-brand-green" />
                  <h3 className="font-semibold text-gray-900">
                    {isRevision ? 'Submit Revised Work' : 'Submit Your Delivery'}
                  </h3>
                </div>
                {isRevision && order.revisions.length > 0 && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
                    <p className="font-semibold mb-1">Revision note from customer:</p>
                    <p>{order.revisions[order.revisions.length - 1]?.message}</p>
                  </div>
                )}
                <DeliveryUploader
                  orderId={order.id}
                  sellerId={user.id}
                  onSubmit={handleDeliver}
                  onCancel={() => setShowDeliveryForm(false)}
                />
              </div>
            )}

            {order.deliveries.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                <Truck className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400">No deliveries yet</p>
                {canDeliver && (
                  <p className="text-xs text-gray-400 mt-1">Click "Deliver Work" above to submit your files</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {order.deliveries.map((delivery, i) => (
                  <div key={delivery.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-700">{order.deliveries.length - i}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          Delivery #{order.deliveries.length - i}
                        </span>
                        {i === 0 && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">Latest</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(delivery.delivered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="p-4">
                      {delivery.message && (
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">{delivery.message}</p>
                      )}
                      {delivery.attachments?.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {delivery.attachments.length} Attachment{delivery.attachments.length !== 1 ? 's' : ''}
                          </p>
                          {delivery.attachments.map((url, j) => {
                            const filename = url.split('/').pop()?.split('?')[0] || `file-${j + 1}`;
                            return (
                              <a key={j} href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-brand-green/40 hover:bg-brand-green/5 transition-colors group">
                                <div className="h-9 w-9 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                                  <Paperclip className="h-4 w-4 text-brand-green" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
                                  <p className="text-xs text-gray-400">Click to download</p>
                                </div>
                                <Download className="h-4 w-4 text-gray-400 group-hover:text-brand-green transition-colors" />
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No attachments</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revision History */}
          {order.revisions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <RotateCcw className="h-5 w-5 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-900">Revision Requests</h2>
                <span className="inline-flex items-center justify-center h-5 w-5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                  {order.revisions.length}
                </span>
              </div>
              <div className="space-y-3">
                {order.revisions.map((rev, i) => (
                  <div key={rev.id} className="flex gap-3">
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <RotateCcw className="h-4 w-4 text-orange-600" />
                      </div>
                      {i < order.revisions.length - 1 && (
                        <div className="flex-1 w-0.5 bg-gray-100 mt-1" style={{ minHeight: '20px' }} />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">Revision #{i + 1}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          rev.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                        }`}>{rev.status}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                        <p className="text-sm text-gray-700 leading-relaxed">{rev.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="space-y-5">

          {/* Primary Action Card */}
          {(order.status === 'pending' || canDeliver) && (
            <div className={`rounded-2xl p-5 border-2 ${
              order.status === 'pending'
                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                : isRevision
                ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
                : 'bg-gradient-to-br from-green-50 to-brand-green/10 border-brand-green/30'
            }`}>
              {order.status === 'pending' && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-bold text-gray-900">New Order Waiting</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Accept this order to begin working. The customer is waiting for your confirmation.
                  </p>
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading === 'accept'}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green/90 disabled:opacity-60 transition-colors shadow-sm"
                  >
                    <PlayCircle className="h-5 w-5" />
                    {actionLoading === 'accept' ? 'Accepting...' : 'Accept & Start Order'}
                  </button>
                </>
              )}
              {canDeliver && !showDeliveryForm && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    {isRevision
                      ? <RotateCcw className="h-5 w-5 text-orange-600" />
                      : <Truck className="h-5 w-5 text-brand-green" />
                    }
                    <h3 className="font-bold text-gray-900">
                      {isRevision ? 'Submit Revised Work' : 'Ready to Deliver?'}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {isRevision
                      ? 'The customer has requested changes. Review their feedback and re-submit your work.'
                      : 'Upload your completed files and a message to the customer.'
                    }
                  </p>
                  <button
                    onClick={() => setShowDeliveryForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green/90 transition-colors shadow-sm"
                  >
                    <Send className="h-5 w-5" />
                    {isRevision ? 'Re-deliver Work' : 'Deliver Work'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Awaiting Customer */}
          {order.status === 'delivered' && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-gray-900">Awaiting Approval</h3>
              </div>
              <p className="text-sm text-gray-600">
                Your work has been delivered. Waiting for the customer to review and approve or request revisions.
              </p>
            </div>
          )}

          {/* Cancelled state */}
          {order.status === 'cancelled' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-bold text-gray-900">Order Cancelled</h3>
              </div>
              <p className="text-sm text-gray-600">
                This order was cancelled
                {order.cancelled_at && ` on ${new Date(order.cancelled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}.
              </p>
              {order.cancellation_reason && (
                <p className="text-sm text-red-700 mt-2 bg-red-100 rounded-lg px-3 py-2">
                  <span className="font-semibold">Reason:</span> {order.cancellation_reason}
                </p>
              )}
            </div>
          )}

          {/* Cancel Order button — only for cancellable statuses */}
          {(order.status === 'pending' || order.status === 'in_progress') && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors"
            >
              <Ban className="h-4 w-4" />
              Cancel Order
            </button>
          )}

          {/* Completed */}
          {order.status === 'completed' && (
            <div className="bg-gradient-to-br from-green-50 to-brand-green/10 border-2 border-brand-green/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-brand-green" />
                <h3 className="font-bold text-gray-900">Order Completed!</h3>
              </div>
              <p className="text-sm text-gray-600">
                Great work! The customer has approved your delivery.
                {order.completed_at && ` Completed on ${new Date(order.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`}
              </p>
            </div>
          )}

          {/* Earnings Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-brand-green" />
              <h3 className="text-sm font-semibold text-gray-900">Earnings Breakdown</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Order Value</span>
                <span className="text-sm font-semibold text-gray-900">LKR {order.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Platform Fee (15%)</span>
                <span className="text-sm font-semibold text-red-500">- LKR {order.platform_fee.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Your Earnings</span>
                <span className="text-lg font-bold text-brand-green">LKR {order.seller_earnings.toLocaleString()}</span>
              </div>
              <div className={`text-xs px-3 py-2 rounded-lg font-medium text-center ${
                order.status === 'completed'
                  ? 'bg-green-50 text-green-700'
                  : order.status === 'cancelled'
                  ? 'bg-gray-50 text-gray-500'
                  : 'bg-yellow-50 text-yellow-700'
              }`}>
                {order.status === 'completed' ? '✓ Earnings released' :
                 order.status === 'cancelled' ? 'Order cancelled — no payout' :
                 'Held in escrow until completion'}
              </div>
            </div>
          </div>

          {/* Package Details */}
          {order.package && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-900">Package Details</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Package</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{order.package.tier}</span>
                </div>
                {order.package.name && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Name</span>
                    <span className="text-sm font-semibold text-gray-900">{order.package.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Delivery Time</span>
                  <span className="text-sm font-semibold text-gray-900">{order.package.delivery_days} day{order.package.delivery_days !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Revisions</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {order.package.revisions != null ? `${order.package.revisions}` : 'Unlimited'}
                  </span>
                </div>
                {order.package.description && (
                  <div className="pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500 leading-relaxed">{order.package.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Customer</h3>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-green/20 to-brand-green/10 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-green font-bold text-lg">
                  {order.customerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{order.customerName}</p>
                {order.customerEmail && (
                  <p className="text-xs text-gray-400 truncate">{order.customerEmail}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                if (order.customerUserId) {
                  router.push(`/${locale}/seller/dashboard/messages?recipientId=${order.customerUserId}`);
                }
              }}
              disabled={!order.customerUserId}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl border border-blue-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MessageSquare className="h-4 w-4" />
              Message Customer
            </button>
          </div>

          {/* Gig Image */}
          {order.gigImage && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative h-40 w-full">
                <Image src={order.gigImage} alt={order.gigTitle} fill className="object-cover" />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">{order.gigTitle}</p>
                {order.gigCategory && (
                  <p className="text-xs text-gray-400 mt-1 capitalize">{order.gigCategory.replace('-', ' ')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ── Cancel Order Modal ── */}

    {showCancelModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Cancel Order</h2>
                <p className="text-xs text-gray-500">Order #{order?.order_number}</p>
              </div>
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-5">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-relaxed">
                <span className="font-bold">Warning:</span> Cancelling this order will negatively affect your seller rating and increment your cancellation count.
              </p>
            </div>

            {/* Reason textarea */}
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              placeholder="Explain why you are cancelling this order (min. 20 characters)..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 resize-none"
            />
            <div className="flex justify-between items-center mt-1 mb-5">
              <p className="text-xs text-gray-400">Minimum 20 characters required</p>
              <p className={`text-xs font-medium ${cancelReason.trim().length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                {cancelReason.trim().length}/20
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                disabled={cancelLoading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading || cancelReason.trim().length < 20}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
