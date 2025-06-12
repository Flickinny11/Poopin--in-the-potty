/**
 * Active Conversation View - Minimal UI for ongoing conversations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Volume2, Users, Settings, Minimize2, Maximize2 } from 'lucide-react';
import { useVSFriendsStore } from '../stores/vsFriendsStore';
import { audioService } from '../services/audioService';
import { ParticipantDot } from './ParticipantDot';
import { LanguageSelector } from './LanguageSelector';

export function ActiveConversationView() {
  const {
    participants,
    showMinimalUI,
    toggleMinimalUI,
    endConversation,
    calculateCost,
    estimatedCost,
    currentSession
  } = useVSFriendsStore();

  const [audioLevel, setAudioLevel] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Update cost estimation periodically
  useEffect(() => {
    const interval = setInterval(() => {
      calculateCost();
    }, 5000);

    return () => clearInterval(interval);
  }, [calculateCost]);

  // Monitor audio level
  useEffect(() => {
    const interval = setInterval(() => {
      const level = audioService.getAudioLevel();
      setAudioLevel(level);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [showControls]);

  const handleScreenTap = () => {
    if (showMinimalUI) {
      setShowControls(!showControls);
    }
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (showMinimalUI) {
    return (
      <div 
        className="min-h-screen flex flex-col justify-between items-center p-8 cursor-pointer"
        onClick={handleScreenTap}
      >
        {/* Top: Participant indicators */}
        <div className="flex items-center gap-4 mt-12">
          {participants.map(participant => (
            <ParticipantDot
              key={participant.id}
              participant={participant}
              size="large"
            />
          ))}
        </div>

        {/* Center: Audio level visualization */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Audio level ring */}
            <div 
              className="w-32 h-32 border-4 border-white/30 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                borderColor: audioLevel > 0.1 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                transform: `scale(${1 + audioLevel * 0.2})`
              }}
            >
              <Volume2 className="w-12 h-12 text-white/60" />
            </div>
            
            {/* Speaking indicator */}
            {audioLevel > 0.1 && (
              <div className="absolute inset-0 border-4 border-white/50 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        {/* Bottom: End conversation button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            endConversation();
          }}
          className="bg-red-500/20 hover:bg-red-500/30 transition-colors duration-200 rounded-full p-4 mb-12"
          aria-label="End conversation"
        >
          <X className="w-8 h-8 text-red-300" />
        </button>

        {/* Controls overlay (shown on tap) */}
        {showControls && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-sm w-full mx-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Conversation Active</h3>
                {currentSession && (
                  <p className="text-white/70 text-sm">
                    Duration: {formatDuration(currentSession.startTime)}
                  </p>
                )}
                <p className="text-white/60 text-xs mt-1">
                  Estimated cost: ${estimatedCost.toFixed(2)}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowLanguageSelector(true);
                    setShowControls(false);
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 transition-colors duration-200 rounded-lg p-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    <span>Change Language</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    toggleMinimalUI();
                    setShowControls(false);
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 transition-colors duration-200 rounded-lg p-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Maximize2 className="w-5 h-5" />
                    <span>Show Full Interface</span>
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    endConversation();
                  }}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 transition-colors duration-200 rounded-lg p-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <X className="w-5 h-5" />
                    <span>End Conversation</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full UI mode
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-black/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">VS Friends</h2>
            {currentSession && (
              <p className="text-white/70 text-sm">
                {formatDuration(currentSession.startTime)} • ${estimatedCost.toFixed(2)}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={toggleMinimalUI}
              className="bg-white/10 hover:bg-white/20 transition-colors duration-200 rounded-lg p-2"
              aria-label="Minimize interface"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            
            <button
              onClick={endConversation}
              className="bg-red-500/20 hover:bg-red-500/30 transition-colors duration-200 rounded-lg p-2"
              aria-label="End conversation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 p-6">
        <div className="bg-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participants ({participants.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {participants.map(participant => (
              <div
                key={participant.id}
                className="bg-white/5 rounded-lg p-4 flex items-center gap-4"
              >
                <ParticipantDot participant={participant} size="medium" />
                <div className="flex-1">
                  <p className="font-medium">{participant.name}</p>
                  <p className="text-sm text-white/60">
                    Speaking: {participant.language.toUpperCase()} → {participant.selectedLanguage.toUpperCase()}
                  </p>
                  <p className="text-xs text-white/50">
                    Joined {new Date(participant.joinedAt).toLocaleTimeString()}
                  </p>
                </div>
                
                {participant.isSpeaking && (
                  <div className="bg-green-500/20 rounded-full px-3 py-1">
                    <span className="text-xs text-green-300">Speaking</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Audio Level Indicator */}
        <div className="mt-6 bg-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Audio Level
          </h3>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white/20 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-400 to-purple-400 h-full rounded-full transition-all duration-200"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
            <span className="text-sm text-white/70 w-12">
              {Math.round(audioLevel * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Language Selector Modal */}
      {showLanguageSelector && (
        <LanguageSelector onClose={() => setShowLanguageSelector(false)} />
      )}
    </div>
  );
}