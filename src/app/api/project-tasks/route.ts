import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROJECT_TASKS_FILE = path.join(process.cwd(), 'data', 'project-tasks.json');

interface ProjectTask {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: string;
  completedAt?: string;
}

function readProjectTasks(): ProjectTask[] {
  try {
    if (!fs.existsSync(PROJECT_TASKS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(PROJECT_TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading project tasks file:', error);
    return [];
  }
}

function writeProjectTasks(tasks: ProjectTask[]): void {
  try {
    const dataDir = path.dirname(PROJECT_TASKS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(PROJECT_TASKS_FILE, JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error('Error writing project tasks file:', error);
    throw new Error('Failed to save project tasks data');
  }
}

export async function GET() {
  try {
    const tasks = readProjectTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { taskId, status } = await request.json();

    if (!taskId || !status) {
      return NextResponse.json(
        { message: 'Task ID and status are required' },
        { status: 400 }
      );
    }

    const tasks = readProjectTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    tasks[taskIndex].status = status;
    
    if (status === 'completed' && !tasks[taskIndex].completedAt) {
      tasks[taskIndex].completedAt = new Date().toISOString();
    }

    if (status !== 'completed' && tasks[taskIndex].completedAt) {
      delete tasks[taskIndex].completedAt;
    }

    writeProjectTasks(tasks);

    return NextResponse.json(
      { 
        message: 'Task status updated successfully',
        task: tasks[taskIndex]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating project task:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
