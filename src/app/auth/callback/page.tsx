// src/app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`Authentication failed: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing required parameters');
      }

      // stateから情報を抽出 (app_id:state:service_type)
      const [appId, originalState, serviceType] = state.split(':');

      setMessage('Exchanging authorization code...');

      // 認証コードをアクセストークンに交換
      const response = await fetch('/api/auth/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          service_type: serviceType,
          app_id: appId,
          state: originalState,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Token exchange failed');
      }

      const result = await response.json();
      
      setMessage('Connection established successfully!');
      setStatus('success');

      // 元のアプリにリダイレクトバック
      setTimeout(() => {
        const redirectUrl = new URL(result.redirect_uri);
        redirectUrl.searchParams.set('connection_token', result.connection_token);
        redirectUrl.searchParams.set('state', originalState);
        
        window.location.href = redirectUrl.toString();
      }, 2000);

    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="mb-6">
          {status === 'processing' && (
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          )}
          {status === 'success' && (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'processing' && 'Connecting...'}
          {status === 'success' && 'Connection Successful!'}
          {status === 'error' && 'Connection Failed'}
        </h1>

        <p className="text-gray-600 mb-6">{message}</p>

        {status === 'success' && (
          <div className="text-sm text-gray-500">
            <p>Redirecting you back to the application...</p>
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={() => window.close()}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close Window
          </button>
        )}
      </div>
    </div>
  );
}