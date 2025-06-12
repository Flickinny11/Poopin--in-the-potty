/**
 * Ended View - Post-conversation summary
 */

'use client';

import React from 'react';
import { CheckCircle, Clock, DollarSign, Users, RotateCcw } from 'lucide-react';
import { useVSFriendsStore } from '../stores/vsFriendsStore';

export function EndedView() {
  const {
    currentSession,
    participants,
    currentCost,
    resetState
  } = useVSFriendsStore();

  const formatDuration = (startTime: Date, endTime: Date) => {
    const diff = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes === 0) {
      return `${seconds} seconds`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartNew = () => {
    resetState();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="bg-green-500/20 rounded-full p-6 mx-auto mb-4 w-24 h-24 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Conversation Ended</h2>
          <p className="text-white/70">Thanks for using VS Friends!</p>
        </div>

        {/* Session Summary */}
        {currentSession && (
          <div className="space-y-4 mb-8">
            {/* Duration */}
            <div className="bg-white/5 rounded-lg p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">Duration</p>
                <p className="text-white/70 text-sm">
                  {currentSession.endTime ? 
                    formatDuration(currentSession.startTime, currentSession.endTime) :
                    'Less than a minute'
                  }
                </p>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white/5 rounded-lg p-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-white font-medium">Participants</p>
                <p className="text-white/70 text-sm">
                  {participants.length} {participants.length === 1 ? 'person' : 'people'}
                </p>
              </div>
            </div>

            {/* Cost */}
            <div className="bg-white/5 rounded-lg p-4 flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-medium">Cost</p>
                <p className="text-white/70 text-sm">
                  ${currentCost.toFixed(2)} (billed to conversation starter)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Participant List */}
        {participants.length > 0 && (
          <div className="mb-8">
            <h3 className="text-white font-semibold mb-3">Who participated:</h3>
            <div className="space-y-2">
              {participants.map(participant => (
                <div 
                  key={participant.id}
                  className="bg-white/5 rounded-lg p-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {participant.initials}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{participant.name}</p>
                    <p className="text-white/60 text-xs">
                      {participant.language.toUpperCase()} → {participant.selectedLanguage.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="bg-blue-500/10 rounded-lg p-4 mb-6">
          <h3 className="text-white font-semibold mb-2">How was your experience?</h3>
          <div className="flex gap-2">
            {['😊', '😐', '😟'].map((emoji, index) => (
              <button
                key={index}
                className="bg-white/10 hover:bg-white/20 transition-colors duration-200 rounded-lg p-2 text-2xl"
                aria-label={`Rate experience ${index + 1} out of 3`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleStartNew}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 rounded-lg py-3 px-4 font-semibold text-white flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Start New Conversation
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full bg-white/10 hover:bg-white/20 transition-colors duration-200 rounded-lg py-3 px-4 font-semibold text-white"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Share */}
        <div className="mt-6 pt-6 border-t border-white/20 text-center">
          <p className="text-white/60 text-sm mb-3">Share VS Friends with others</p>
          <button className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm underline">
            Copy invitation link
          </button>
        </div>
      </div>
    </div>
  );
}