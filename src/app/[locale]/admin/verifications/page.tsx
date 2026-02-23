import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import VerificationsList from './VerificationsList';

export const revalidate = 0;

export default async function AdminVerificationsPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );

    const { data: verifications, error } = await supabase
        .from('verifications')
        .select(`
            id,
            user_id,
            verification_type,
            status,
            submitted_at,
            document_url,
            metadata,
            user:users!verifications_user_id_fkey(first_name, last_name, email)
        `)
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Error fetching verifications:', error);
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Document Verifications</h1>
                    <p className="text-sm text-gray-500 mt-1">Review tasker ID documents, licenses, and certifications.</p>
                </div>
            </div>

            <VerificationsList verifications={(verifications as any) || []} />
        </div>
    );
}
