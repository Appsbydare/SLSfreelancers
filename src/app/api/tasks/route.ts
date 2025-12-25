import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - Fetch tasks with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const district = searchParams.get('district');
    const customerId = searchParams.get('customerId');
    const taskerId = searchParams.get('taskerId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseServer
      .from('tasks')
      .select(`
        *,
        customer:customers!tasks_customer_id_fkey (
          *,
          user:users!customers_user_id_fkey (*)
        ),
        assigned_tasker:taskers!tasks_assigned_tasker_id_fkey (
          *,
          user:users!taskers_user_id_fkey (*)
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (district) {
      query = query.eq('district', district);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (taskerId) {
      query = query.eq('assigned_tasker_id', taskerId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return NextResponse.json(
      {
        tasks: data,
        total: count,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      title,
      description,
      category,
      location,
      city,
      district,
      budgetMin,
      budgetMax,
      scheduledDate,
      scheduledTime,
      duration,
      images,
      requirements,
    } = body;

    // Validation
    if (!customerId || !title || !description || !category || !district) {
      return NextResponse.json(
        { message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Get customer data to verify it exists
    const { data: customerData, error: customerError } = await supabaseServer
      .from('customers')
      .select('id')
      .eq('user_id', customerId)
      .single();

    if (customerError || !customerData) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Create task
    const { data: taskData, error: taskError } = await supabaseServer
      .from('tasks')
      .insert({
        customer_id: customerData.id,
        title,
        description,
        category,
        location,
        city,
        district,
        budget_min: budgetMin,
        budget_max: budgetMax,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        estimated_duration: duration,
        images: images || [],
        requirements: requirements || {},
        status: 'open',
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      throw taskError;
    }

    return NextResponse.json(
      {
        message: 'Task created successfully',
        task: taskData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { message: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PUT - Update a task
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, ...updates } = body;

    if (!taskId) {
      return NextResponse.json(
        { message: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Update task
    const { data: taskData, error: taskError } = await supabaseServer
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (taskError) {
      console.error('Error updating task:', taskError);
      throw taskError;
    }

    return NextResponse.json(
      {
        message: 'Task updated successfully',
        task: taskData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { message: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { message: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Delete task (this will cascade to related records based on schema)
    const { error } = await supabaseServer
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { message: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

