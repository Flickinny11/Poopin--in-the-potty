/**
 * Participant Dot Component - Visual indicator for conversation participants
 */

'use client';

import React from 'react';
import { VSFriend } from '../types';

interface ParticipantDotProps {
  participant: VSFriend;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function ParticipantDot({ 
  participant, 
  size = 'medium', 
  showLabel = false 
}: ParticipantDotProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const getStatusColor = () => {
    if (!participant.isConnected) return 'bg-gray-500/50';
    if (participant.isSpeaking) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {/* Main dot */}
        <div 
          className={`
            ${sizeClasses[size]} 
            ${getStatusColor()} 
            rounded-full 
            flex items-center justify-center 
            text-white font-semibold
            ${textSizeClasses[size]}
            transition-all duration-300
            ${participant.isSpeaking ? 'scale-110' : 'scale-100'}
          `}
        >
          {getInitials(participant.name)}
        </div>

        {/* Speaking animation */}
        {participant.isSpeaking && (
          <>
            <div className={`
              absolute inset-0 
              ${sizeClasses[size]} 
              border-2 border-green-400/50 
              rounded-full 
              animate-ping
            `} />
            <div className={`
              absolute inset-0 
              ${sizeClasses[size]} 
              border-2 border-green-400/30 
              rounded-full 
              animate-pulse
            `} />
          </>
        )}

        {/* Connection status indicator */}
        <div className={`
          absolute -bottom-1 -right-1 
          w-4 h-4 
          rounded-full 
          border-2 border-white/20
          ${participant.isConnected ? 'bg-green-500' : 'bg-red-500'}
        `} />

        {/* Language indicator */}
        <div className={`
          absolute -top-1 -right-1 
          px-2 py-1 
          bg-black/60 
          rounded-full 
          text-xs text-white/90
          ${size === 'small' ? 'hidden' : 'block'}
        `}>
          {participant.selectedLanguage.toUpperCase()}
        </div>
      </div>

      {/* Optional label */}
      {showLabel && (
        <div className="text-center">
          <p className="text-sm font-medium text-white">
            {participant.name}
          </p>
          <p className="text-xs text-white/60">
            {participant.language.toUpperCase()} → {participant.selectedLanguage.toUpperCase()}
          </p>
        </div>
      )}
    </div>
  );
}