/**
 * Presentation Ended Component - Post-presentation summary
 */
'use client';

import React from 'react';
import { useVSPresenterStore } from '../stores/vsPresenterStore';
import { CheckCircleIcon, DownloadIcon, ShareIcon, PlusIcon } from 'lucide-react';

export const PresentationEnded: React.FC = () => {
  const { session, analytics, costEstimate, updateConfig } = useVSPresenterStore();

  const handleNewPresentation = () => {
    updateConfig({ 
      mode: 'multi-user-hub',
      presenterLanguage: 'en',
      audienceLanguages: ['es', 'fr', 'de', 'zh'],
      voiceMode: 'clone',
      languageLock: false,
      maxParticipants: 100,
      recordingEnabled: true 
    });
    // This will trigger the store to go back to setup state
    window.location.reload(); // Simple approach for now
  };

  const downloadRecording = () => {
    if (session?.recordingId) {
      // TODO: Implement recording download
      console.log('Download recording:', session.recordingId);
    }
  };

  const shareAnalytics = () => {
    // TODO: Implement analytics sharing
    console.log('Share analytics');
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p>No presentation session found</p>
        </div>
      </div>
    );
  }

  const duration = session.endTime 
    ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Presentation Complete</h1>
          <p className="text-white/80 text-lg">Your presentation has ended successfully</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">{analytics.totalParticipants}</div>
            <div className="text-white/70">Total Participants</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">{duration}</div>
            <div className="text-white/70">Minutes</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">{analytics.languageDistribution.length}</div>
            <div className="text-white/70">Languages Used</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">${costEstimate.currentCost.toFixed(2)}</div>
            <div className="text-white/70">Total Cost</div>
          </div>
        </div>

        {/* Language Distribution */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Language Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.languageDistribution.map((lang) => (
              <div key={lang.language} className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-white">{lang.language.toUpperCase()}</div>
                <div className="text-white/70">{lang.count} participants</div>
                <div className="text-purple-300">{lang.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {session.recordingId && (
            <button
              onClick={downloadRecording}
              className="flex items-center justify-center p-4 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
            >
              <DownloadIcon className="w-6 h-6 mr-2" />
              Download Recording
            </button>
          )}
          
          <button
            onClick={shareAnalytics}
            className="flex items-center justify-center p-4 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ShareIcon className="w-6 h-6 mr-2" />
            Share Analytics
          </button>
          
          <button
            onClick={handleNewPresentation}
            className="flex items-center justify-center p-4 bg-purple-600 rounded-xl text-white hover:bg-purple-700 transition-all"
          >
            <PlusIcon className="w-6 h-6 mr-2" />
            New Presentation
          </button>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};