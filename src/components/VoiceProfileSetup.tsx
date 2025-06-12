'use client'

import React from 'react';

interface VoiceProfileSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (profileId: string) => void;
}

export default function VoiceProfileSetup({ isOpen, onClose, onComplete }: VoiceProfileSetupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Voice Profile Training
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Voice profile training component - Implementation in progress
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}