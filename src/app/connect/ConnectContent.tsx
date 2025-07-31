// src/app/connect/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  available: boolean;
}

const services: ServiceOption[] = [
  {
    id: 'todoist',
    name: 'Todoist',
    description: 'The world\'s #1 task manager',
    icon: '📋',
    color: 'bg-red-500',
    available: true
  },
  {
    id: 'google_tasks',
    name: 'Google Tasks',
    description: 'Simple task management from Google',
    icon: '✅',
    color: 'bg-blue-500',
    available: true
  },
  {
    id: 'microsoft_todo',
    name: 'Microsoft To Do',
    description: 'Task management by Microsoft',
    icon: '📝',
    color: 'bg-indigo-500',
    available: false
  },
  {
    id: 'apple_reminders',
    name: 'Apple Reminders',
    description: 'Native iOS/macOS reminders',
    icon: '🍎',
    color: 'bg-gray-500',
    available: false
  }
];

export default function ConnectPage() {
  const searchParams = useSearchParams();
  const [selectedService, setSelectedService] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [appName, setAppName] = useState('Unknown App');

  // URLパラメータから情報を取得
  const appId = searchParams.get('app_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');

  useEffect(() => {
    // 実際のアプリ情報を取得
    if (appId) {
      // TODO: API呼び出しでアプリ名を取得
      setAppName('Sample Todo App');
    }
  }, [appId]);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleConnect = async () => {
    if (!selectedService) {
      alert('Please select a service to connect');
      return;
    }

    setLoading(true);

    try {
      // サービス別の認証フローを開始
      switch (selectedService) {
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
      alert('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const initiateTodoistAuth = async () => {
    // Todoist OAuth URLに転送
    const todoistAuthUrl = new URL('https://todoist.com/oauth/authorize');
    todoistAuthUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_TODOIST_CLIENT_ID || '');
    todoistAuthUrl.searchParams.set('scope', 'data:read_write');
    todoistAuthUrl.searchParams.set('state', `${appId}:${state}:todoist`);
    todoistAuthUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/callback`);
    
    window.location.href = todoistAuthUrl.toString();
  };

  const initiateGoogleTasksAuth = async () => {
    // Google OAuth URLに転送
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '');
    googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/tasks');
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('state', `${appId}:${state}:google_tasks`);
    googleAuthUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/callback`);
    googleAuthUrl.searchParams.set('access_type', 'offline');
    
    window.location.href = googleAuthUrl.toString();
  };

  if (!appId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Request</h1>
          <p className="text-gray-600">Missing required parameters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <span className="text-4xl">📋</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect your Todo app</h1>
          <p className="text-gray-600">
            <strong>{appName}</strong> wants to access your tasks. 
            Choose which todo service you'd like to connect.
          </p>
        </div>

        {/* Service Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select your Todo service:</h2>
          
          <div className="space-y-2">
            {services.map((service) => (
              <label
                key={service.id}
                className={`
                  flex items-center p-3 rounded-lg cursor-pointer transition-all
                  ${selectedService === service.id 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50'
                  }
                  ${!service.available ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* チェックボックス */}
                <input
                  type="radio"
                  name="service"
                  value={service.id}
                  checked={selectedService === service.id}
                  disabled={!service.available}
                  onChange={() => service.available && handleServiceSelect(service.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                />
                
                {/* サービス名 */}
                <span className={`text-lg ${!service.available ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {service.name}
                  {!service.available && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Coming Soon)
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Connect Button */}
        <div className="text-center">
          <button
            onClick={handleConnect}
            disabled={!selectedService || loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              'Connect Selected Service'
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            By connecting, you authorize tdldot to access your tasks on your behalf. 
            You can revoke this access at any time in your account settings.
          </p>
        </div>

        {/* Powered by tdldot */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by <strong>tdldot</strong> - Todo List Data Organize Tool
          </p>
        </div>
      </div>
    </div>
  );
}