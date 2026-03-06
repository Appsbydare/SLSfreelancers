'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Package, CheckCircle, MessageSquare, RotateCcw } from 'lucide-react';
import { useLocale } from 'next-intl';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import DeliveryUploader from '@/components/DeliveryUploader';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isNewOrder = searchParams.get('new') === 'true';
  const { user, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'delivery'>('details');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const hasFetched = useRef(false);
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);

  useEffect(() => {
    params.then(({ id }) => setOrderId(id));
  }, [params]);

  const fetchOrder = useCallback(async (id: string) => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.status === 404) {
        setLoadError('Order not found');
        setLoading(false);
        setTimeout(() => routerRef.current.push('/orders'), 2000);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch order');
      const json = await res.json();
      const data = json.order;
      if (data) {
        setOrder({
          ...data,
          gigTitle: data.gigTitle || data.gig?.title || 'Unknown Gig',
          gigImage: data.gigImage || data.gig?.images?.[0] || null,
          sellerName: data.sellerName || (data.seller?.user ? `${data.seller.user.first_name} ${data.seller.user.last_name}` : 'Unknown Seller'),
          customerName: data.customerName || (data.customer?.user ? `${data.customer.user.first_name} ${data.customer.user.last_name}` : 'Unknown Customer'),
          sellerLevel: data.sellerLevel || data.seller?.level_code || 'level_0',
          packageTier: data.package_tier,
          total_amount: Number(data.total_amount),
          platform_fee: Number(data.platform_fee),
        });
      } else {
        setLoadError('Order not found');
        setTimeout(() => routerRef.current.push('/orders'), 2000);
      }
    } catch (error: any) {
      console.error('Error loading order:', error);
      setLoadError('Failed to load order. Redirecting...');
      setTimeout(() => routerRef.current.push('/orders'), 2000);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetch once auth is resolved and we have the orderId
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!orderId) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchOrder(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, orderId]);

  const loadOrderData = useCallback(() => {
    if (orderId) fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  const handleDeliverWork = async (message: string, attachments: string[]) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, message, attachments }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to deliver work');
      setShowDeliveryForm(false);
      showToast.success('Work delivered successfully!');
      loadOrderData();
    } catch (error: any) {
      console.error('Delivery error:', error);
      showToast.error(error.message || 'Failed to deliver work');
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionMessage.trim() || !user) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, message: revisionMessage.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to request revision');
      setRevisionMessage('');
      showToast.success('Revision requested successfully!');
      loadOrderData();
    } catch (error: any) {
      console.error('Revision request error:', error);
      showToast.error(error.message || 'Failed to request revision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm('Mark this order as complete? This action cannot be undone.')) return;
    if (!user) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: 'completed' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to complete order');
      showToast.success('Order completed!');
      loadOrderData();
      router.push(`/orders/${orderId}?review=true`);
    } catch (error: any) {
      console.error('Complete order error:', error);
      showToast.error(error.message || 'Failed to complete order');
    }
  };

  const handleReorder = () => {
    if (!order) return;
    sessionStorage.setItem('pendingOrder', JSON.stringify({
      gigId: order.gig?.id || order.gig_id,
      packageId: order.package?.id || order.package_id,
      packageTier: order.packageTier || order.package_tier,
      requirementsResponse: order.requirements_response || {},
    }));
    router.push(`/${locale}/checkout/gig/${order.gig?.id || order.gig_id}`);
  };

  const handleAcceptOrder = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: 'in_progress' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to accept order');
      showToast.success('Order accepted!');
      loadOrderData();
    } catch (error: any) {
      console.error('Accept order error:', error);
      showToast.error(error.message || 'Failed to accept order');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {loadError || 'Order not found'}
          </h1>
          <button
            onClick={() => router.push('/orders')}
            className="text-brand-green hover:underline font-semibold"
          >
            View all orders
          </button>
        </div>
      </div>
    );
  }

  const isSeller = user && order.seller?.user?.id === user.id;
  const isCustomer = user && order.customer?.user?.id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/orders')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Orders
            </button>
            <OrderStatusBadge status={order.status} size="md" />
          </div>
        </div>
      </div>

      {/* New Order Success Message */}
      {isNewOrder && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Order Placed Successfully!</h3>
                <p className="text-sm text-green-700">
                  Order #{order.order_number} has been created. The seller will start working on your order soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start space-x-4">
                {order.gigImage && (
                  <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={order.gigImage}
                      alt={order.gigTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{order.gigTitle}</h1>
                  <p className="text-sm text-gray-600">
                    Order #{order.order_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    Package: <span className="font-medium capitalize">{order.packageTier}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details'
                      ? 'border-brand-green text-brand-green'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('delivery')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'delivery'
                      ? 'border-brand-green text-brand-green'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Delivery
                    {order.deliveries && order.deliveries.length > 0 && (
                      <span className="ml-2 bg-brand-green text-white text-xs rounded-full px-2 py-0.5">
                        {order.deliveries.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">Order Placed</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {order.status !== 'pending' && (
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">In Progress</p>
                              <p className="text-sm text-gray-500">Seller is working on your order</p>
                            </div>
                          </div>
                        )}

                        {order.delivery_date && (
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full ${order.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                              } flex items-center justify-center`}>
                              <CheckCircle className={`h-5 w-5 ${order.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                                }`} />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">Expected Delivery</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.delivery_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Requirements Response */}
                    {order.requirements_response && Object.keys(order.requirements_response).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Requirements</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          {Object.entries(order.requirements_response).map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <p className="text-sm font-medium text-gray-700">{key}:</p>
                              <p className="text-sm text-gray-600">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Tab */}
                {activeTab === 'delivery' && (
                  <div className="space-y-6">
                    {order.deliveries && order.deliveries.length > 0 ? (
                      order.deliveries.map((delivery: any) => (
                        <div key={delivery.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">Work Delivered</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(delivery.delivered_at).toLocaleString()}
                            </p>
                          </div>
                          {delivery.message && (
                            <p className="text-sm text-gray-700 mb-3">{delivery.message}</p>
                          )}
                          {delivery.attachments && delivery.attachments.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Attachments:</p>
                              {delivery.attachments.map((url: string, index: number) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-sm text-brand-green hover:underline"
                                >
                                  Download file {index + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No deliveries yet</p>
                      </div>
                    )}

                    {/* Seller Delivery Form */}
                    {isSeller && (order.status === 'in_progress' || order.status === 'revision_requested') && !showDeliveryForm && (
                      <button
                        onClick={() => setShowDeliveryForm(true)}
                        className="w-full bg-brand-green text-white py-3 px-4 rounded-lg hover:bg-brand-green/90 font-semibold"
                      >
                        Deliver Work
                      </button>
                    )}

                    {showDeliveryForm && user && (
                      <DeliveryUploader
                        orderId={order.id}
                        sellerId={user.id}
                        onSubmit={handleDeliverWork}
                        onCancel={() => setShowDeliveryForm(false)}
                      />
                    )}

                    {/* Customer Actions */}
                    {isCustomer && order.status === 'delivered' && (
                      <div className="space-y-3">
                        <button
                          onClick={handleMarkComplete}
                          className="w-full bg-brand-green text-white py-3 px-4 rounded-lg hover:bg-brand-green/90 font-semibold"
                        >
                          Accept & Complete Order
                        </button>

                        {/* Revision Request */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-900 mb-2">Request Revision</h4>
                          <textarea
                            value={revisionMessage}
                            onChange={(e) => setRevisionMessage(e.target.value)}
                            rows={3}
                            placeholder="Describe what needs to be changed..."
                            className="w-full border border-orange-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            onClick={handleRequestRevision}
                            disabled={submitting || !revisionMessage.trim()}
                            className="mt-2 w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 font-semibold disabled:opacity-50"
                          >
                            {submitting ? 'Requesting...' : 'Request Revision'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4 space-y-6">
              {/* Price Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Package Price</span>
                    <span className="font-semibold">LKR {order.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="font-semibold">LKR {order.platform_fee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold">
                    <span>Total Paid</span>
                    <span className="text-brand-green">
                      LKR {(order.total_amount + order.platform_fee).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isSeller ? 'Customer' : 'Seller'}
                </h3>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-green text-lg font-semibold">
                      {isSeller
                        ? order.customerName?.charAt(0)
                        : order.sellerName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {isSeller ? order.customerName : order.sellerName}
                    </p>
                    {!isSeller && order.sellerLevel && (
                      <p className="text-sm text-gray-500 capitalize">
                        {order.sellerLevel.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact button — customer contacts seller */}
                {isCustomer && order.seller?.user?.id && (
                  <button
                    onClick={() => router.push(
                      `/${locale}/customer/dashboard/messages?recipientId=${order.seller.user.id}`
                    )}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-lg border border-blue-200 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Contact Seller
                  </button>
                )}

                {/* Order Again button — shown after order is done */}
                {isCustomer && (order.status === 'completed' || order.status === 'cancelled') && (
                  <div className="mt-3">
                    <button
                      onClick={handleReorder}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-green text-white font-bold text-sm rounded-lg hover:bg-brand-green/90 transition-colors shadow-sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Order Again
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-1.5">Same package · Same requirements</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isSeller && order.status === 'pending' && (
                <button
                  onClick={handleAcceptOrder}
                  className="w-full bg-brand-green text-white py-3 px-4 rounded-lg hover:bg-brand-green/90 font-semibold"
                >
                  Accept Order & Start Working
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

