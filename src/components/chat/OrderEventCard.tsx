'use client';

import React from 'react';
import Link from 'next/link';
import { PackageCheck, ShoppingBag, Truck, Star, XCircle, ExternalLink } from 'lucide-react';

// Using a basic message interface structure
export interface EventMessage {
    created_at: string;
    event?: string;
    payload?: any;
    [key: string]: any;
}

export const OrderEventCard = ({ message, isSeller }: { message: EventMessage; isSeller: boolean }) => {
    const { event, payload } = message;
    if (!event || !payload) return null;

    const orderUrl = isSeller
        ? `/seller/dashboard/orders/${payload.order_id}`
        : `/orders/${payload.order_id}`;

    type CardConfig = { icon: React.ReactNode; title: string; subtitle: string; accent: string; bg: string; border: string; badgeText: string };

    const configs: Record<string, { seller: CardConfig; customer: CardConfig }> = {
        order_placed: {
            seller: {
                icon: <PackageCheck className="h-5 w-5 text-white" />,
                title: 'New Order Received!',
                subtitle: 'A customer has placed a new order. Review and accept it to start working.',
                accent: '#3b82f6',
                bg: 'from-blue-50 to-sky-50',
                border: 'border-blue-200',
                badgeText: 'Pending',
            },
            customer: {
                icon: <PackageCheck className="h-5 w-5 text-white" />,
                title: 'Order Placed',
                subtitle: 'Your order has been placed and is awaiting the seller\'s acceptance.',
                accent: '#3b82f6',
                bg: 'from-blue-50 to-sky-50',
                border: 'border-blue-200',
                badgeText: 'Pending',
            },
        },
        order_accepted: {
            seller: {
                icon: <ShoppingBag className="h-5 w-5 text-white" />,
                title: 'You Accepted This Order',
                subtitle: 'You\'ve started working on this order. Deliver on time!',
                accent: '#22c55e',
                bg: 'from-green-50 to-emerald-50',
                border: 'border-green-200',
                badgeText: 'In Progress',
            },
            customer: {
                icon: <ShoppingBag className="h-5 w-5 text-white" />,
                title: 'Order Accepted',
                subtitle: 'The seller has accepted your order and started working on it.',
                accent: '#22c55e',
                bg: 'from-green-50 to-emerald-50',
                border: 'border-green-200',
                badgeText: 'In Progress',
            },
        },
        order_delivered: {
            seller: {
                icon: <Truck className="h-5 w-5 text-white" />,
                title: 'You Delivered the Work',
                subtitle: 'Waiting for the customer to review and approve your delivery.',
                accent: '#8b5cf6',
                bg: 'from-purple-50 to-violet-50',
                border: 'border-purple-200',
                badgeText: 'Awaiting Review',
            },
            customer: {
                icon: <Truck className="h-5 w-5 text-white" />,
                title: 'Work Delivered',
                subtitle: payload.delivery_message || 'The seller delivered the work. Please review and approve or request a revision.',
                accent: '#8b5cf6',
                bg: 'from-purple-50 to-violet-50',
                border: 'border-purple-200',
                badgeText: 'Awaiting Review',
            },
        },
        order_completed: {
            seller: {
                icon: <Star className="h-5 w-5 text-white" />,
                title: 'Order Completed!',
                subtitle: 'The customer approved your delivery. Your earnings have been released.',
                accent: '#22c55e',
                bg: 'from-green-50 to-teal-50',
                border: 'border-green-200',
                badgeText: 'Completed',
            },
            customer: {
                icon: <Star className="h-5 w-5 text-white" />,
                title: 'Order Completed',
                subtitle: 'You approved the delivery. Thank you for using our platform!',
                accent: '#22c55e',
                bg: 'from-green-50 to-teal-50',
                border: 'border-green-200',
                badgeText: 'Completed',
            },
        },
        order_cancelled: {
            seller: {
                icon: <XCircle className="h-5 w-5 text-white" />,
                title: 'Order Cancelled',
                subtitle: payload.reason ? `You cancelled this order. Reason: ${payload.reason}` : 'This order has been cancelled.',
                accent: '#ef4444',
                bg: 'from-red-50 to-rose-50',
                border: 'border-red-200',
                badgeText: 'Cancelled',
            },
            customer: {
                icon: <XCircle className="h-5 w-5 text-white" />,
                title: 'Order Cancelled',
                subtitle: payload.reason ? `The seller cancelled this order. Reason: ${payload.reason}` : 'The seller has cancelled this order.',
                accent: '#ef4444',
                bg: 'from-red-50 to-rose-50',
                border: 'border-red-200',
                badgeText: 'Cancelled',
            },
        },
    };

    const eventConfigs = configs[event];
    if (!eventConfigs) return null;
    const cfg = isSeller ? eventConfigs.seller : eventConfigs.customer;

    return (
        <div className="flex justify-center my-2">
            <div className={`w-full max-w-sm rounded-2xl border ${cfg.border} bg-gradient-to-br ${cfg.bg} overflow-hidden shadow-sm`}>
                {/* Header strip */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ background: cfg.accent }}>
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">{cfg.title}</p>
                        <p className="text-white/80 text-xs">Order #{payload.order_number}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white">
                        {cfg.badgeText}
                    </span>
                </div>

                {/* Body */}
                <div className="px-4 py-3 space-y-2.5">
                    {cfg.subtitle && (
                        <p className="text-sm text-gray-600 leading-relaxed">{cfg.subtitle}</p>
                    )}

                    {/* Order details grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/70 rounded-xl px-3 py-2">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Package</p>
                            <p className="text-sm font-bold text-gray-900 capitalize mt-0.5">{payload.package_tier}</p>
                        </div>
                        <div className="bg-white/70 rounded-xl px-3 py-2">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Order Value</p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">LKR {Number(payload.total_amount).toLocaleString()}</p>
                        </div>
                        {payload.delivery_date && event !== 'order_completed' && event !== 'order_cancelled' && (
                            <div className="col-span-2 bg-white/70 rounded-xl px-3 py-2">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Deadline</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">
                                    {new Date(payload.delivery_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* CTA */}
                    <Link
                        href={orderUrl}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                        style={{ background: cfg.accent }}
                    >
                        {event === 'order_delivered' && !isSeller ? 'Review Delivery' : 'View Order'}
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>

                    <p className="text-center text-[10px] text-gray-400">
                        {new Date(message.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        </div>
    );
};
