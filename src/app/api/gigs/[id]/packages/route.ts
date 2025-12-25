import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - Get packages for a gig
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gigId } = await params;

    const { data, error } = await supabaseServer
      .from('gig_packages')
      .select('*')
      .eq('gig_id', gigId)
      .order('tier');

    if (error) {
      console.error('Error fetching packages:', error);
      throw error;
    }

    // Sort by tier order
    const sortedPackages = (data || []).sort((a, b) => {
      const tierOrder = { basic: 1, standard: 2, premium: 3 };
      return (tierOrder[a.tier as keyof typeof tierOrder] || 0) - 
             (tierOrder[b.tier as keyof typeof tierOrder] || 0);
    });

    return NextResponse.json({ packages: sortedPackages });
  } catch (error) {
    console.error('Get packages error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

// POST - Create/Update multiple packages (batch)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gigId } = await params;
    const body = await request.json();
    const { userId, packages } = body;

    if (!userId || !packages || !Array.isArray(packages)) {
      return NextResponse.json(
        { message: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Verify gig ownership
    const { data: gigData, error: gigError } = await supabaseServer
      .from('gigs')
      .select('seller_id')
      .eq('id', gigId)
      .single();

    if (gigError || !gigData) {
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

    // Delete existing packages
    await supabaseServer
      .from('gig_packages')
      .delete()
      .eq('gig_id', gigId);

    // Insert new packages
    const packagesData = packages.map((pkg: any) => ({
      gig_id: gigId,
      tier: pkg.tier,
      name: pkg.name || `${pkg.tier.charAt(0).toUpperCase() + pkg.tier.slice(1)} Package`,
      description: pkg.description || null,
      price: pkg.price,
      delivery_days: pkg.deliveryDays,
      revisions: pkg.revisions === 'unlimited' ? null : pkg.revisions,
      features: pkg.features || [],
    }));

    const { data: insertedPackages, error: insertError } = await supabaseServer
      .from('gig_packages')
      .insert(packagesData)
      .select();

    if (insertError) {
      console.error('Error creating packages:', insertError);
      throw insertError;
    }

    return NextResponse.json({
      message: 'Packages saved successfully',
      packages: insertedPackages,
    });
  } catch (error) {
    console.error('Create packages error:', error);
    return NextResponse.json(
      { message: 'Failed to save packages' },
      { status: 500 }
    );
  }
}

