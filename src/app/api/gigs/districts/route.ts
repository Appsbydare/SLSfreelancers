import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // 1. Get all active gigs with their seller_id
    const { data: gigs, error: gigsError } = await supabaseServer
      .from('gigs')
      .select('id, seller_id')
      .eq('status', 'active');

    if (gigsError) throw gigsError;

    // 2. Get all service areas
    const { data: serviceAreas, error: areasError } = await supabaseServer
      .from('tasker_service_areas')
      .select('tasker_id, district');

    if (areasError) throw areasError;

    // 3. Aggregate counts
    const districtCounts: Record<string, number> = {};
    
    // Create a map of tasker_id -> districts[]
    const taskerDistricts: Record<string, string[]> = {};
    serviceAreas?.forEach(area => {
      if (!taskerDistricts[area.tasker_id]) {
        taskerDistricts[area.tasker_id] = [];
      }
      taskerDistricts[area.tasker_id].push(area.district);
    });

    // Iterate gigs and increment counts for each district the seller serves
    gigs?.forEach(gig => {
      const districts = taskerDistricts[gig.seller_id] || [];
      districts.forEach(district => {
        // Normalize district name (capitalize first letter) if needed, 
        // but assuming DB has consistent casing or we match what's in districts.ts
        const normalizedDistrict = district; 
        districtCounts[normalizedDistrict] = (districtCounts[normalizedDistrict] || 0) + 1;
      });
    });

    return NextResponse.json({ districtCounts });
  } catch (error) {
    console.error('Error fetching district stats:', error);
    return NextResponse.json({ districtCounts: {} }, { status: 500 });
  }
}
