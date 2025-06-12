'use client';

import { useEffect, useState } from 'react';
import TranslationControls from '@/components/TranslationControls';
import { LanguagesIcon, UsersIcon } from 'lucide-react';

export default function TeamsDashboardPage() {
  const [isTeamsContext, setIsTeamsContext] = useState(false);
  const [teamsContext, setTeamsContext] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize Teams SDK
    if (typeof window !== 'undefined' && window.microsoftTeams) {
      window.microsoftTeams?.initialize?.(() => {
        setIsTeamsContext(true);
        window.microsoftTeams?.getContext?.((context) => {
          console.log('Teams context:', context);
          setTeamsContext(context);
          setIsInitialized(true);
        });
      });
    } else {
      // Fallback for non-Teams environment
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Connecting to Teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <LanguagesIcon className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">VidLiSync Translation</h1>
                <p className="text-gray-400">Real-time translation for Microsoft Teams</p>
              </div>
            </div>
            
            {isTeamsContext && (
              <div className="text-right">
                <div className="flex items-center text-green-400 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Teams Integration Active
                </div>
                {teamsContext?.meetingId && (
                  <p className="text-xs text-gray-500">Meeting: {teamsContext.meetingId}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Translation Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <TranslationControls />
        </div>

        {/* Meeting Information */}
        {isTeamsContext && teamsContext && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <UsersIcon className="w-5 h-5 mr-2" />
              Meeting Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Meeting ID:</span>
                <p className="text-white font-mono">{teamsContext.meetingId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-400">User:</span>
                <p className="text-white">{teamsContext.userDisplayName || 'Anonymous'}</p>
              </div>
              <div>
                <span className="text-gray-400">Theme:</span>
                <p className="text-white capitalize">{teamsContext.theme || 'default'}</p>
              </div>
              <div>
                <span className="text-gray-400">Locale:</span>
                <p className="text-white">{teamsContext.locale || 'en-US'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
              <div>
                <p className="font-medium">Select Languages</p>
                <p className="text-sm text-gray-400">Choose your source and target languages for translation</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
              <div>
                <p className="font-medium">Start Translation</p>
                <p className="text-sm text-gray-400">Click &quot;Start Translation&quot; to begin real-time translation</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
              <div>
                <p className="font-medium">Speak Naturally</p>
                <p className="text-sm text-gray-400">Your voice will be translated while preserving your unique characteristics</p>
              </div>
            </div>
          </div>
          
          {!isTeamsContext && (
            <div className="mt-6 p-4 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded-lg">
              <p className="text-yellow-300 text-sm">
                <strong>Note:</strong> You are viewing this page outside of Microsoft Teams. 
                For full integration features, please access this through the Teams app.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}