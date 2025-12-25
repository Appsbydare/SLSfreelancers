'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, MessageCircle, Package, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import DeliveryUploader from '@/components/DeliveryUploader';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewOrder = searchParams.get('new') === 'true';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'delivery'>('details');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    params.then(({ id }) => {
      setOrderId(id);
    });
  }, [params]);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      setUser(JSON.parse(userStr));

      // Fetch order details
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        console.error('Order not found');
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverWork = async (message: string, attachments: string[]) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          message,
          attachments,
        }),
      });

      if (response.ok) {
        setShowDeliveryForm(false);
        loadOrderData(); // Reload order data
      } else {
        throw new Error('Failed to deliver work');
      }
    } catch (error) {
      console.error('Delivery error:', error);
      throw error;
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionMessage.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/revisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          message: revisionMessage.trim(),
        }),
      });

      if (response.ok) {
        setRevisionMessage('');
        loadOrderData(); // Reload order data
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to request revision');
      }
    } catch (error) {
      console.error('Revision request error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm('Mark this order as complete? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          status: 'completed',
        }),
      });

      if (response.ok) {
        loadOrderData(); // Reload order data
        router.push(`/orders/${orderId}?review=true`);
      } else {
        throw new Error('Failed to complete order');
      }
    } catch (error) {
      console.error('Complete order error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleAcceptOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          status: 'in_progress',
        }),
      });

      if (response.ok) {
        loadOrderData();
      } else {
        throw new Error('Failed to accept order');
      }
    } catch (error) {
      console.error('Accept order error:', error);
      alert('An error occurred. Please try again.');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h1>
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
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'details'
                        ? 'border-brand-green text-brand-green'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('delivery')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'delivery'
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
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full ${
                              order.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                            } flex items-center justify-center`}>
                              <CheckCircle className={`h-5 w-5 ${
                                order.status === 'completed' ? 'text-green-600' : 'text-gray-400'
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

                    {showDeliveryForm && (
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
                <div className="flex items-center space-x-3">
                  <div className="relative h-12 w-12">
                    <div className="h-12 w-12 rounded-full bg-brand-green/10 flex items-center justify-center">
                      <span className="text-brand-green text-lg font-semibold">
                        {isSeller 
                          ? order.customerName?.charAt(0) 
                          : order.sellerName?.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {isSeller ? order.customerName : order.sellerName}
                    </p>
                    {!isSeller && (
                      <p className="text-sm text-gray-600">
                        {order.sellerLevel?.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                </div>
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

