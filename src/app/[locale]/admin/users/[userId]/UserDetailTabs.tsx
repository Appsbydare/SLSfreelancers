'use client';

import React, { useState } from 'react';
import {
    Briefcase, ActivitySquare, TrendingUp, ShoppingCart, List,
    Send, User, Mail, Phone, MapPin, Calendar, CheckCircle2, XCircle,
    Shield, Globe, Lock, CreditCard, Users, AlertCircle, Star, Clock
} from 'lucide-react';
import Image from 'next/image';

interface UserDetailTabsProps {
    user: any;
    taskerProfile: any;
    customerProfile: any;
    auditLogs: any[];
    stats: {
        gigs: number;
        bids: number;
        requests: number;
        recentBids: any[];
        ordersAsSeller: number;
        ordersAsCustomer: number;
    };
}

// --- Sub-components ---

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 bg-gray-50 border-b border-gray-200">
                <Icon className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: any }) {
    const display = () => {
        if (value === null || value === undefined || value === '') {
            return <span className="text-gray-400 italic text-sm">Not set</span>;
        }
        if (typeof value === 'boolean') {
            return value
                ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />Yes</span>
                : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />No</span>;
        }
        if (typeof value === 'object') {
            return (
                <pre className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap max-h-40">
                    {JSON.stringify(value, null, 2)}
                </pre>
            );
        }
        // Format ISO dates nicely
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
            return <span className="text-sm text-gray-800">{new Date(value).toLocaleString()}</span>;
        }
        return <span className="text-sm text-gray-800 break-all">{String(value)}</span>;
    };

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label.replace(/_/g, ' ')}</span>
            <div>{display()}</div>
        </div>
    );
}

function FieldGrid({ data, exclude = [] }: { data: any; exclude?: string[] }) {
    if (!data) return <p className="text-sm text-gray-400 italic">No data available.</p>;
    const keys = Object.keys(data).filter(k => !exclude.includes(k)).sort();
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {keys.map(key => <Field key={key} label={key} value={data[key]} />)}
        </div>
    );
}

