import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - Get single gig with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gigIdOrSlug } = await params;

    // Check if this is a slug (contains hyphens and doesn't look like a UUID)
    const isSlug = gigIdOrSlug.includes('-') && !gigIdOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    const { data: gigData, error: gigError } = await supabaseServer
      .from('gigs')
      .select(`
        *,
        seller:taskers!gigs_seller_id_fkey (
          id,
          level_code,
          rating,
          completed_tasks,
          response_time_minutes,
          bio,
          user:users!taskers_user_id_fkey (
            id,
            first_name,
            last_name,
            profile_image_url,
            created_at
          )
        ),
        packages:gig_packages (
          id,
          tier,
          name,
          description,
          price,
          delivery_days,
          revisions,
          features
        ),
        requirements:gig_requirements (
          id,
          question,
          answer_type,
          options,
          is_required,
          sort_order
        )
      `)
      .eq(isSlug ? 'slug' : 'id', gigIdOrSlug)
      .single();

    if (gigError || !gigData) {
      return NextResponse.json(
        { message: 'Gig not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await supabaseServer
      .from('gigs')
      .update({ views_count: (gigData.views_count || 0) + 1 })
      .eq('id', gigData.id);

    // Get seller's service areas
    const { data: serviceAreas } = await supabaseServer
      .from('tasker_service_areas')
      .select('district, city')
      .eq('tasker_id', gigData.seller.id);

    // Get reviews for this seller
    const { data: reviews } = await supabaseServer
      .from('reviews')
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey (
          first_name,
          last_name,
          profile_image_url
        )
      `)
      .eq('reviewee_id', gigData.seller.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Format response
    const formattedGig = {
      ...gigData,
      sellerName: `${gigData.seller?.user?.first_name || ''} ${gigData.seller?.user?.last_name || ''}`.trim(),
      sellerAvatar: gigData.seller?.user?.profile_image_url,
      sellerLevel: gigData.seller?.level_code || 'starter_pro',
      sellerRating: gigData.seller?.rating || 0,
      sellerCompletedTasks: gigData.seller?.completed_tasks || 0,
      sellerResponseTime: gigData.seller?.response_time_minutes || 0,
      sellerBio: gigData.seller?.bio,
      sellerMemberSince: gigData.seller?.user?.created_at,
      sellerServiceAreas: serviceAreas || [],
      reviews: reviews || [],
      packages: (gigData.packages || []).sort((a: any, b: any) => {
        const tierOrder = { basic: 1, standard: 2, premium: 3 };
        return (tierOrder[a.tier as keyof typeof tierOrder] || 0) -
          (tierOrder[b.tier as keyof typeof tierOrder] || 0);
      }),
      requirements: (gigData.requirements || []).sort((a: any, b: any) =>
        (a.sort_order || 0) - (b.sort_order || 0)
      ),
    };

    return NextResponse.json({ gig: formattedGig });
  } catch (error) {
    console.error('Get gig error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch gig' },
      { status: 500 }
    );
  }
}

// PUT - Update gig
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gigId } = await params;
    const body = await request.json();
    const {
      userId,
      title,
      description,
      category,
      subcategory,
      tags,
      images,
      deliveryType,
      status,
    } = body;

    // Verify ownership
    const { data: gigData, error: checkError } = await supabaseServer
      .from('gigs')
      .select('seller_id')
      .eq('id', gigId)
      .single();

    if (checkError || !gigData) {
      return NextResponse.json(
        { message: 'Gig not found' },
        { status: 404 }
      );
    }

    // Get tasker to verify user_id
    const { data: taskerData, error: taskerError } = await supabaseServer
      .from('taskers')
      .select('user_id')
      .eq('id', gigData.seller_id)
      .single();

    if (taskerError || !taskerData) {
      return NextResponse.json(
        { message: 'Seller not found' },
        { status: 404 }
      );
    }

    if (taskerData.user_id !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update gig
    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (category) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (tags) updateData.tags = tags;
    if (images) updateData.images = images;
    if (deliveryType) updateData.delivery_type = deliveryType;
    if (status) updateData.status = status;

    const { data: updatedGig, error: updateError } = await supabaseServer
      .from('gigs')
      .update(updateData)
      .eq('id', gigId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating gig:', updateError);
      throw updateError;
    }

    return NextResponse.json({
      message: 'Gig updated successfully',
      gig: updatedGig,
    });
  } catch (error) {
    console.error('Update gig error:', error);
    return NextResponse.json(
      { message: 'Failed to update gig' },
      { status: 500 }
    );
  }
}

// DELETE - Delete gig
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gigId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: gigData, error: checkError } = await supabaseServer
      .from('gigs')
      .select('seller_id')
      .eq('id', gigId)
      .single();

    if (checkError || !gigData) {
      return NextResponse.json(
        { message: 'Gig not found' },
        { status: 404 }
      );
    }

    // Get tasker to verify user_id
    const { data: taskerData, error: taskerError } = await supabaseServer
      .from('taskers')
      .select('user_id')
      .eq('id', gigData.seller_id)
      .single();

    if (taskerError || !taskerData) {
      return NextResponse.json(
        { message: 'Seller not found' },
        { status: 404 }
      );
    }

    if (taskerData.user_id !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if there are active orders
    const { data: activeOrders, error: ordersError } = await supabaseServer
      .from('orders')
      .select('id')
      .eq('gig_id', gigId)
      .in('status', ['pending', 'in_progress', 'delivered', 'revision_requested']);

    if (ordersError) {
      throw ordersError;
    }

    if (activeOrders && activeOrders.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete gig with active orders. Please complete or cancel all orders first.' },
        { status: 400 }
      );
    }

    // Delete gig (cascade will delete packages and requirements)
    const { error: deleteError } = await supabaseServer
      .from('gigs')
      .delete()
      .eq('id', gigId);

    if (deleteError) {
      console.error('Error deleting gig:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({
      message: 'Gig deleted successfully',
    });
  } catch (error) {
    console.error('Delete gig error:', error);
    return NextResponse.json(
      { message: 'Failed to delete gig' },
      { status: 500 }
    );
  }
}

