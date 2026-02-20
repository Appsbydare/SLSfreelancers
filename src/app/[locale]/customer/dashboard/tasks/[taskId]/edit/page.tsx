'use client';

import { useState, useEffect, useActionState } from 'react';
import { ArrowRight, DollarSign, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { updateTask } from '@/app/actions/tasks';
import { notFound } from 'next/navigation';

interface EditTaskPageProps {
    params: Promise<{
        taskId: string;
        locale: string;
    }>;
}

// We initially don't have task data, so we'll fetch it on client or pass it from server component if possible.
// Better to make this a client component that fetches data or receives it.
// To reuse the action, we face a small issue: the action expects FormData.
// Let's make the page async server component (to fetch data) and client form inside.

// Actually, let's stick to the plan: Create Edit Page reusing post-task logic.
// We need to fetch the existing task first.

// import { createClient } from '@/utils/supabase/client'; // removed unused

export default function EditTaskPageWrapper({ params }: EditTaskPageProps) {
    // We can't use async component easily if we want to use efficient client hook for form state
    // but we can fetch data in a parent component or use useEffect.
    // Let's use a client component for the whole page for simplicity in "Reuse", 
    // but fetching initial data is better done server side if we were strict. 
    // Given the previous pattern in `post-task`, let's do a Client Component that fetches data on mount 
    // (or better: fetching in Server Component parent is cleaner in Next.js 14).

    // Changing approach: This file will be Server Component. 
    // It fetches data, then passes to a Client Form.
    return <EditTaskLoader params={params} />;
}

import { getTaskById } from '@/app/actions/tasks';
import EditTaskForm from './EditTaskForm';

async function EditTaskLoader({ params }: EditTaskPageProps) {
    const { taskId } = await params;
    const task = await getTaskById(taskId);

    if (!task) {
        notFound();
    }

    return <EditTaskForm task={task} />;
}
