/**
 * VS Friends Main View Component
 */

'use client';

import React, { useEffect } from 'react';
import { useVSFriendsStore } from '../stores/vsFriendsStore';
import { connectionService } from '../services/connectionService';
import { audioService } from '../services/audioService';
import { IdleView } from './IdleView';
import { DiscoveringView } from './DiscoveringView';
import { ActiveConversationView } from './ActiveConversationView';
import { EndedView } from './EndedView';

export function VSFriendsView() {
  const {
    conversationState,
    participants,
    addParticipant,
    processAudioStream,
    endConversation
  } = useVSFriendsStore();

  useEffect(() => {
    // Initialize audio service
    audioService.initialize().catch(console.error);

    // Set up connection service event listeners
    connectionService.on('device_discovered', (device: any) => {
      console.log('Device discovered:', device);
    });

    connectionService.on('connection_established', (data: any) => {
      console.log('Connection established:', data);
      addParticipant(data.friend);
    });

    connectionService.on('audio_received', (audioStream: any) => {
      processAudioStream(audioStream);
    });

    // Auto-cleanup on unmount
    return () => {
      connectionService.stopDiscovery();
      audioService.cleanup();
    };
  }, [addParticipant, processAudioStream]);

  // Auto-end conversation after timeout
  useEffect(() => {
    if (conversationState === 'active' && participants.length === 0) {
      const timeout = setTimeout(() => {
        endConversation();
      }, 30000); // 30 seconds with no participants

      return () => clearTimeout(timeout);
    }
  }, [conversationState, participants.length, endConversation]);

  const renderCurrentView = () => {
    switch (conversationState) {
      case 'idle':
        return <IdleView />;
      case 'discovering':
      case 'connecting':
        return <DiscoveringView />;
      case 'active':
        return <ActiveConversationView />;
      case 'ended':
        return <EndedView />;
      default:
        return <IdleView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      {renderCurrentView()}
    </div>
  );
}