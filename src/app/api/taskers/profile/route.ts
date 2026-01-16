import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      bio,
      categories,
      skills,
      serviceAreas,
      hourlyRate,
      profileImageUrl,
      portfolioUrls,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if tasker record exists, if not create it (for upgrading customers)
    const { data: existingTasker } = await supabaseServer
      .from('taskers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let taskerId;

    if (!existingTasker) {
      // Create new tasker record for upgrading customer
      const { data: newTasker, error: createError } = await supabaseServer
        .from('taskers')
        .insert({
          user_id: userId,
          bio,
          skills,
          hourly_rate: hourlyRate,
          profile_image_url: profileImageUrl,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating tasker:', createError);
        throw createError;
      }

      taskerId = newTasker.id;

      // Update user_type to tasker
      await supabaseServer
        .from('users')
        .update({ user_type: 'tasker' })
        .eq('id', userId);
    } else {
      // Update existing tasker profile
      const { data: taskerData, error: taskerError } = await supabaseServer
        .from('taskers')
        .update({
          bio,
          skills,
          hourly_rate: hourlyRate,
          profile_image_url: profileImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (taskerError) {
        console.error('Error updating tasker:', taskerError);
        throw taskerError;
      }

      taskerId = taskerData.id;
    }

    // Delete existing skills and insert new ones
    await supabaseServer
      .from('tasker_skills')
      .delete()
      .eq('tasker_id', taskerId);

    if (categories && categories.length > 0) {
      const skillsToInsert = categories.map((category: string) => ({
        tasker_id: taskerId,
        skill_name: category,
        experience_years: 0,
      }));

      const { error: skillsError } = await supabaseServer
        .from('tasker_skills')
        .insert(skillsToInsert);

      if (skillsError) {
        console.error('Error inserting skills:', skillsError);
      }
    }

    // Delete existing service areas and insert new ones
    await supabaseServer
      .from('tasker_service_areas')
      .delete()
      .eq('tasker_id', taskerId);

    if (serviceAreas && serviceAreas.length > 0) {
      const areasToInsert = serviceAreas.map((district: string) => ({
        tasker_id: taskerId,
        district,
      }));

      const { error: areasError } = await supabaseServer
        .from('tasker_service_areas')
        .insert(areasToInsert);

      if (areasError) {
        console.error('Error inserting service areas:', areasError);
      }
    }

    // Delete existing portfolio and insert new ones
    await supabaseServer
      .from('tasker_portfolio')
      .delete()
      .eq('tasker_id', taskerId);

    if (portfolioUrls && portfolioUrls.length > 0) {
      const portfolioToInsert = portfolioUrls.map((url: string, index: number) => ({
        tasker_id: taskerId,
        image_urls: [url],
        title: `Portfolio Image ${index + 1}`,
        description: '',
      }));

      const { error: portfolioError } = await supabaseServer
        .from('tasker_portfolio')
        .insert(portfolioToInsert);

      if (portfolioError) {
        console.error('Error inserting portfolio:', portfolioError);
      }
    }

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        taskerId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get tasker profile with related data
    const { data: taskerData, error: taskerError } = await supabaseServer
      .from('taskers')
      .select(`
        *,
        tasker_skills (*),
        tasker_service_areas (*),
        tasker_portfolio (*)
      `)
      .eq('user_id', userId)
      .single();

    if (taskerError) {
      console.error('Error fetching tasker:', taskerError);
      throw taskerError;
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      throw userError;
    }

    return NextResponse.json(
      {
        tasker: taskerData,
        user: userData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