function StatCard({ icon: Icon, value, label, color }: { icon: any; value: number | string; label: string; color: string }) {
    return (
        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-1 ${color}`}>
            <Icon className="w-5 h-5 mb-1 opacity-70" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium opacity-75">{label}</p>
        </div>
    );
}

// --- Main Component ---

export default function UserDetailTabs({ user, taskerProfile, customerProfile, auditLogs, stats }: UserDetailTabsProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'audit'>('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'details', label: 'All Details', icon: Shield },
        { id: 'audit', label: 'Audit History', icon: ActivitySquare },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tab Header */}
            <div className="flex border-b border-gray-200 bg-gray-50/80 px-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-4 px-5 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 ${activeTab === tab.id
                                ? 'border-brand-green text-brand-green'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-6">

                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">

                        {/* Seller Section */}
                        {taskerProfile && (
                            <SectionCard title="Seller / Tasker Activity" icon={Briefcase}>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                    <StatCard icon={List} value={stats.gigs} label="Gigs Listed" color="bg-blue-50 border-blue-100 text-blue-700" />
                                    <StatCard icon={Send} value={stats.bids} label="Bids Placed" color="bg-purple-50 border-purple-100 text-purple-700" />
                                    <StatCard icon={ShoppingCart} value={stats.ordersAsSeller} label="Orders Received" color="bg-green-50 border-green-100 text-green-700" />
                                    <StatCard icon={TrendingUp} value={taskerProfile.completed_tasks || 0} label="Completed" color="bg-yellow-50 border-yellow-100 text-yellow-700" />
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    <div className="bg-gray-50 rounded-lg border border-gray-100 p-3 text-center">
                                        <Star className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                                        <p className="text-lg font-bold text-gray-900">{taskerProfile.rating?.toFixed(1) || '0.0'}</p>
                                        <p className="text-xs text-gray-500">Rating</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg border border-gray-100 p-3 text-center">
                                        <Clock className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                                        <p className="text-lg font-bold text-gray-900">{taskerProfile.response_rate ? `${taskerProfile.response_rate}%` : '—'}</p>
                                        <p className="text-xs text-gray-500">Response Rate</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg border border-gray-100 p-3 text-center">
                                        <Shield className="w-4 h-4 text-brand-green mx-auto mb-1" />
                                        <p className="text-sm font-bold text-gray-900">{taskerProfile.level_code || '—'}</p>
                                        <p className="text-xs text-gray-500">Level</p>
                                    </div>
                                </div>

                                {taskerProfile.bio && (
                                    <div className="mb-5">
                                        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Bio</p>
                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
                                            {taskerProfile.bio}
                                        </p>
                                    </div>
                                )}

                                {stats.recentBids.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Recent Bids</p>
                                        <div className="space-y-2">
                                            {stats.recentBids.map(bid => (
                                                <div key={bid.id} className="flex items-center justify-between text-sm border border-gray-100 bg-gray-50 p-3 rounded-lg">
                                                    <span className="font-medium text-gray-800 truncate pr-4">{bid.task?.title || 'Unknown Task'}</span>
                                                    <span className="shrink-0 font-bold text-brand-green">${bid.offer_amount?.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </SectionCard>
                        )}

                        {/* Customer Section */}
                        {customerProfile && (
                            <SectionCard title="Customer Activity" icon={User}>
                                <div className="grid grid-cols-2 gap-3">
                                    <StatCard icon={List} value={stats.requests} label="Tasks Posted" color="bg-blue-50 border-blue-100 text-blue-700" />
                                    <StatCard icon={ShoppingCart} value={stats.ordersAsCustomer} label="Orders Placed" color="bg-green-50 border-green-100 text-green-700" />
                                </div>
                            </SectionCard>
                        )}
                    </div>
                )}

                {/* ── ALL DETAILS TAB ── */}
                {activeTab === 'details' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 px-4 py-3 rounded-lg">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            Raw database records for this user across all identity tables.
                        </div>

                        {/* Profile Image */}
                        {(user.profile_image_url || taskerProfile?.profile_image_url) && (
                            <SectionCard title="Profile Image" icon={User}>
                                <div className="flex items-center gap-4">
                                    <Image
                                        src={taskerProfile?.profile_image_url || user.profile_image_url}
                                        alt="Profile"
                                        width={72}
                                        height={72}
                                        className="rounded-full border-2 border-gray-200 object-cover"
                                        unoptimized
                                    />
                                    <p className="text-xs text-gray-500 break-all">{taskerProfile?.profile_image_url || user.profile_image_url}</p>
                                </div>
                            </SectionCard>
                        )}

                        {/* Identity */}
                        <SectionCard title="Identity & Account" icon={Shield}>
                            <FieldGrid data={user} exclude={['profile_image_url', 'verification_status']} />
                        </SectionCard>

                        {/* Tasker / Seller Profile */}
                        {taskerProfile && (
                            <SectionCard title="Seller Profile" icon={Briefcase}>
                                <FieldGrid data={taskerProfile} exclude={['profile_image_url']} />
                            </SectionCard>
                        )}

                        {/* Customer Profile */}
                        {customerProfile && (
                            <SectionCard title="Customer Profile" icon={Users}>
                                <FieldGrid data={customerProfile} />
                            </SectionCard>
                        )}
                    </div>
                )}

                {/* ── AUDIT TAB ── */}
                {activeTab === 'audit' && (
                    <div>
                        {auditLogs && auditLogs.length > 0 ? (
                            <div className="space-y-3">
                                {auditLogs.map((log) => {
                                    const isSuspend = log.action.includes('SUSPEND');
                                    const isApprove = log.action.includes('APPROVE');
                                    return (
                                        <div key={log.id} className={`flex gap-4 p-4 rounded-xl border ${isSuspend ? 'border-red-100 bg-red-50' : isApprove ? 'border-green-100 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isSuspend ? 'bg-red-100 text-red-600' : isApprove ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'}`}>
                                                {isSuspend ? <XCircle className="w-4 h-4" /> : isApprove ? <CheckCircle2 className="w-4 h-4" /> : <ActivitySquare className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold ${isSuspend ? 'text-red-800' : isApprove ? 'text-green-800' : 'text-gray-800'}`}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </p>
                                                {log.details?.reason && (
                                                    <p className="text-xs text-red-700 mt-1 bg-red-100 px-2 py-1 rounded border border-red-200">
                                                        Reason: {log.details.reason}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    By {(log.admin as any)?.first_name} {(log.admin as any)?.last_name} &bull; {new Date(log.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <ActivitySquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No administrative actions recorded.</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
