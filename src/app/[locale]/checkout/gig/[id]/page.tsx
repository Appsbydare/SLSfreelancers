'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, CreditCard, Shield, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function GigCheckoutPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Order details from session storage
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [gigDetails, setGigDetails] = useState<any>(null);
  const [packageDetails, setPackageDetails] = useState<any>(null);
  const [gigId, setGigId] = useState<string>('');
  const [locale, setLocale] = useState<string>('en');

  // User info
  const { user, isLoading: authLoading } = useAuth();

  // Payment info (for demo purposes)
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    params.then(({ id, locale }) => {
      setGigId(id);
      setLocale(locale || 'en');
    });
  }, [params]);

  const loadCheckoutData = useCallback(async () => {
    if (authLoading) return; // Wait until auth is resolved

    try {
      if (!user) {
        setLoading(false);
        router.push(`/${locale}/login?redirect=/${locale}/checkout/gig/${gigId}`);
        return;
      }

      // Get pending order from session storage (may be null if navigating directly)
      const pendingOrderStr = sessionStorage.getItem('pendingOrder');
      const pendingOrder = pendingOrderStr ? JSON.parse(pendingOrderStr) : null;
      if (pendingOrder) {
        setOrderDetails(pendingOrder);
      }

      // Fetch gig details regardless of pendingOrder
      const gigResponse = await fetch(`/api/gigs/${gigId}`);
      if (!gigResponse.ok) {
        const text = await gigResponse.text();
        setError(`Failed to fetch gig. Status: ${gigResponse.status}. Response: ${text}`);
      } else {
        const gigData = await gigResponse.json();
        setGigDetails(gigData.gig);

        let selectedPkg: any = null;

        if (pendingOrder) {
          // Try to find the exact package by ID
          selectedPkg = gigData.gig?.packages?.find(
            (pkg: any) => pkg.id === pendingOrder.packageId
          );
          // Fallback by tier name if package was re-created
          if (!selectedPkg && pendingOrder.packageTier) {
            selectedPkg = gigData.gig?.packages?.find(
              (pkg: any) => pkg.tier === pendingOrder.packageTier
            );
          }
        }

        // Ultimate fallback: always select the first available package
        if (!selectedPkg && gigData.gig?.packages?.length > 0) {
          selectedPkg = gigData.gig.packages[0];
        }

        setPackageDetails(selectedPkg);
      }
    } catch (err: any) {
      console.error('Error loading checkout data:', err);
      setError(`Exception: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  }, [gigId, router]);

  useEffect(() => {
    if (gigId && !authLoading) {
      loadCheckoutData();
    }
  }, [gigId, authLoading, loadCheckoutData]);

  const calculateTotalAmount = () => {
    if (!packageDetails) return 0;
    return parseFloat(packageDetails.price);
  };

  const calculatePlatformFee = () => {
    const total = calculateTotalAmount();
    return total * 0.15; // 15% platform fee
  };

  const handlePlaceOrder = async () => {
    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardDetails.name || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
        setError('Please fill in all credit card details');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          gigId: gigId,
          packageId: orderDetails.packageId,
          requirementsResponse: orderDetails.requirementsResponse || {},
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Clear pending order from session storage
        sessionStorage.removeItem('pendingOrder');

        // Redirect to order confirmation/workspace
        router.push(`/orders/${data.order.id}?new=true`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!gigDetails || !packageDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout Error</h1>
          <p className="text-gray-600 mb-4 max-w-xl text-left border p-4 bg-gray-100 rounded text-sm overflow-auto max-h-96">
            Unable to load order details. Details: <br />
            {JSON.stringify({
              hasGigDetails: !!gigDetails,
              hasPackageDetails: !!packageDetails,
              errorDesc: error,
              gigId,
              pendingOrder: orderDetails,
              selectedPkgTier: packageDetails?.tier,
              rawGigData: (window as any)._debugGigData || null,
            }, null, 2)}
          </p>
          <button
            onClick={() => router.push('/browse-gigs')}
            className="text-brand-green hover:underline font-semibold mt-4"
          >
            Return to Browse Gigs
          </button>
        </div>
      </div>
    );
  }

  if (!gigId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const totalAmount = calculateTotalAmount();
  const platformFee = calculatePlatformFee();
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + packageDetails.delivery_days);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="flex items-start space-x-4">
                {gigDetails.images && gigDetails.images[0] && (
                  <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={gigDetails.images[0]}
                      alt={gigDetails.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{gigDetails.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    by {gigDetails.sellerName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Package: <span className="font-medium capitalize">{packageDetails.tier}</span>
                  </p>
                </div>
              </div>

              {/* Package Features */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Package Includes:</h4>
                <ul className="space-y-2">
                  {packageDetails.features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start text-sm text-gray-700">
                      <Check className="h-4 w-4 text-brand-green mr-2 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="h-4 w-4 text-brand-green mr-2 flex-shrink-0 mt-0.5" />
                    {packageDetails.delivery_days} day delivery
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <Check className="h-4 w-4 text-brand-green mr-2 flex-shrink-0 mt-0.5" />
                    {packageDetails.revisions === null ? 'Unlimited' : packageDetails.revisions} revision{packageDetails.revisions !== 1 ? 's' : ''}
                  </li>
                </ul>
              </div>
            </div>

            {/* Payment Protection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Payment Protection
                  </h3>
                  <p className="text-sm text-blue-800">
                    Your payment is held securely until the work is delivered and approved.
                    If you&apos;re not satisfied, you can request revisions or get a refund according
                    to our terms and conditions.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>

              <div className="space-y-4">
                <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-brand-green bg-brand-green/5' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300"
                    />
                    <div className="ml-3 flex items-center">
                      <CreditCard className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="font-medium text-gray-900">Credit / Debit Card</span>
                    </div>
                  </div>
                </label>

                {paymentMethod === 'card' && (
                  <div className="pl-8 pr-4 py-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={e => setCardDetails({ ...cardDetails, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                        placeholder="Name on card"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardDetails.number}
                        onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'border-brand-green bg-brand-green/5' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300"
                    />
                    <div className="ml-3 flex items-center">
                      <span className="font-medium text-gray-900">PayPal</span>
                    </div>
                  </div>
                </label>

                {paymentMethod === 'paypal' && (
                  <div className="pl-8 py-2 text-sm text-gray-600 animate-in fade-in">
                    You will be redirected to PayPal to complete your purchase securely.
                  </div>
                )}
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-5 w-5 text-brand-green focus:ring-brand-green border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-brand-green hover:underline">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" className="text-brand-green hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
          </div>

          {/* Order Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Package Price</span>
                  <span className="font-semibold text-gray-900">
                    LKR {totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service Fee (15%)</span>
                  <span className="font-semibold text-gray-900">
                    LKR {platformFee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-brand-green">
                    LKR {(totalAmount + platformFee).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Delivery</h4>
                <p className="text-sm text-gray-700">
                  Expected by: <span className="font-semibold">{deliveryDate.toLocaleDateString()}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {packageDetails.delivery_days} day{packageDetails.delivery_days !== 1 ? 's' : ''} delivery time
                </p>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={submitting || !agreedToTerms}
                className="w-full bg-brand-green text-white py-4 px-6 rounded-lg hover:bg-brand-green/90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  `Place Order (LKR ${(totalAmount + platformFee).toLocaleString()})`
                )}
              </button>

              {/* Payment Methods Note */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Secure payment processing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

