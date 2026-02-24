'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSellerDashboardData } from '@/app/actions/seller';
import FileUpload from '@/components/FileUpload';
import { CheckCircle, Clock, AlertTriangle, UploadCloud, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerVerificationsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [verifications, setVerifications] = useState<any[]>([]);
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

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
        { key: 'nic', label: 'National Identity Card (Front & Back)', required: true },
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

    const hasRejectedMandatory = docTypes
        .filter(d => d.required)
        .some(d => getLatestDoc(d.key)?.status === 'rejected');

    const hasPendingMandatory = docTypes
        .filter(d => d.required)
        .some(d => {
            const doc = getLatestDoc(d.key);
            return !doc || doc.status === 'submitted' || doc.status === 'pending';
        });

    const isFullyApproved = user?.isVerified;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
                <p className="text-gray-600 mt-2">Track the status of your submitted documents and re-upload if necessary.</p>
            </div>

            {/* Global Progress Tracker */}
            <div className={`mb-10 p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-6 ${isFullyApproved ? 'bg-green-50 border-green-200' : hasRejectedMandatory ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex-1 w-full flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${isFullyApproved || !hasRejectedMandatory ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                    <div className={`h-1.5 w-full mx-3 rounded-full ${isFullyApproved || !hasRejectedMandatory ? 'bg-brand-green' : 'bg-gray-200'}`}></div>
                    <div className="text-sm font-semibold text-gray-900 whitespace-nowrap hidden md:block mr-3">Uploaded</div>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${isFullyApproved ? 'bg-brand-green text-white' : hasRejectedMandatory ? 'bg-red-500 text-white' : hasPendingMandatory ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                    <div className={`h-1.5 w-full mx-3 rounded-full ${isFullyApproved ? 'bg-brand-green' : 'bg-gray-200 border-t border-dashed border-gray-300'}`}></div>
                    <div className="text-sm font-semibold text-gray-900 whitespace-nowrap hidden md:block mr-3">{hasRejectedMandatory ? 'Action Required' : 'In Review'}</div>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${isFullyApproved ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                    <div className="text-sm font-semibold text-gray-900 whitespace-nowrap hidden md:block ml-3">Verified</div>
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
        </div>
    );
}
