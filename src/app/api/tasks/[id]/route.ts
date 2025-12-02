import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;

    // Fetch task with all related data
    const { data: taskData, error: taskError } = await supabaseServer
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
        ),
        offers:offers (
          *,
          tasker:taskers!offers_tasker_id_fkey (
            *,
            user:users!taskers_user_id_fkey (*)
          )
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('Error fetching task:', taskError);
      
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Task not found' },
          { status: 404 }
        );
      }
      
      throw taskError;
    }

    return NextResponse.json({ task: taskData }, { status: 200 });
  } catch (error) {
    console.error('Fetch task error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

