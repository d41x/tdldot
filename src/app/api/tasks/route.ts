// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TodoistAdapter, UnifiedTask } from '../../../lib/adapters/todoist';

// レート制限管理
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (userLimit.count >= 100) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// GET /api/tasks - 全タスク取得
export async function GET(request: NextRequest) {
  try {
    console.log('API called: GET /api/tasks');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const serviceType = searchParams.get('service') || 'todoist';

    console.log('Request params:', { userId, serviceType });

    if (!userId) {
      console.log('Error: user_id is required');
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // レート制限チェック
    if (!checkRateLimit(userId)) {
      console.log('Error: Rate limit exceeded');
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retry_after: 60 
        },
        { status: 429 }
      );
    }

    // 認証トークン取得
    const apiToken = request.headers.get('x-todoist-token');
    console.log('API token present:', !!apiToken);
    
    if (!apiToken) {
      console.log('Error: Authentication token required');
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    // サービス別のアダプター取得
    let adapter;
    switch (serviceType) {
      case 'todoist':
        console.log('Creating Todoist adapter...');
        adapter = new TodoistAdapter(apiToken);
        break;
      default:
        console.log('Error: Unsupported service:', serviceType);
        return NextResponse.json(
          { error: `Unsupported service: ${serviceType}` },
          { status: 400 }
        );
    }

    console.log('Fetching tasks...');
    const tasks = await adapter.getTasks();
    console.log('Tasks fetched:', tasks.length);

    return NextResponse.json({
      data: tasks,
      meta: {
        total: tasks.length,
        service: serviceType,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      
      if (error.message.includes('API error: 403') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: 'Invalid or expired Todoist token. Please check your API token.' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('API error: 401') || error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Invalid Todoist token. Please check your API token.' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/tasks - タスク作成
export async function POST(request: NextRequest) {
  try {
    console.log('API called: POST /api/tasks');
    
    const body = await request.json();
    const { user_id, service = 'todoist', ...taskData } = body;

    console.log('Request body:', body);

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    if (!checkRateLimit(user_id)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retry_after: 60 
        },
        { status: 429 }
      );
    }

    if (!taskData.title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    const apiToken = request.headers.get('x-todoist-token');
    if (!apiToken) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    let adapter;
    switch (service) {
      case 'todoist':
        adapter = new TodoistAdapter(apiToken);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported service: ${service}` },
          { status: 400 }
        );
    }

    const createdTask = await adapter.createTask(taskData);

    return NextResponse.json({
      data: createdTask,
      meta: {
        service: service,
        timestamp: new Date().toISOString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}