'use client'

import React, { useState } from 'react';
import ModelManager from '@/components/ModelManager';
import VoiceProfileSetup from '@/components/VoiceProfileSetup';

export default function ModelsPage() {
  const [showModelManager, setShowModelManager] = useState(false);
  const [showVoiceSetup, setShowVoiceSetup] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Models & Voice Profiles
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage AI models and voice profiles for VidLiSync
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Manager Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Model Manager
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Download and manage AI models
              </p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Speech Recognition</span>
              <span className="text-green-600 font-medium">Ready</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Translation</span>
              <span className="text-green-600 font-medium">Ready</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Voice Cloning</span>
              <span className="text-yellow-600 font-medium">Optional</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Lip Sync</span>
              <span className="text-yellow-600 font-medium">Optional</span>
            </div>
          </div>

          <button
            onClick={() => setShowModelManager(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Model Manager
          </button>
        </div>

        {/* Voice Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎤</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Voice Profile Training
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Train your personalized voice
              </p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                No voice profile trained
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Training a voice profile helps preserve your voice characteristics during translation.
            </div>
          </div>

          <button
            onClick={() => setShowVoiceSetup(true)}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Start Voice Training
          </button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          What&apos;s Included
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">AI Models</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Whisper Large v3 (Speech Recognition)</li>
              <li>• NLLB-200 (Neural Translation)</li>
              <li>• Language Detection Model</li>
              <li>• Wunjo Voice Cloning (Optional)</li>
              <li>• Wunjo Lip Sync (Optional)</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Voice Features</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• 10-phrase training system</li>
              <li>• Quality verification</li>
              <li>• Multiple voice profiles</li>
              <li>• Real-time voice cloning</li>
              <li>• Cross-language preservation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">2/5</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Models Downloaded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">4.1 GB</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Storage Used</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Voice Profiles</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModelManager 
        isOpen={showModelManager} 
        onClose={() => setShowModelManager(false)} 
      />
      
      <VoiceProfileSetup 
        isOpen={showVoiceSetup} 
        onClose={() => setShowVoiceSetup(false)}
        onComplete={(profileId) => {
          console.log('Voice profile created:', profileId);
          setShowVoiceSetup(false);
        }}
      />
    </div>
  );
}