'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, FileText, User, RefreshCw, ShieldCheck, X, ChevronDown, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import VerificationActions from '@/app/[locale]/admin/verifications/VerificationActions';

type Verification = {
    id: string;
    user_id: string;
    verification_type: string;
    status: string;
    submitted_at: string;
    document_url: string;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
};

export default function VerificationsList({ verifications }: { verifications: Verification[] }) {
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [zoom, setZoom] = useState<number>(1);
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

    const toggleUser = (userId: string) => {
        setExpandedUsers(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    // Group verifications by user
    const grouped = verifications.reduce((acc, curr) => {
        if (!acc[curr.user_id]) {
            acc[curr.user_id] = {
                user: curr.user,
                user_id: curr.user_id,
                documents: []
            };
        }
        acc[curr.user_id].documents.push(curr);
        return acc;
    }, {} as Record<string, { user: Verification['user'], user_id: string, documents: Verification[] }>);

    const groupedVerifications = Object.values(grouped);

    return (
        <div className="space-y-8">
            {groupedVerifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                    <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-900">No verifications found</p>
                    <p className="mt-1">The verification queue is completely clear.</p>
                </div>
            ) : (
                groupedVerifications.map((group) => (
                    <div key={group.user_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* User Header */}
                        <div
                            className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleUser(group.user_id)}
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-bold text-gray-900">
                                        {(group.user as any)?.first_name} {(group.user as any)?.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">{(group.user as any)?.email}</div>
                                    <div className="text-xs text-gray-400 mt-0.5" title={group.user_id}>User ID: {group.user_id}</div>
                                </div>
                            </div>
                            <div className="text-gray-400">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">{group.documents.length} Document(s)</span>
                                    {expandedUsers.has(group.user_id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                </div>
                            </div>
                        </div>

                        {/* Documents List */}
                        {expandedUsers.has(group.user_id) && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-white">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Document Type</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Submitted</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">View</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Status & Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {group.documents.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                                        {doc.verification_type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                                    {new Date(doc.submitted_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {doc.document_url ? (
                                                        <button
                                                            onClick={() => { setViewerUrl(doc.document_url); setZoom(1); }}
                                                            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green"
                                                        >
                                                            <FileText className="w-4 h-4 text-brand-green" /> View Document
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 italic">No File</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
                                                        ${doc.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                doc.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    'bg-orange-50 text-orange-700 border-orange-200 animate-pulse'}`}>
                                                            {doc.status === 'approved' && <CheckCircle className="w-3.5 h-3.5" />}
                                                            {doc.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                                                            {doc.status === 'submitted' && <RefreshCw className="w-3.5 h-3.5" />}
                                                            {doc.status.toUpperCase()}
                                                        </span>

                                                        {doc.status === 'submitted' && (
                                                            <div className="ml-auto">
                                                                <VerificationActions verificationId={doc.id} userId={doc.user_id} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))
            )}

            {/* Document Viewer Modal */}
            {viewerUrl && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8" onClick={() => setViewerUrl(null)}>
                    <div
                        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-500" /> Document Viewer
                            </h3>
                            <div className="flex items-center gap-2">
                                {viewerUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) && (
                                    <>
                                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors" title="Zoom Out">
                                            <ZoomOut className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setZoom(1)} className="px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors" title="Reset Zoom">
                                            {Math.round(zoom * 100)}%
                                        </button>
                                        <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors" title="Zoom In">
                                            <ZoomIn className="w-5 h-5" />
                                        </button>
                                        <div className="w-px h-6 bg-gray-300 mx-2"></div>
                                    </>
                                )}
                                <button
                                    onClick={() => { setViewerUrl(null); setZoom(1); }}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-[50vh] relative p-4">
                            {/* If it's an image, show img, else PDF via object */}
                            {viewerUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                <img
                                    src={viewerUrl}
                                    alt="Document Preview"
                                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                                    className="max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain transition-transform duration-200 ease-out shadow-lg rounded"
                                />
                            ) : (
                                <object data={viewerUrl} type="application/pdf" className="w-full h-full bg-white shadow-lg rounded">
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-100">
                                        <p className="text-gray-600 mb-4">It appears you don't have a PDF plugin for this browser.</p>
                                        <a href={viewerUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-brand-green text-white rounded-md font-medium hover:bg-green-600">
                                            Click here to download the PDF file.
                                        </a>
                                    </div>
                                </object>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
