import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import sampleGigsData from '@/data/sample-gigs.json';

// GET - List/search gigs with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const deliveryTime = searchParams.get('deliveryTime'); // max days
    const sellerLevel = searchParams.get('sellerLevel');
    const district = searchParams.get('district');
    const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, price_low, price_high, rating, newest
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseServer
      .from('gigs')
      .select(`
        *,
        seller:taskers!gigs_seller_id_fkey (
          id,
          level_code,
          rating,
          completed_tasks,
          user:users!taskers_user_id_fkey (
            id,
            first_name,
            last_name,
            profile_image_url
          )
        ),
        packages:gig_packages (
          id,
          tier,
          price,
          delivery_days
        )
      `, { count: 'exact' })
      .eq('status', 'active');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    if (district) {
      // Filter by seller service area - first get tasker IDs
      const { data: serviceAreaData } = await supabaseServer
        .from('tasker_service_areas')
        .select('tasker_id')
        .eq('district', district);
      
      if (serviceAreaData && serviceAreaData.length > 0) {
        const taskerIds = serviceAreaData.map((area: any) => area.tasker_id);
        query = query.in('seller_id', taskerIds);
      } else {
        // No taskers in this district, return empty result
        return NextResponse.json({
          gigs: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }
    }

    if (sellerLevel) {
      query = query.eq('seller.level_code', sellerLevel);
    }

    // Sorting
    switch (sortBy) {
      case 'price_low':
        // Sort by minimum package price (will need post-processing)
        break;
      case 'price_high':
        // Sort by maximum package price (will need post-processing)
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('orders_count', { ascending: false });
        break;
      default: // relevance
        query = query.order('is_featured', { ascending: false })
                     .order('rating', { ascending: false })
                     .order('orders_count', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    // Post-process results for price filtering and sorting
    let gigs = data || [];

    // If there's an error or no data, use sample data as fallback
    if (error || gigs.length === 0) {
      if (error) {
        console.log('Error fetching gigs from database, using sample data as fallback:', error.message);
      } else {
        console.log('No gigs found in database, using sample data as fallback');
      }
      // Only use fallback if no specific filters are applied
      if (!category && !search && !district) {
        gigs = generateSampleGigsFromJSON(sampleGigsData, limit);
      }
    }

    // Apply price filters if provided
    if (minPrice || maxPrice) {
      gigs = gigs.filter((gig: any) => {
        const prices = gig.packages?.map((p: any) => p.price) || [];
        const minGigPrice = Math.min(...prices);
        const maxGigPrice = Math.max(...prices);

        if (minPrice && maxGigPrice < parseFloat(minPrice)) return false;
        if (maxPrice && minGigPrice > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    // Apply delivery time filter
    if (deliveryTime) {
      const maxDeliveryDays = parseInt(deliveryTime);
      gigs = gigs.filter((gig: any) => {
        const deliveryDays = gig.packages?.map((p: any) => p.delivery_days) || [];
        const minDeliveryDays = Math.min(...deliveryDays);
        return minDeliveryDays <= maxDeliveryDays;
      });
    }

    // Add computed fields
    gigs = gigs.map((gig: any) => {
      const prices = gig.packages?.map((p: any) => p.price) || [];
      return {
        ...gig,
        startingPrice: prices.length > 0 ? Math.min(...prices) : 0,
        sellerName: `${gig.seller?.user?.first_name || ''} ${gig.seller?.user?.last_name || ''}`.trim(),
        sellerAvatar: gig.seller?.user?.profile_image_url,
        sellerLevel: gig.seller?.level_code || 'starter_pro',
        sellerRating: gig.seller?.rating || 0,
      };
    });

    // Sort by price if needed
    if (sortBy === 'price_low') {
      gigs.sort((a: any, b: any) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price_high') {
      gigs.sort((a: any, b: any) => b.startingPrice - a.startingPrice);
    }

    // Determine if we're using sample data
    const isUsingSampleData = gigs.length > 0 && gigs[0]?.id?.startsWith('sample-gig-');
    
    return NextResponse.json({
      gigs,
      pagination: {
        page,
        limit,
        total: isUsingSampleData ? gigs.length : (count || 0),
        totalPages: isUsingSampleData ? 1 : Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Gigs list error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch gigs' },
      { status: 500 }
    );
  }
}

// POST - Create a new gig
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId, // user ID from auth
      title,
      description,
      category,
      subcategory,
      tags,
      images,
      deliveryType,
    } = body;

    // Validation
    if (!userId || !title || !description || !category) {
      return NextResponse.json(
        { message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Get tasker (seller) data
    const { data: taskerData, error: taskerError } = await supabaseServer
      .from('taskers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (taskerError || !taskerData) {
      return NextResponse.json(
        { message: 'Seller profile not found. Please complete your profile first.' },
        { status: 404 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();

    // Create gig
    const { data: gigData, error: gigError } = await supabaseServer
      .from('gigs')
      .insert({
        seller_id: taskerData.id,
        title: title.trim(),
        slug,
        description: description.trim(),
        category,
        subcategory: subcategory || null,
        tags: tags || [],
        images: images || [],
        delivery_type: deliveryType || 'service',
        status: 'draft', // Starts as draft
      })
      .select()
      .single();

    if (gigError) {
      console.error('Error creating gig:', gigError);
      throw gigError;
    }

    return NextResponse.json(
      {
        message: 'Gig created successfully',
        gig: gigData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create gig error:', error);
    return NextResponse.json(
      { message: 'Failed to create gig' },
      { status: 500 }
    );
  }
}

// Random names for sellers (individual and company names)
const randomSellerNames = [
  // Individual names
  'Kamal Perera', 'Nimal Fernando', 'Priya Silva', 'Samantha Jayasuriya', 'Dilshan Wickramasinghe',
  'Anjali Mendis', 'Rohan De Silva', 'Tharushi Gunawardena', 'Chaminda Bandara', 'Ishara Karunaratne',
  'Sanduni Perera', 'Dinesh Fernando', 'Kavindu Rajapaksa', 'Nadeesha Jayawardena', 'Tharindu Weerasinghe',
  // Company names
  'ProClean Services', 'Expert Solutions Ltd', 'QuickFix Professionals', 'Elite Home Services', 'Premium Care Co',
  'Master Craftsmen', 'Ace Handyman Services', 'Top Tier Solutions', 'Prime Service Group', 'Quality First Services',
  'Reliable Repairs Co', 'Professional Touch', 'Best Value Services', 'Trusted Experts Ltd', 'Superior Solutions'
];

// Helper function to get random seller name
function getRandomSellerName(index: number): string {
  return randomSellerNames[index % randomSellerNames.length];
}

// Helper function to determine if seller should be verified (randomly)
function shouldBeVerified(index: number): boolean {
  // 60% chance of being verified
  return (index % 5) < 3;
}

// Helper function to determine if seller should have EasyFinders Choice badge
function shouldHaveEasyFindersChoice(index: number): boolean {
  // 30% chance (every 3rd or 4th seller)
  return index % 3 === 0 || index % 4 === 0;
}

// Helper function to get seller level based on rating and featured status
function getSellerLevel(rating: number, isFeatured: boolean, index: number): 'starter_pro' | 'trusted_specialist' | 'secure_elite' | 'top_performer' {
  if (isFeatured || rating >= 4.8) {
    return 'top_performer';
  } else if (rating >= 4.6) {
    return 'secure_elite';
  } else if (rating >= 4.3) {
    return 'trusted_specialist';
  } else {
    return 'starter_pro';
  }
}

// Helper function to generate sample gigs from JSON data
function generateSampleGigsFromJSON(sampleData: any[], limit: number) {
  return sampleData.slice(0, limit).map((gigData, index) => {
    const minPrice = Math.min(...gigData.packages.map((p: any) => p.price));
    const sellerName = getRandomSellerName(index);
    const sellerLevel = getSellerLevel(gigData.rating || 4.5, gigData.isFeatured || false, index);
    const isVerified = shouldBeVerified(index);
    const hasEasyFindersChoice = shouldHaveEasyFindersChoice(index);
    
    return {
      id: `sample-gig-${index + 1}`,
      seller_id: `sample-seller-${index + 1}`,
      title: gigData.title,
      slug: gigData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${index + 1}`,
      description: gigData.description,
      category: gigData.category,
      tags: gigData.tags || [],
      images: gigData.images || [],
      status: 'active',
      delivery_type: gigData.deliveryType || 'service',
      is_featured: gigData.isFeatured || false,
      views_count: Math.floor(Math.random() * 500) + 50,
      orders_count: gigData.ordersCount || 0,
      rating: gigData.rating || 4.5,
      reviews_count: gigData.reviewsCount || 0,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      seller: {
        id: `sample-seller-${index + 1}`,
        level_code: sellerLevel,
        rating: gigData.rating || 4.5,
        completed_tasks: gigData.ordersCount || 0,
        is_verified: isVerified,
        user: {
          id: `sample-user-${index + 1}`,
          first_name: sellerName.split(' ')[0] || 'Seller',
          last_name: sellerName.split(' ').slice(1).join(' ') || '',
          profile_image_url: null,
        },
      },
      packages: gigData.packages.map((pkg: any, pkgIndex: number) => ({
        id: `sample-package-${index + 1}-${pkgIndex}`,
        tier: pkg.tier,
        price: pkg.price,
        delivery_days: pkg.deliveryDays,
      })),
      startingPrice: minPrice,
      sellerName: sellerName,
      sellerAvatar: null,
      sellerLevel: sellerLevel,
      sellerRating: gigData.rating || 4.5,
      isVerified: isVerified,
      hasEasyFindersChoice: hasEasyFindersChoice,
    };
  });
}

