// src/types/index.ts

// 統一タスクモデル
export interface UnifiedTask {
  id: string;
  external_id: string;
  service_type: 'todoist' | 'google_tasks' | 'microsoft_todo' | 'bitrix24';
  title: string;
  description: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'archived';
  labels: string[];
  project: {
    id: string;
    name: string;
    color?: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// 統一プロジェクトモデル
export interface UnifiedProject {
  id: string;
  external_id: string;
  service_type: 'todoist' | 'google_tasks' | 'microsoft_todo' | 'bitrix24';
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

// API レスポンス型
export interface ApiResponse<T> {
  data: T;
  meta: {
    total?: number;
    service: string;
    timestamp: string;
    rate_limit?: {
      remaining: number;
      reset_time: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// タスク作成・更新用の入力型
export interface TaskInput {
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  labels?: string[];
  project_id?: string;
}

// サービスアダプターのインターface
export interface TaskAdapter {
  getTasks(): Promise<UnifiedTask[]>;
  getTask(id: string): Promise<UnifiedTask>;
  createTask(task: TaskInput): Promise<UnifiedTask>;
  updateTask(id: string, updates: Partial<TaskInput>): Promise<UnifiedTask>;
  deleteTask(id: string): Promise<void>;
  completeTask(id: string): Promise<void>;
  getProjects(): Promise<UnifiedProject[]>;
}

// 認証情報
export interface ServiceCredentials {
  service_type: 'todoist' | 'google_tasks' | 'microsoft_todo' | 'bitrix24';
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  user_id: string;
}

// エラー型
export interface ApiError {
  code: string;
  message: string;
  service?: string;
  retry_after?: number;
  details?: any;
}

// レート制限情報
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_time: number;
  service: string;
}