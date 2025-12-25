import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - Fetch reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskerId = searchParams.get('taskerId');
    const customerId = searchParams.get('customerId');
    const taskId = searchParams.get('taskId');

    let query = supabaseServer
      .from('reviews')
      .select(`
        *,
        task:tasks (*),
        reviewer:users!reviews_reviewer_id_fkey (*),
        reviewee:users!reviews_reviewee_id_fkey (*)
      `)
      .order('created_at', { ascending: false });

    if (taskerId) {
      query = query.eq('reviewee_id', taskerId);
    }

    if (customerId) {
      query = query.eq('reviewer_id', customerId);
    }

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }

    return NextResponse.json({ reviews: data }, { status: 200 });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, reviewerId, revieweeId, rating, comment } = body;

    if (!taskId || !reviewerId || !revieweeId || !rating) {
      return NextResponse.json(
        { message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if review already exists
    const { data: existingReview } = await supabaseServer
      .from('reviews')
      .select('id')
      .eq('task_id', taskId)
      .eq('reviewer_id', reviewerId)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { message: 'You have already reviewed this task' },
        { status: 400 }
      );
    }

    // Create review
    const { data: reviewData, error: reviewError } = await supabaseServer
      .from('reviews')
      .insert({
        task_id: taskId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating,
        comment,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      throw reviewError;
    }

    // Update tasker's average rating
    const { data: reviews } = await supabaseServer
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', revieweeId);

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      await supabaseServer
        .from('taskers')
        .update({
          rating: avgRating,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', revieweeId);
    }

    return NextResponse.json(
      {
        message: 'Review submitted successfully',
        review: reviewData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { message: 'Failed to create review' },
      { status: 500 }
    );
  }
}

