'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LanguagesIcon, CheckIcon } from 'lucide-react';

function ZoomCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleZoomCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Zoom authorization failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from Zoom');
          return;
        }

        // In a real implementation, you would:
        // 1. Exchange the code for an access token
        // 2. Store the token securely
        // 3. Set up the user's Zoom integration

        // For now, simulate success
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setStatus('success');
        setMessage('Successfully connected to Zoom!');
        
        // Redirect to dashboard after a delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);

      } catch (error) {
        console.error('Zoom callback error:', error);
        setStatus('error');
        setMessage('Failed to process Zoom authorization');
      }
    };

    handleZoomCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
        <LanguagesIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold text-white mb-4">
          VidLiSync for Zoom
        </h1>
        
        {status === 'processing' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Processing authorization...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div>
            <div className="flex items-center justify-center mb-4">
              <CheckIcon className="w-12 h-12 text-green-500" />
            </div>
            <p className="text-green-400 font-medium mb-2">Authorization Successful!</p>
            <p className="text-gray-300 text-sm">{message}</p>
            <p className="text-gray-400 text-xs mt-2">Redirecting to dashboard...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">✕</span>
              </div>
            </div>
            <p className="text-red-400 font-medium mb-2">Authorization Failed</p>
            <p className="text-gray-300 text-sm mb-4">{message}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ZoomCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ZoomCallbackContent />
    </Suspense>
  );
}