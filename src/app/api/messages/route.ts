import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - Fetch messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const senderId = searchParams.get('senderId');
    const receiverId = searchParams.get('receiverId');

    if (!taskId && !senderId && !receiverId) {
      return NextResponse.json(
        { message: 'At least one filter parameter is required' },
        { status: 400 }
      );
    }

    let query = supabaseServer
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (*),
        receiver:users!messages_receiver_id_fkey (*),
        task:tasks (*)
      `)
      .order('created_at', { ascending: true });

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    if (senderId && receiverId) {
      query = query.or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`);
    } else if (senderId) {
      query = query.eq('sender_id', senderId);
    } else if (receiverId) {
      query = query.eq('receiver_id', receiverId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return NextResponse.json({ messages: data }, { status: 200 });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, senderId, receiverId, message } = body;

    if (!senderId || !receiverId || !message) {
      return NextResponse.json(
        { message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Create message
    const { data: messageData, error: messageError } = await supabaseServer
      .from('messages')
      .insert({
        task_id: taskId,
        sender_id: senderId,
        receiver_id: receiverId,
        message,
        is_read: false,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error sending message:', messageError);
      throw messageError;
    }

    return NextResponse.json(
      {
        message: 'Message sent successfully',
        data: messageData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { message: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// PUT - Mark message as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { message: 'Message ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('messages')
      .update({
        is_read: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating message:', error);
      throw error;
    }

    return NextResponse.json(
      {
        message: 'Message marked as read',
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json(
      { message: 'Failed to update message' },
      { status: 500 }
    );
  }
}

