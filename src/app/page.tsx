// src/app/page.tsx
'use client';

import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [apiToken, setApiToken] = useState('');
  const [userId, setUserId] = useState('user123');
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  // タスク一覧取得
  const fetchTasks = async () => {
    if (!apiToken) {
      alert('Todoist APIトークンを入力してください');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks?user_id=${userId}`, {
        headers: {
          'x-todoist-token': apiToken,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setTasks(result.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('タスクの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // タスク作成
  const createTask = async () => {
    if (!apiToken || !newTask.title) {
      alert('APIトークンとタスクタイトルを入力してください');
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-todoist-token': apiToken,
        },
        body: JSON.stringify({
          user_id: userId,
          ...newTask,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setTasks([...tasks, result.data]);
      setNewTask({ title: '', description: '', priority: 'medium' });
      alert('タスクが作成されました！');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('タスクの作成に失敗しました');
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">
        ToDo統合API テストページ
      </h1>

      {/* API設定 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">API設定</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Todoist APIトークン
            </label>
            <input
              type="password"
              placeholder="Todoistで取得したAPIトークンを入力"
              className="w-full p-3 border border-gray-300 rounded-md"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
            <p className="text-sm text-gray-600 mt-1">
              <a 
                href="https://todoist.com/prefs/integrations" 
                target="_blank" 
                className="text-blue-600 hover:underline"
              >
                Todoist設定ページ
              </a>
              でAPIトークンを取得できます
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">ユーザーID</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* タスク作成 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">新しいタスクを作成</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">タスクタイトル</label>
            <input
              type="text"
              placeholder="例: APIドキュメントを読む"
              className="w-full p-3 border border-gray-300 rounded-md"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">説明</label>
            <textarea
              placeholder="詳細な説明（オプション）"
              className="w-full p-3 border border-gray-300 rounded-md"
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">優先度</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-md"
              value={newTask.priority}
              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">緊急</option>
            </select>
          </div>
          <button
            onClick={createTask}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            タスク作成
          </button>
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">タスク一覧</h2>
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? '読み込み中...' : 'タスク取得'}
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            タスクがありません。「タスク取得」ボタンを押してタスクを読み込んでください。
          </p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{task.title}</h3>
                    {task.description && (
                      <p className="text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded ${
                        task.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status === 'completed' ? '完了' : '未完了'}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        task.priority === 'urgent' 
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        優先度: {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 使用方法 */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">使用方法</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Todoistアカウントを作成し、APIトークンを取得</li>
          <li>上記のフォームにAPIトークンを入力</li>
          <li>「タスク取得」ボタンで既存のタスクを表示</li>
          <li>新しいタスクを作成してテスト</li>
        </ol>
      </div>
    </div>
  );
}