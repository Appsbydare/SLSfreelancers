import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// GET - List orders (buyer or seller view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType'); // 'customer' or 'seller'
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (!userId || !userType) {
      return NextResponse.json(
        { message: 'User ID and type required' },
        { status: 400 }
      );
    }

    let query = supabaseServer
      .from('orders')
      .select(`
        *,
        customer:customers!orders_customer_id_fkey (
          id,
          user:users!customers_user_id_fkey (
            id,
            first_name,
            last_name,
            profile_image_url
          )
        ),
        seller:taskers!orders_seller_id_fkey (
          id,
          level_code,
          user:users!taskers_user_id_fkey (
            id,
            first_name,
            last_name,
            profile_image_url
          )
        ),
        gig:gigs (
          id,
          title,
          images
        ),
        package:gig_packages (
          tier,
          name,
          delivery_days
        )
      `, { count: 'exact' });

    // Filter by user type
    if (userType === 'customer') {
      // Get customer ID from user ID
      const { data: customerData } = await supabaseServer
        .from('customers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (customerData) {
        query = query.eq('customer_id', customerData.id);
      }
    } else if (userType === 'seller') {
      // Get seller/tasker ID from user ID
      const { data: taskerData } = await supabaseServer
        .from('taskers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (taskerData) {
        query = query.eq('seller_id', taskerData.id);
      }
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }

    // Format orders
    const formattedOrders = (data || []).map((order: any) => ({
      ...order,
      customerName: `${order.customer?.user?.first_name || ''} ${order.customer?.user?.last_name || ''}`.trim(),
      customerAvatar: order.customer?.user?.profile_image_url,
      sellerName: `${order.seller?.user?.first_name || ''} ${order.seller?.user?.last_name || ''}`.trim(),
      sellerAvatar: order.seller?.user?.profile_image_url,
      sellerLevel: order.seller?.level_code,
      gigTitle: order.gig?.title,
      gigImage: order.gig?.images?.[0],
      packageName: order.package?.name,
      packageTier: order.package?.tier,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create a new order (purchase gig)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId, // customer user ID
      gigId,
      packageId,
      requirementsResponse,
    } = body;

    if (!userId || !gigId || !packageId) {
      return NextResponse.json(
        { message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Get customer ID
    const { data: customerData, error: customerError } = await supabaseServer
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (customerError || !customerData) {
      return NextResponse.json(
        { message: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Get gig and package details
    const { data: gigData, error: gigError } = await supabaseServer
      .from('gigs')
      .select(`
        *,
        seller_id,
        packages:gig_packages!inner (
          id,
          tier,
          price,
          delivery_days
        )
      `)
      .eq('id', gigId)
      .eq('packages.id', packageId)
      .eq('status', 'active')
      .single();

    if (gigError || !gigData) {
      return NextResponse.json(
        { message: 'Gig or package not found' },
        { status: 404 }
      );
    }

    const selectedPackage = gigData.packages[0];
    const totalAmount = parseFloat(selectedPackage.price);
    const platformFee = totalAmount * 0.15; // 15% platform fee
    const sellerEarnings = totalAmount - platformFee;

    // Calculate delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + selectedPackage.delivery_days);

    // Create order
    const { data: orderData, error: orderError } = await supabaseServer
      .from('orders')
      .insert({
        order_number: generateOrderNumber(),
        customer_id: customerData.id,
        seller_id: gigData.seller_id,
        gig_id: gigId,
        package_id: packageId,
        package_tier: selectedPackage.tier,
        total_amount: totalAmount,
        platform_fee: platformFee,
        seller_earnings: sellerEarnings,
        status: 'pending',
        requirements_response: requirementsResponse || {},
        delivery_date: deliveryDate.toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }

    // Update gig orders count
    await supabaseServer
      .from('gigs')
      .update({ 
        orders_count: (gigData.orders_count || 0) + 1 
      })
      .eq('id', gigId);

    // Create notification for seller
    const { data: sellerUser } = await supabaseServer
      .from('users')
      .select('id')
      .eq('id', (await supabaseServer
        .from('taskers')
        .select('user_id')
        .eq('id', gigData.seller_id)
        .single()
      ).data?.user_id)
      .single();

    if (sellerUser) {
      await supabaseServer
        .from('notifications')
        .insert({
          user_id: sellerUser.id,
          notification_type: 'task',
          title: 'New Order Received!',
          message: `You have a new order for "${gigData.title}"`,
          data: {
            order_id: orderData.id,
            order_number: orderData.order_number,
            gig_id: gigId,
          },
        });
    }

    return NextResponse.json(
      {
        message: 'Order created successfully',
        order: orderData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { message: 'Failed to create order' },
      { status: 500 }
    );
  }
}

