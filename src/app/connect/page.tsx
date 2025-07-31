// src/app/connect/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  available: boolean;
}

const serviceConfigs: Record<string, ServiceConfig> = {
  todoist: {
    id: 'todoist',
    name: 'Todoist',
    description: 'The world\'s #1 task manager and to-do list app',
    icon: '📋',
    color: 'bg-red-500',
    available: true
  },
  google_tasks: {
    id: 'google_tasks',
    name: 'Google Tasks',
    description: 'Simple task management integrated with Gmail and Calendar',
    icon: '✅',
    color: 'bg-blue-500',
    available: true
  },
  microsoft_todo: {
    id: 'microsoft_todo',
    name: 'Microsoft To Do',
    description: 'Task management that integrates with Microsoft 365',
    icon: '📝',
    color: 'bg-indigo-500',
    available: false
  },
  apple_reminders: {
    id: 'apple_reminders',
    name: 'Apple Reminders',
    description: 'Native task management for iOS and macOS',
    icon: '🍎',
    color: 'bg-gray-500',
    available: false
  }
};

export default function ConnectPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [appName, setAppName] = useState('Unknown App');

  // URLパラメータから情報を取得
  const service = searchParams.get('service');
  const appId = searchParams.get('app_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const userId = searchParams.get('user_id');

  const serviceConfig = service ? serviceConfigs[service] : null;

  useEffect(() => {
    // 実際のアプリ情報を取得
    if (appId) {
      // TODO: API呼び出しでアプリ名を取得
      setAppName('Sample Todo App');
    }
  }, [appId]);

  if (!service || !appId || !redirectUri) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Request</h1>
          <p className="text-gray-600 mb-4">
            Missing required parameters. Please check:
          </p>
          <ul className="text-sm text-gray-500 list-disc list-inside">
            <li>service: {service || 'missing'}</li>
            <li>app_id: {appId || 'missing'}</li>
            <li>redirect_uri: {redirectUri || 'missing'}</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!serviceConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Unsupported Service</h1>
          <p className="text-gray-600">
            The service <strong>{service}</strong> is not supported or available.
          </p>
        </div>
      </div>
    );
  }

  if (!serviceConfig.available) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <div className={`w-16 h-16 rounded-full ${serviceConfig.color} flex items-center justify-center text-white text-3xl mx-auto mb-4`}>
            {serviceConfig.icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{serviceConfig.name}</h1>
          <p className="text-gray-600 mb-6">
            {serviceConfig.name} integration is coming soon. We're working hard to bring you this connection.
          </p>
          <button
            onClick={() => window.close()}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const handleConnect = async () => {
    if (!service) return;

    setLoading(true);
    setError('');

    try {
      // サービス別の認証フローを開始
      switch (service) {
        case 'todoist':
          await initiateTodoistAuth();
          break;
        case 'google_tasks':
          await initiateGoogleTasksAuth();
          break;
        default:
          throw new Error('Service not implemented yet');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      setLoading(false);
    }
  };

  const initiateTodoistAuth = async () => {
    // Todoist OAuth URLに転送
    const todoistAuthUrl = new URL('https://todoist.com/oauth/authorize');
    todoistAuthUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_TODOIST_CLIENT_ID || '');
    todoistAuthUrl.searchParams.set('scope', 'data:read_write');
    todoistAuthUrl.searchParams.set('state', `${appId}:${state || ''}:${userId || ''}:todoist`);
    todoistAuthUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/callback`);
    
    window.location.href = todoistAuthUrl.toString();
  };

  const initiateGoogleTasksAuth = async () => {
    // Google OAuth URLに転送
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '');
    googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/tasks');
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('state', `${appId}:${state || ''}:${userId || ''}:google_tasks`);
    googleAuthUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/callback`);
    googleAuthUrl.searchParams.set('access_type', 'offline');
    
    window.location.href = googleAuthUrl.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full ${serviceConfig.color} flex items-center justify-center text-white text-4xl mx-auto mb-4`}>
            {serviceConfig.icon}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect {serviceConfig.name}
          </h1>
          <p className="text-gray-600">
            <strong>{appName}</strong> wants to access your {serviceConfig.name} tasks.
          </p>
        </div>

        {/* Service Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">About {serviceConfig.name}</h2>
          <p className="text-gray-600 text-sm mb-4">
            {serviceConfig.description}
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-green-600">
              <span className="w-4 h-4 mr-2 text-green-500">✓</span>
              Read and manage your tasks
            </div>
            <div className="flex items-center text-green-600">
              <span className="w-4 h-4 mr-2 text-green-500">✓</span>
              Create and update tasks
            </div>
            <div className="flex items-center text-green-600">
              <span className="w-4 h-4 mr-2 text-green-500">✓</span>
              Access project information
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="h-5 w-5 text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Connect Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-pulse mr-3">🔄</span>
                Connecting to {serviceConfig.name}...
              </span>
            ) : (
              `Connect ${serviceConfig.name}`
            )}
          </button>
        </div>

        {/* Security Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            By connecting, you authorize <strong>tdldot</strong> to securely access your {serviceConfig.name} data on behalf of <strong>{appName}</strong>. 
            You can revoke this permission at any time through your {serviceConfig.name} account settings.
          </p>
        </div>

        {/* Powered by tdldot */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Secured by <strong>tdldot</strong> - Todo List Data Organize Tool
          </p>
        </div>
      </div>
    </div>
  );
}