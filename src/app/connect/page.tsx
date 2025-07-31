// src/app/connect/page.tsx
import { Suspense } from 'react';
import ConnectContent from './ConnectContent';

export default function ConnectPage() {
  return (
    <Suspense fallback={<ConnectLoading />}>
      <ConnectContent />
    </Suspense>
  );
}

function ConnectLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="mb-6">
          <div className="animate-pulse rounded-full h-16 w-16 bg-gray-200 mx-auto"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        <p className="text-gray-600">Preparing connection...</p>
      </div>
    </div>
  );
}