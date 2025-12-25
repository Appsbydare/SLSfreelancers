import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - List taskers/sellers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'rating';

    let query = supabaseServer
      .from('taskers')
      .select(`
        *,
        user:users!taskers_user_id_fkey (
          id,
          first_name,
          last_name,
          profile_image_url,
          created_at
        )
      `);

    // Sort
    if (sortBy === 'rating') {
      query = query.order('rating', { ascending: false });
    } else if (sortBy === 'completed_tasks') {
      query = query.order('completed_tasks', { ascending: false });
    }

    // Only show sellers with ratings and completed tasks
    query = query.gt('rating', 0).gt('completed_tasks', 0);

    // Limit
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching taskers:', error);
      throw error;
    }

    return NextResponse.json({ taskers: data || [] });
  } catch (error) {
    console.error('List taskers error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch sellers' },
      { status: 500 }
    );
  }
}

