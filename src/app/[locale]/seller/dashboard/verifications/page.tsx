'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerDashboardData, saveLifeInsurance } from '@/app/actions/seller';
import FileUpload from '@/components/FileUpload';
import { CheckCircle, Clock, AlertTriangle, UploadCloud, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerVerificationsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [verifications, setVerifications] = useState<any[]>([]);
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
    const [taskerData, setTaskerData] = useState<any>(null);
    const [isHighRisk, setIsHighRisk] = useState(false);

    // Life insurance state
    const [insuranceProvider, setInsuranceProvider] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [savingInsurance, setSavingInsurance] = useState(false);

    const loadData = useCallback(async () => {
        if (authLoading) return;
        if (!user) {
            router.push('/login?type=tasker');
            return;
        }

        try {
            setLoading(true);
            const data = await getSellerDashboardData(user.id);
            if (data && data.verifications) {
                setVerifications(data.verifications);
                if (data.tasker) {
                    setTaskerData(data.tasker);
                    setInsuranceProvider(data.tasker.life_insurance_provider || '');
                    setPolicyNumber(data.tasker.life_insurance_policy || '');
                }
                setIsHighRisk(data.isHighRisk || false);
            }
        } catch (error) {
            console.error('Error loading verifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleReupload = async (files: File[], docType: string) => {
        if (!files || files.length === 0 || !user) return;
        setUploadingDoc(docType);

        try {
            const formData = new FormData();
            formData.append('file', files[0]);
            formData.append('bucket', 'verifications');
            formData.append('path', `${user.id}/${docType}/${Date.now()}_${files[0].name.replace(/\s+/g, '_')}`);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to upload file');
            const { url } = await response.json();

            // Submit the new verification record
            const submitResponse = await fetch('/api/verifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    verifications: [{ type: docType, documents: [url] }]
                })
            });

            if (!submitResponse.ok) throw new Error('Failed to save record database');

            toast.success('Document uploaded successfully. It is now in review.');
            loadData(); // Reload to get fresh status
        } catch (error: any) {
            toast.error(error.message || 'Error occurred while uploading.');
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleSaveInsurance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSavingInsurance(true);

        try {
            const result = await saveLifeInsurance(user.id, insuranceProvider, policyNumber);
            if (result.success) {
                toast.success(result.message);
                loadData(); // to get updated trust score if we were fetching it
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Error saving insurance details');
        } finally {
            setSavingInsurance(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    // Helper to get the LATEST entry for a given document type
    const getLatestDoc = (type: string) => {
        const typeVerifs = verifications.filter(v => v.verification_type === type);
        if (typeVerifs.length === 0) return null;
        return typeVerifs.reduce((latest, current) =>
            new Date(current.submitted_at).getTime() > new Date(latest.submitted_at).getTime() ? current : latest
        );
    };

    const docTypes = [
        { key: 'nic_front', label: 'National Identity Card (Front)', required: true },
        { key: 'nic_back', label: 'National Identity Card (Back)', required: true },
        { key: 'address_proof', label: 'Proof of Address (Utility Bill, Bank Statement)', required: true },
        { key: 'police_report', label: 'Police Clearance Certificate', required: false },
    ];

    // Status styling helpers
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'submitted':
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'rejected': return <AlertTriangle className="w-5 h-5 text-red-600" />;
            case 'submitted':
            case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
            default: return <FileText className="w-5 h-5 text-gray-400" />;
        }
    };

    const hasUploadedAllMandatory = docTypes
        .filter(d => d.required)
        .every(d => !!getLatestDoc(d.key));

    const hasRejectedMandatory = docTypes
        .filter(d => d.required)
        .some(d => getLatestDoc(d.key)?.status === 'rejected');

    const hasPendingMandatory = docTypes
        .filter(d => d.required)
        .some(d => {
            const doc = getLatestDoc(d.key);
            return doc && (doc.status === 'submitted' || doc.status === 'pending');
        });

    const isActuallyVerified = user?.isVerified;

    const getProgressStyles = () => {
        if (user?.isVerified) {
            return {
                box: 'bg-green-50 border-green-200',
                step1: 'bg-brand-green text-white',
                line1: 'bg-brand-green',
                step2: 'bg-brand-green text-white',
                line2: 'bg-brand-green',
                step3: 'bg-brand-green text-white ring-4 ring-green-100',
                text1: 'text-gray-900',
                text2: 'text-gray-900',
                text3: 'text-gray-900',
                icon: 'text-brand-green'
            };
        }
        if (hasRejectedMandatory) {
            return {
                box: 'bg-red-50 border-red-200',
                step1: hasUploadedAllMandatory ? 'bg-brand-green text-white' : 'bg-red-500 text-white',
                line1: hasUploadedAllMandatory ? 'bg-brand-green' : 'bg-red-300',
                step2: 'bg-red-500 text-white ring-4 ring-red-100',
                line2: 'bg-gray-200 border-t border-dashed border-gray-300',
                step3: 'bg-gray-200 text-gray-500',
                text1: 'text-gray-900',
                text2: 'text-red-700 font-bold',
                text3: 'text-gray-500',
                icon: 'text-red-500'
            };
        }
        if (hasUploadedAllMandatory) {
            return {
                box: 'bg-orange-50 border-orange-200',
                step1: 'bg-brand-green text-white',
                line1: 'bg-brand-green',
                step2: 'bg-orange-500 text-white ring-4 ring-orange-100',
                line2: 'bg-gray-200 border-t border-dashed border-gray-300',
                step3: 'bg-gray-200 text-gray-500',
                text1: 'text-gray-900',
                text2: 'text-orange-700 font-bold',
                text3: 'text-gray-500',
                icon: 'text-orange-500'
            };
        }
        return {
            box: 'bg-white border-blue-200 shadow-sm',
            step1: 'bg-blue-600 text-white ring-4 ring-blue-100',
            line1: 'bg-gray-200',
            step2: 'bg-gray-200 text-gray-500',
            line2: 'bg-gray-200 border-t border-dashed border-gray-300',
            step3: 'bg-gray-200 text-gray-500',
            text1: 'text-blue-700 font-bold',
            text2: 'text-gray-500',
            text3: 'text-gray-500',
            icon: 'text-blue-500'
        };
    };

    const pStyles = getProgressStyles();

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
                <p className="text-gray-600 mt-2">Track the status of your submitted documents and re-upload if necessary.</p>
            </div>

            {/* Trust Score Panel */}
            <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Trust Score</h3>
                        <p className="text-gray-500 text-sm mt-0.5">Earned by submitting and getting documents verified</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black text-brand-green">{taskerData?.trust_score ?? 0}</div>
                        <div className="text-xs text-gray-400 mt-0.5">/ 250 pts</div>
                    </div>
                </div>

                {/* Three-milestone progress bar (no numbers on bar) */}
                <div className="flex gap-1 mb-5">
                    {/* Segment 1: 0 → 100 (Verified) */}
                    <div className="flex-[2]">
                        <div className="w-full bg-gray-100 rounded-l-full h-2.5 overflow-hidden">
                            <div
                                className="h-2.5 rounded-l-full bg-gradient-to-r from-brand-green to-emerald-400 transition-all duration-700"
                                style={{ width: `${Math.min(((taskerData?.trust_score ?? 0) / 100) * 100, 100)}%` }}
                            />
                        </div>
                        <div className={`text-[10px] mt-1 font-bold ${(taskerData?.trust_score ?? 0) >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                            {(taskerData?.trust_score ?? 0) >= 100 ? '✅ Verified' : `🔒 Verified`}
                        </div>
                    </div>
                    <div className="w-2 flex-shrink-0" />
                    {/* Segment 2: 100 → 200 */}
                    <div className="flex-[2]">
                        <div className="w-full bg-gray-100 h-2.5 overflow-hidden">
                            <div
                                className="h-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-700"
                                style={{ width: `${(taskerData?.trust_score ?? 0) >= 100 ? Math.min((((taskerData?.trust_score ?? 0) - 100) / 100) * 100, 100) : 0}%` }}
                            />
                        </div>
                        <div className={`text-[10px] mt-1 font-bold ${(taskerData?.trust_score ?? 0) >= 200 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {(taskerData?.trust_score ?? 0) >= 200 ? '⭐ Trust Verified' : '🔒 Trust Verified'}
                        </div>
                    </div>
                    <div className="w-2 flex-shrink-0" />
                    {/* Segment 3: 200 → 250 (Trust Verified — top tier) */}
                    <div className="flex-1">
                        <div className="w-full bg-gray-100 rounded-r-full h-2.5 overflow-hidden">
                            <div
                                className="h-2.5 rounded-r-full bg-gradient-to-r from-orange-500 to-red-400 transition-all duration-700"
                                style={{ width: `${(taskerData?.trust_score ?? 0) >= 200 ? Math.min((((taskerData?.trust_score ?? 0) - 200) / 50) * 100, 100) : 0}%` }}
                            />
                        </div>
                        <div className={`text-[10px] mt-1 font-bold ${(taskerData?.trust_score ?? 0) >= 250 ? 'text-orange-600' : 'text-gray-400'}`}>
                            {(taskerData?.trust_score ?? 0) >= 250 ? '🏆 Top Seller' : '🔒 Top Seller'}
                        </div>
                    </div>
                </div>

                {/* Milestone badges */}
                <div className="flex gap-3 mb-5">
                    <div className={`flex-1 rounded-xl p-3 border-2 text-center transition-all ${(taskerData?.trust_score ?? 0) >= 100 ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                        <div className="text-xl mb-1">{(taskerData?.trust_score ?? 0) >= 100 ? '✅' : '🔒'}</div>
                        <div className={`text-xs font-bold ${(taskerData?.trust_score ?? 0) >= 100 ? 'text-green-700' : 'text-gray-500'}`}>Verified</div>
                        <div className="text-[10px] text-gray-400">100 pts</div>
                    </div>
                    <div className={`flex-1 rounded-xl p-3 border-2 text-center transition-all ${(taskerData?.trust_score ?? 0) >= 200 ? 'border-amber-400 bg-amber-50' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                        <div className="text-xl mb-1">{(taskerData?.trust_score ?? 0) >= 200 ? '⭐' : '🔒'}</div>
                        <div className={`text-xs font-bold ${(taskerData?.trust_score ?? 0) >= 200 ? 'text-amber-600' : 'text-gray-500'}`}>Trust Verified</div>
                        <div className="text-[10px] text-gray-400">200 pts</div>
                    </div>
                    <div className={`flex-1 rounded-xl p-3 border-2 text-center transition-all ${(taskerData?.trust_score ?? 0) >= 250 ? 'border-orange-400 bg-orange-50' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                        <div className="text-xl mb-1">{(taskerData?.trust_score ?? 0) >= 250 ? '🏆' : '🔒'}</div>
                        <div className={`text-xs font-bold ${(taskerData?.trust_score ?? 0) >= 250 ? 'text-orange-600' : 'text-gray-500'}`}>Top Seller</div>
                        <div className="text-[10px] text-gray-400">250 pts</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { key: 'nic_front', label: 'NIC Front', pts: 30 },
                        { key: 'nic_back', label: 'NIC Back', pts: 30 },
                        { key: 'address_proof', label: 'Address Proof', pts: 40 },
                        { key: 'police_report', label: 'Police Report', pts: 100, optional: true },
                    ].map(({ key, label, pts, optional }) => {
                        const doc = verifications
                            .filter(v => v.verification_type === key)
                            .sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
                        const approved = doc?.status === 'approved';
                        const pending = doc?.status === 'submitted' || doc?.status === 'pending';
                        return (
                            <div key={key} className={`rounded-lg px-3 py-2.5 border ${approved ? 'bg-green-50 border-green-200' :
                                pending ? 'bg-yellow-50 border-yellow-200' :
                                    'bg-gray-50 border-gray-200'
                                }`}>
                                <div className={`text-xs font-medium mb-1 ${approved ? 'text-green-700' : pending ? 'text-yellow-700' : 'text-gray-500'
                                    }`}>{label}{(optional as any) && <span className="ml-1 font-normal text-gray-400">(optional)</span>}</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-900 font-bold text-sm">+{pts} pts</span>
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${approved ? 'bg-green-100 text-green-700' :
                                        pending ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-200 text-gray-500'
                                        }`}>
                                        {approved ? '✓ Earned' : pending ? '⏳ Pending' : 'Not yet'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* What to do next — tailored callout */}
                {(taskerData?.trust_score ?? 0) >= 100 && (taskerData?.trust_score ?? 0) < 200 && !verifications.find((v: any) => v.verification_type === 'police_report' && v.status === 'approved') && (
                    <div className="mt-5 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-xl p-4 flex items-start gap-4">
                        <div className="text-2xl mt-0.5">📋</div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-yellow-800 mb-1">You're 100 pts away from ⭐ Trust Verified</h4>
                            <p className="text-xs text-yellow-700 mb-3">Upload your <strong>Police Clearance Certificate</strong> to earn <strong>+100 pts</strong> and unlock the Trust Verified badge. This badge appears on your profile and significantly increases buyer confidence.</p>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-1 rounded-lg font-semibold">🔒 Trust Verified (200 pts)</span>
                                <span className="text-yellow-600">→</span>
                                <span className="bg-white border border-yellow-300 text-yellow-800 px-2 py-1 rounded-lg font-semibold">⭐ Current score: {taskerData?.trust_score ?? 0} pts</span>
                            </div>
                        </div>
                    </div>
                )}
                {(taskerData?.trust_score ?? 0) < 100 && (
                    <div className="mt-5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">🗺️ Your Roadmap to Verified</h4>
                        <div className="space-y-2">
                            {!verifications.find((v: any) => v.verification_type === 'nic_front' && v.status === 'approved') && (
                                <div className="flex items-center gap-3 p-2.5 bg-white border border-blue-100 rounded-lg shadow-sm">
                                    <span className="text-base">🪪</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-800">Upload NIC Front</p>
                                        <p className="text-[10px] text-gray-500">+{isHighRisk ? 20 : 30} pts · Required</p>
                                    </div>
                                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">DO THIS</span>
                                </div>
                            )}
                            {!verifications.find((v: any) => v.verification_type === 'nic_back' && v.status === 'approved') && (
                                <div className="flex items-center gap-3 p-2.5 bg-white border border-blue-100 rounded-lg shadow-sm">
                                    <span className="text-base">🪪</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-800">Upload NIC Back</p>
                                        <p className="text-[10px] text-gray-500">+{isHighRisk ? 20 : 30} pts · Required</p>
                                    </div>
                                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">DO THIS</span>
                                </div>
                            )}
                            {!verifications.find((v: any) => v.verification_type === 'address_proof' && v.status === 'approved') && (
                                <div className="flex items-center gap-3 p-2.5 bg-white border border-blue-100 rounded-lg shadow-sm">
                                    <span className="text-base">🏠</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-800">Upload Proof of Address</p>
                                        <p className="text-[10px] text-gray-500">+{isHighRisk ? 30 : 40} pts · Required</p>
                                    </div>
                                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">DO THIS</span>
                                </div>
                            )}
                            {isHighRisk && !verifications.find((v: any) => v.verification_type === 'insurance' && v.status === 'approved') && (
                                <div className="flex items-center gap-3 p-2.5 bg-white border border-orange-100 rounded-lg shadow-sm">
                                    <span className="text-base">🛡️</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-800">Add Life Insurance Details</p>
                                        <p className="text-[10px] text-gray-500">+30 pts · Required for high-risk sellers</p>
                                    </div>
                                    <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-full">DO THIS</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 p-2.5 bg-white border border-yellow-100 rounded-lg">
                                <span className="text-base">📋</span>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-gray-700">Police Clearance Certificate <span className="text-gray-400">(after Verified)</span></p>
                                    <p className="text-[10px] text-gray-500">+100 pts · Upgrades you to ⭐ Trust Verified</p>
                                </div>
                                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">LATER</span>
                            </div>
                        </div>
                    </div>
                )}
                {(taskerData?.trust_score ?? 0) >= 200 && (
                    <div className="mt-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <span className="text-2xl">⭐</span>
                        <div>
                            <p className="text-sm font-bold text-yellow-700">You've reached Trust Verified! ⭐</p>
                            <p className="text-xs text-yellow-600">The gold star badge now shows on your public profile. The final 50 pts are reserved for Top Sellers — awarded by the admin team.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Global Progress Tracker */}
            <div className={`mb-10 p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-6 ${pStyles.box}`}>
                <div className="flex-1 w-full flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-all ${pStyles.step1}`}>1</div>
                    <div className={`h-1.5 w-full mx-3 rounded-full transition-all ${pStyles.line1}`}></div>
                    <div className={`text-sm whitespace-nowrap hidden md:block mr-3 transition-all ${pStyles.text1}`}>Upload Documents</div>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-all ${pStyles.step2}`}>2</div>
                    <div className={`h-1.5 w-full mx-3 transition-all ${pStyles.line2}`}></div>
                    <div className={`text-sm whitespace-nowrap hidden md:block mr-3 transition-all ${pStyles.text2}`}>{hasRejectedMandatory ? 'Action Required' : 'In Review'}</div>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-all ${pStyles.step3}`}>3</div>
                    <div className={`text-sm font-semibold whitespace-nowrap hidden md:block ml-3 transition-all ${pStyles.text3}`}>Verified</div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Submitted Documents</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Your documents are reviewed manually by our team to ensure the safety of our marketplace.</p>
                </div>

                <div className="divide-y divide-gray-200">
                    {docTypes.map((type) => {
                        const doc = getLatestDoc(type.key);
                        const status = doc ? doc.status : 'missing';
                        const isRejected = status === 'rejected';

                        return (
                            <div key={type.key} className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className="mt-1">
                                            {getStatusIcon(status)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-md font-semibold text-gray-900">{type.label}</h4>
                                                {type.required ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1 sm:mt-0">Required</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 mt-1 sm:mt-0">Optional</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(status)}`}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </span>
                                                {doc?.submitted_at && (
                                                    <span className="text-xs text-gray-500">Updated: {new Date(doc.submitted_at).toLocaleDateString()}</span>
                                                )}
                                            </div>

                                            {isRejected && doc.admin_notes && (
                                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                                                    <strong>Reason for rejection:</strong> {doc.admin_notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Area: Show upload only if missing or rejected */}
                                    {(status === 'missing' || isRejected) && (
                                        <div className="w-full md:w-64 shrink-0 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                                            <p className="text-xs text-gray-600 font-medium mb-2">{isRejected ? 'Please upload a clearer copy' : 'Upload your document'}</p>
                                            <FileUpload
                                                label=""
                                                accept="image/*,.pdf"
                                                maxSizeMB={10}
                                                multiple={false}
                                                required={false}
                                                onChange={(files) => handleReupload(files, type.key)}
                                            />
                                            {uploadingDoc === type.key && (
                                                <p className="text-xs text-brand-green mt-2 flex items-center"><UploadCloud className="w-3 h-3 mr-1 animate-pulse" /> Uploading...</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Life Insurance Section — ONLY for high-risk category sellers */}
            {isHighRisk && (
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-orange-100 bg-orange-50 flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Life Insurance Details</h3>
                            <p className="mt-1 text-sm text-gray-700">You offer <strong>high-risk services</strong>. Submitting life insurance details is required to reach <strong>Verified (100 pts)</strong> and unlock all 5 gig slots. It builds important trust with buyers for these categories.</p>
                        </div>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSaveInsurance} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700">Insurance Provider Name</label>
                                    <input
                                        type="text"
                                        id="insuranceProvider"
                                        value={insuranceProvider}
                                        onChange={(e) => setInsuranceProvider(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-green focus:ring-brand-green sm:text-sm px-4 py-2 border"
                                        placeholder="e.g. Ceylinco Life"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700">Policy Number</label>
                                    <input
                                        type="text"
                                        id="policyNumber"
                                        value={policyNumber}
                                        onChange={(e) => setPolicyNumber(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-green focus:ring-brand-green sm:text-sm px-4 py-2 border"
                                        placeholder="e.g. POL-123456789"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={savingInsurance || (!insuranceProvider && !policyNumber)}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50"
                                >
                                    {savingInsurance ? 'Saving...' : 'Save Insurance Details'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
