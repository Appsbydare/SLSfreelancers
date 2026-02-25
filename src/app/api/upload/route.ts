import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase Service Role credentials');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,            
        persistSession: false,
    },
});

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bucket = formData.get('bucket') as string;
        const path = formData.get('path') as string;

        if (!file || !bucket || !path) {
            return NextResponse.json(
                { message: 'Missing file, bucket, or path' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload using admin client (bypasses RLS)
        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (error) {
            console.error('Supabase storage upload error:', error);
            return NextResponse.json(
                { message: error.message },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(path);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: data.path,
        });

    } catch (error) {
        console.error('Upload handler error:', error);
        return NextResponse.json(
            { message: 'Internal server error during upload' },
            { status: 500 }
        );
    }
}
