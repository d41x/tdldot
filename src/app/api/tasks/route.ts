// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TodoistAdapter, UnifiedTask } from '../../../lib/adapters/todoist';

// レート制限管理
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // リセット時間を1分後に設定
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (userLimit.count >= 100) { // 1分間に100リクエスト制限
    return false;
  }
  
  userLimit.count++;
  return true;
}

// GET /api/tasks - 全タスク取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const serviceType = searchParams.get('service') || 'todoist';

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // レート制限チェック
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retry_after: 60 
        },
        { status: 429 }
      );
    }

    // 認証トークン取得（実際の実装では暗号化されたDBから取得）
    const apiToken = request.headers.get('x-todoist-token');
    if (!apiToken) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    // サービス別のアダプター取得
    let adapter;
    switch (serviceType) {
      case 'todoist':
        adapter = new TodoistAdapter(apiToken);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported service: ${serviceType}` },
          { status: 400 }
        );
    }

    const tasks = await adapter.getTasks();

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
    
    if (error instanceof Error && error.message.includes('API error: 403')) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - タスク作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, service = 'todoist', ...taskData } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // レート制限チェック
    if (!checkRateLimit(user_id)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retry_after: 60 
        },
        { status: 429 }
      );
    }

    // バリデーション
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - タスク更新（別ファイル: src/app/api/tasks/[id]/route.ts）
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { user_id, service = 'todoist', ...updates } = body;
    const taskId = params.id;

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

    const apiToken = request.headers.get('x-todoist-token');
    if (!apiToken) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    // タスクIDから実際のexternal_idを抽出
    const externalId = taskId.replace('todoist_', '');

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

    const updatedTask = await adapter.updateTask(externalId, updates);

    return NextResponse.json({
      data: updatedTask,
      meta: {
        service: service,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - タスク削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const service = searchParams.get('service') || 'todoist';
    const taskId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retry_after: 60 
        },
        { status: 429 }
      );
    }

    const apiToken = request.headers.get('x-todoist-token');
    if (!apiToken) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    const externalId = taskId.replace('todoist_', '');

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

    await adapter.deleteTask(externalId);

    return NextResponse.json({
      message: 'Task deleted successfully',
      meta: {
        service: service,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}