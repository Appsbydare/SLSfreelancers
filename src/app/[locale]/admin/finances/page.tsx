import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Search, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Percent } from 'lucide-react';
import FinanceActions from '@/app/[locale]/admin/finances/FinanceActions';

export const revalidate = 0;

export default async function AdminFinancesPage({
    searchParams,
    params
}: {
    searchParams: Promise<{ q?: string; status?: string; page?: string }>;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const resolvedSearchParams = await searchParams;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const statusFilter = resolvedSearchParams.status || 'all';
    const page = parseInt(resolvedSearchParams.page || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('transactions')
        .select(`
            *,
            payer:users!transactions_payer_id_fkey(first_name, last_name, email),
            payee:users!transactions_payee_id_fkey(first_name, last_name, email),
            task:tasks(title)
        `, { count: 'exact' });

    if (statusFilter !== 'all') {
        dbQuery = dbQuery.eq('status', statusFilter);
    }

    const { data: transactions, count, error } = await dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const totalPages = count ? Math.ceil(count / limit) : 1;

    // Calculate High-Level Metrics (Ideally this should be an aggregate RPC from DB, but estimating for dashboard)
    const { data: allMetrics } = await supabase.from('transactions').select('amount, platform_fee, status');
    let totalEscrow = 0;
    let totalPlatformFees = 0;
    let totalVolume = 0;

    if (allMetrics) {
        allMetrics.forEach(tx => {
            if (tx.status === 'held_in_escrow') totalEscrow += Number(tx.amount || 0);
            if (tx.status === 'released') totalPlatformFees += Number(tx.platform_fee || 0);
            if (tx.status === 'released') totalVolume += Number(tx.amount || 0);
        });
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Financial Tracker</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor all platform transactions, escrow balances, and fees.</p>
                </div>
            </div>

            {/* Top Level Financials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Gross Processing Volume</p>
                        <p className="text-2xl font-bold text-gray-900">LKR {totalVolume.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Percent className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Platform Fees Collected</p>
                        <p className="text-2xl font-bold text-gray-900">LKR {totalPlatformFees.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Currently in Escrow</p>
                        <p className="text-2xl font-bold text-gray-900">LKR {totalEscrow.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Transactions Ledger */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Transactions Ledger</h2>
                    <form className="flex items-center gap-2" method="GET">
                        <select
                            name="status"
                            defaultValue={statusFilter}
                            className="py-1.5 pl-3 pr-8 border border-gray-300 bg-white rounded-md text-sm focus:ring-brand-green focus:border-brand-green"
                        >
                            <option value="all">All Transactions</option>
                            <option value="held_in_escrow">Held in Escrow</option>
                            <option value="released">Released to Seller</option>
                            <option value="refunded">Refunded to Buyer</option>
                        </select>
                        <button type="submit" className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                            Filter
                        </button>
                    </form>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Context</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From (Payer)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To (Payee)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount & Fee</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions?.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs font-mono text-gray-500">{tx.id.split('-')[0]}...</div>
                                        <div className="text-xs text-gray-400 mt-1">{new Date(tx.created_at).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 truncate max-w-[150px]" title={(tx.task as any)?.title || 'Service Payment'}>
                                            {(tx.task as any)?.title || 'Service Payment'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 flex items-center gap-1">
                                            <ArrowUpRight className="w-3 h-3 text-red-500" />
                                            {(tx.payer as any)?.first_name} {(tx.payer as any)?.last_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 flex items-center gap-1">
                                            <ArrowDownRight className="w-3 h-3 text-green-500" />
                                            {(tx.payee as any)?.first_name} {(tx.payee as any)?.last_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900 w-full">LKR {tx.amount?.toLocaleString()}</div>
                                        <div className="text-xs text-brand-green mt-1 flex justify-between w-full">
                                            <span>Fee: LKR {tx.platform_fee?.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 border rounded-full text-xs font-medium capitalize
                                            ${tx.status === 'released' ? 'bg-green-50 text-green-700 border-green-200' :
                                                tx.status === 'refunded' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                            {tx.status?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <FinanceActions
                                            transactionId={tx.id}
                                            currentStatus={tx.status}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {(!transactions || transactions.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-900">No transactions found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Page <span className="font-medium text-gray-900">{page}</span> of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            {page > 1 && (
                                <Link
                                    href={`/${locale}/admin/finances?status=${statusFilter}&page=${page - 1}`}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 bg-white"
                                >
                                    Previous
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/${locale}/admin/finances?status=${statusFilter}&page=${page + 1}`}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 bg-white"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
