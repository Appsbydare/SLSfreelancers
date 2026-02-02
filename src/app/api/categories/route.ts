import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - List all categories
export async function GET() {
    try {
        const { data: categories, error } = await supabaseServer
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }

        return NextResponse.json({ categories: categories || [] });
    } catch (error) {
        console.error('Categories API error:', error);
        return NextResponse.json(
            { message: 'Failed to fetch categories', categories: [] },
            { status: 500 }
        );
    }
}
