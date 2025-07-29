// src/lib/adapters/todoist.ts

export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  due?: {
    date: string;
    datetime?: string;
  };
  priority: number;
  labels: string[];
  project_id: string;
  completed_at?: string;
  created_at: string;
}

export interface UnifiedTask {
  id: string;
  external_id: string;
  service_type: 'todoist';
  title: string;
  description: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed';
  labels: string[];
  project: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export class TodoistAdapter {
  private apiToken: string;
  private baseUrl = 'https://api.todoist.com/rest/v2';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Todoist API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Todoist API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // タスク一覧取得
  async getTasks(): Promise<UnifiedTask[]> {
    try {
      console.log('Fetching tasks from Todoist...');
      const [tasks, projects] = await Promise.all([
        this.request('/tasks'),
        this.request('/projects'),
      ]);

      console.log('Todoist tasks:', tasks);
      console.log('Todoist projects:', projects);

      const projectMap = new Map<string, string>(
        projects.map((p: any) => [String(p.id), String(p.name)])
      );

      return tasks.map((task: TodoistTask) => this.transformTask(task, projectMap));
    } catch (error) {
      console.error('Failed to fetch Todoist tasks:', error);
      throw error;
    }
  }

  // タスク作成
  async createTask(taskData: Partial<UnifiedTask>): Promise<UnifiedTask> {
    const todoistTask = {
      content: taskData.title,
      description: taskData.description || '',
      due_date: taskData.due_date,
      priority: this.convertPriority(taskData.priority || 'low'),
      labels: taskData.labels || [],
    };

    try {
      const createdTask = await this.request('/tasks', {
        method: 'POST',
        body: JSON.stringify(todoistTask),
      });

      const projects = await this.request('/projects');
      const projectMap = new Map<string, string>(
        projects.map((p: any) => [String(p.id), String(p.name)])
      );

      return this.transformTask(createdTask, projectMap);
    } catch (error) {
      console.error('Failed to create Todoist task:', error);
      throw error;
    }
  }

  // タスク更新
  async updateTask(taskId: string, updates: Partial<UnifiedTask>): Promise<UnifiedTask> {
    const todoistUpdates: any = {};
    
    if (updates.title) todoistUpdates.content = updates.title;
    if (updates.description) todoistUpdates.description = updates.description;
    if (updates.due_date) todoistUpdates.due_date = updates.due_date;
    if (updates.priority) todoistUpdates.priority = this.convertPriority(updates.priority);
    if (updates.labels) todoistUpdates.labels = updates.labels;

    try {
      await this.request(`/tasks/${taskId}`, {
        method: 'POST',
        body: JSON.stringify(todoistUpdates),
      });

      const [updatedTask, projects] = await Promise.all([
        this.request(`/tasks/${taskId}`),
        this.request('/projects'),
      ]);

      const projectMap = new Map<string, string>(
        projects.map((p: any) => [String(p.id), String(p.name)])
      );
      return this.transformTask(updatedTask, projectMap);
    } catch (error) {
      console.error('Failed to update Todoist task:', error);
      throw error;
    }
  }

  // タスク完了
  async completeTask(taskId: string): Promise<void> {
    try {
      await this.request(`/tasks/${taskId}/close`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to complete Todoist task:', error);
      throw error;
    }
  }

  // タスク削除
  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.request(`/tasks/${taskId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete Todoist task:', error);
      throw error;
    }
  }

  // Todoistタスクを統一形式に変換
  private transformTask(task: TodoistTask, projectMap: Map<string, string>): UnifiedTask {
    return {
      id: `todoist_${task.id}`,
      external_id: task.id,
      service_type: 'todoist',
      title: task.content,
      description: task.description,
      due_date: task.due?.datetime || task.due?.date,
      priority: this.convertPriorityFromTodoist(task.priority),
      status: task.completed_at ? 'completed' : 'pending',
      labels: task.labels,
      project: {
        id: task.project_id,
        name: projectMap.get(task.project_id) || 'Inbox',
      },
      created_at: task.created_at,
      updated_at: task.created_at,
      completed_at: task.completed_at,
    };
  }

  // 優先度変換（統一形式 → Todoist）
  private convertPriority(priority: string): number {
    const priorityMap: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4,
    };
    return priorityMap[priority] || 1;
  }

  // 優先度変換（Todoist → 統一形式）
  private convertPriorityFromTodoist(priority: number): 'low' | 'medium' | 'high' | 'urgent' {
    const priorityMap: Record<number, 'low' | 'medium' | 'high' | 'urgent'> = {
      1: 'low',
      2: 'medium',
      3: 'high',
      4: 'urgent',
    };
    return priorityMap[priority] || 'low';
  }
}