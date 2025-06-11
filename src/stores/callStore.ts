/**
 * Video call state management with Zustand
 */
import { create } from 'zustand';
import DailyIframe, { DailyCall, DailyEvent, DailyParticipant } from '@daily-co/daily-js';
import type { CallQualityStats } from '@/lib/daily';

export interface CallParticipant {
  user_id: string;
  user_name: string;
  session_id: string;
  joined_at: Date;
  audio: boolean;
  video: boolean;
  screen: boolean;
  local: boolean;
  owner: boolean;
}

export interface CallState {
  // Call status
  isInCall: boolean;
  isConnecting: boolean;
  connectionState: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed';
  
  // Daily.co instance
  callObject: DailyCall | null;
  
  // Room information
  roomUrl: string | null;
  roomName: string | null;
  
  // Local user state
  localAudio: boolean;
  localVideo: boolean;
  localScreen: boolean;
  
  // Participants
  participants: Map<string, CallParticipant>;
  participantCount: number;
  
  // Call quality
  qualityStats: CallQualityStats | null;
  networkQuality: 'good' | 'warning' | 'poor';
  
  // Features
  isChatEnabled: boolean;
  isRecording: boolean;
  recordingId: string | null;
  
  // UI state
  showParticipants: boolean;
  showChat: boolean;
  isFullscreen: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  joinCall: (roomUrl: string, userName: string, token?: string) => Promise<void>;
  leaveCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  toggleRecording: () => Promise<void>;
  setShowParticipants: (show: boolean) => void;
  setShowChat: (show: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
  clearError: () => void;
  updateQualityStats: (stats: CallQualityStats) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  // Initial state
  isInCall: false,
  isConnecting: false,
  connectionState: 'new',
  callObject: null,
  roomUrl: null,
  roomName: null,
  localAudio: true,
  localVideo: true,
  localScreen: false,
  participants: new Map(),
  participantCount: 0,
  qualityStats: null,
  networkQuality: 'good',
  isChatEnabled: true,
  isRecording: false,
  recordingId: null,
  showParticipants: false,
  showChat: false,
  isFullscreen: false,
  error: null,

  // Join a call
  joinCall: async (roomUrl: string, userName: string, token?: string) => {
    try {
      set({ isConnecting: true, error: null });

      // Create Daily call object
      const callObject = DailyIframe.createCallObject({
        url: roomUrl,
        token,
        userName,
      });

      // Set up event listeners
      callObject
        .on('joining-meeting', () => {
          set({ connectionState: 'connecting' });
        })
        .on('joined-meeting', () => {
          set({ 
            isInCall: true, 
            isConnecting: false,
            connectionState: 'connected',
            roomUrl,
            roomName: roomUrl.split('/').pop() || null,
          });
        })
        .on('left-meeting', () => {
          set({ 
            isInCall: false,
            isConnecting: false,
            connectionState: 'disconnected',
            participants: new Map(),
            participantCount: 0,
          });
        })
        .on('participant-joined', (event) => {
          if (event.participant) {
            const participants = new Map(get().participants);
            participants.set(event.participant.session_id, {
              user_id: event.participant.user_id || event.participant.session_id,
              user_name: event.participant.user_name || 'Unknown',
              session_id: event.participant.session_id,
              joined_at: new Date(),
              audio: event.participant.audio,
              video: event.participant.video,
              screen: event.participant.screen,
              local: event.participant.local,
              owner: event.participant.owner || false,
            });
            set({ participants, participantCount: participants.size });
          }
        })
        .on('participant-left', (event) => {
          if (event.participant) {
            const participants = new Map(get().participants);
            participants.delete(event.participant.session_id);
            set({ participants, participantCount: participants.size });
          }
        })
        .on('participant-updated', (event) => {
          if (event.participant) {
            const participants = new Map(get().participants);
            const existing = participants.get(event.participant.session_id);
            if (existing) {
              participants.set(event.participant.session_id, {
                ...existing,
                audio: event.participant.audio,
                video: event.participant.video,
                screen: event.participant.screen,
              });
              set({ participants });
            }
          }
        })
        .on('local-audio-changed' as any, (event: any) => {
          set({ localAudio: event.audioEnabled });
        })
        .on('local-video-changed' as any, (event: any) => {
          set({ localVideo: event.videoEnabled });
        })
        .on('local-screen-share-started' as any, () => {
          set({ localScreen: true });
        })
        .on('local-screen-share-stopped' as any, () => {
          set({ localScreen: false });
        })
        .on('recording-started' as any, (event: any) => {
          set({ isRecording: true, recordingId: event.recordingId || null });
        })
        .on('recording-stopped' as any, () => {
          set({ isRecording: false, recordingId: null });
        })
        .on('error' as any, (event: any) => {
          set({ 
            error: event.errorMsg || 'An error occurred during the call',
            isConnecting: false,
            connectionState: 'failed',
          });
        });

      set({ callObject });

      // Join the meeting
      await callObject.join();
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to join call',
        isConnecting: false,
        connectionState: 'failed',
      });
    }
  },

  // Leave the call
  leaveCall: () => {
    const { callObject } = get();
    if (callObject) {
      callObject.leave();
      callObject.destroy();
    }
    set({
      callObject: null,
      isInCall: false,
      isConnecting: false,
      connectionState: 'disconnected',
      roomUrl: null,
      roomName: null,
      participants: new Map(),
      participantCount: 0,
      localScreen: false,
      isRecording: false,
      recordingId: null,
      showParticipants: false,
      showChat: false,
      isFullscreen: false,
    });
  },

  // Toggle audio
  toggleAudio: () => {
    const { callObject, localAudio } = get();
    if (callObject) {
      callObject.setLocalAudio(!localAudio);
    }
  },

  // Toggle video
  toggleVideo: () => {
    const { callObject, localVideo } = get();
    if (callObject) {
      callObject.setLocalVideo(!localVideo);
    }
  },

  // Toggle screen share
  toggleScreenShare: () => {
    const { callObject, localScreen } = get();
    if (callObject) {
      if (localScreen) {
        callObject.stopScreenShare();
      } else {
        callObject.startScreenShare();
      }
    }
  },

  // Toggle recording
  toggleRecording: async () => {
    const { callObject, isRecording } = get();
    if (callObject) {
      if (isRecording) {
        await callObject.stopRecording();
      } else {
        await callObject.startRecording();
      }
    }
  },

  // UI actions
  setShowParticipants: (show: boolean) => set({ showParticipants: show }),
  setShowChat: (show: boolean) => set({ showChat: show }),
  setFullscreen: (fullscreen: boolean) => set({ isFullscreen: fullscreen }),
  clearError: () => set({ error: null }),
  
  // Update quality stats
  updateQualityStats: (stats: CallQualityStats) => {
    // Calculate network quality based on packet loss
    const avgPacketLoss = (stats.videoRecvPacketLoss + stats.audioRecvPacketLoss) / 2;
    let networkQuality: 'good' | 'warning' | 'poor' = 'good';
    
    if (avgPacketLoss > 0.05) { // 5% packet loss
      networkQuality = 'poor';
    } else if (avgPacketLoss > 0.02) { // 2% packet loss
      networkQuality = 'warning';
    }
    
    set({ qualityStats: stats, networkQuality });
  },
}));