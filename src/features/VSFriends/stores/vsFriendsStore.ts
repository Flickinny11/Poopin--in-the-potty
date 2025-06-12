/**
 * VS Friends Store - State management for tap-to-connect conversations
 */

import { create } from 'zustand';
import { VSFriend, VSFriendsConfig, VSFriendsSession, ConversationState, AudioStream, VSFriendsBilling } from '../types';

interface VSFriendsState {
  // Core state
  conversationState: ConversationState;
  currentSession: VSFriendsSession | null;
  participants: VSFriend[];
  isInitiator: boolean;
  
  // Configuration
  config: VSFriendsConfig;
  
  // Audio state
  isCapturingAudio: boolean;
  audioStreams: Map<string, AudioStream>;
  activeStreams: Set<string>;
  
  // Connection state
  isDiscovering: boolean;
  nearbyDevices: VSFriend[];
  connectionAttempts: number;
  
  // UI state
  showMinimalUI: boolean;
  showParticipants: boolean;
  showLanguageSelector: boolean;
  
  // Billing
  currentCost: number;
  estimatedCost: number;
  billingStartTime: Date | null;
  
  // Actions
  startFriendDiscovery: () => void;
  connectToFriend: (friend: VSFriend) => Promise<void>;
  addParticipant: (friend: VSFriend) => void;
  removeParticipant: (friendId: string) => void;
  startConversation: () => void;
  endConversation: () => void;
  toggleMinimalUI: () => void;
  updateParticipantLanguage: (friendId: string, language: string) => void;
  processAudioStream: (stream: AudioStream) => void;
  calculateCost: () => number;
  resetState: () => void;
}

const DEFAULT_CONFIG: VSFriendsConfig = {
  maxParticipants: 4,
  allowLanguageSwitch: true,
  useVoiceCloning: true,
  autoEndTimeout: 30,
  backgroundMode: true,
};

const VS_FRIENDS_LIMITS = {
  free: {
    minutesPerMonth: 5,
    maxParticipants: 2
  },
  basic: {
    minutesPerMonth: 60,
    maxParticipants: 3
  },
  pro: {
    minutesPerMonth: 300,
    maxParticipants: 4
  },
  business: {
    minutesPerMonth: Infinity,
    maxParticipants: 4
  }
};

export const useVSFriendsStore = create<VSFriendsState>((set, get) => ({
  // Initial state
  conversationState: 'idle',
  currentSession: null,
  participants: [],
  isInitiator: false,
  
  config: DEFAULT_CONFIG,
  
  isCapturingAudio: false,
  audioStreams: new Map(),
  activeStreams: new Set(),
  
  isDiscovering: false,
  nearbyDevices: [],
  connectionAttempts: 0,
  
  showMinimalUI: true,
  showParticipants: false,
  showLanguageSelector: false,
  
  currentCost: 0,
  estimatedCost: 0,
  billingStartTime: null,
  
  // Actions
  startFriendDiscovery: () => {
    set({
      conversationState: 'discovering',
      isDiscovering: true,
      isInitiator: true,
      connectionAttempts: 0,
      nearbyDevices: []
    });
  },

  connectToFriend: async (friend: VSFriend) => {
    const { participants, config } = get();
    
    if (participants.length >= config.maxParticipants) {
      console.warn('Maximum participants reached');
      return;
    }

    set({ conversationState: 'connecting' });
    
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedFriend = {
        ...friend,
        isConnected: true,
        joinedAt: new Date()
      };
      
      set(state => ({
        participants: [...state.participants, updatedFriend],
        conversationState: state.participants.length === 0 ? 'active' : state.conversationState,
        isDiscovering: false
      }));
      
    } catch (error) {
      console.error('Failed to connect to friend:', error);
      set({ conversationState: 'idle', isDiscovering: false });
    }
  },

  addParticipant: (friend: VSFriend) => {
    const { participants, config } = get();
    
    if (participants.length >= config.maxParticipants) {
      return;
    }
    
    if (participants.find(p => p.id === friend.id)) {
      return; // Already added
    }
    
    set(state => ({
      participants: [...state.participants, {
        ...friend,
        isConnected: true,
        joinedAt: new Date()
      }]
    }));
  },

  removeParticipant: (friendId: string) => {
    set(state => ({
      participants: state.participants.filter(p => p.id !== friendId),
      activeStreams: new Set([...state.activeStreams].filter(id => id !== friendId))
    }));
  },

  startConversation: () => {
    const now = new Date();
    const sessionId = `vs_friends_${now.getTime()}`;
    
    set({
      conversationState: 'active',
      isCapturingAudio: true,
      billingStartTime: now,
      currentSession: {
        id: sessionId,
        initiatorId: 'current_user', // This would come from auth
        participants: get().participants,
        startTime: now,
        isActive: true,
        conversationId: sessionId
      }
    });
  },

  endConversation: () => {
    const { currentSession, billingStartTime } = get();
    
    if (currentSession && billingStartTime) {
      const endTime = new Date();
      const duration = endTime.getTime() - billingStartTime.getTime();
      const minutes = Math.ceil(duration / (1000 * 60));
      
      // Calculate final cost
      const finalCost = minutes * 0.02; // $0.02 per minute base rate
      
      set({
        conversationState: 'ended',
        isCapturingAudio: false,
        currentCost: finalCost,
        currentSession: currentSession ? {
          ...currentSession,
          endTime,
          isActive: false
        } : null
      });
    } else {
      set({
        conversationState: 'ended',
        isCapturingAudio: false
      });
    }
  },

  toggleMinimalUI: () => {
    set(state => ({ showMinimalUI: !state.showMinimalUI }));
  },

  updateParticipantLanguage: (friendId: string, language: string) => {
    set(state => ({
      participants: state.participants.map(p =>
        p.id === friendId ? { ...p, selectedLanguage: language } : p
      )
    }));
  },

  processAudioStream: (stream: AudioStream) => {
    set(state => {
      const newStreams = new Map(state.audioStreams);
      newStreams.set(stream.participantId, stream);
      
      const newActiveStreams = new Set(state.activeStreams);
      newActiveStreams.add(stream.participantId);
      
      return {
        audioStreams: newStreams,
        activeStreams: newActiveStreams,
        participants: state.participants.map(p =>
          p.id === stream.participantId ? { ...p, isSpeaking: true } : { ...p, isSpeaking: false }
        )
      };
    });
    
    // Clear speaking indicator after 1 second
    setTimeout(() => {
      set(state => ({
        participants: state.participants.map(p =>
          p.id === stream.participantId ? { ...p, isSpeaking: false } : p
        )
      }));
    }, 1000);
  },

  calculateCost: () => {
    const { billingStartTime, participants } = get();
    
    if (!billingStartTime) return 0;
    
    const now = new Date();
    const duration = now.getTime() - billingStartTime.getTime();
    const minutes = Math.ceil(duration / (1000 * 60));
    
    // Base rate: $0.02 per minute per participant
    const participantMultiplier = Math.max(1, participants.length);
    const cost = minutes * 0.02 * participantMultiplier;
    
    set({ estimatedCost: cost });
    return cost;
  },

  resetState: () => {
    set({
      conversationState: 'idle',
      currentSession: null,
      participants: [],
      isInitiator: false,
      isCapturingAudio: false,
      audioStreams: new Map(),
      activeStreams: new Set(),
      isDiscovering: false,
      nearbyDevices: [],
      connectionAttempts: 0,
      showMinimalUI: true,
      showParticipants: false,
      showLanguageSelector: false,
      currentCost: 0,
      estimatedCost: 0,
      billingStartTime: null
    });
  }
}));

export { VS_FRIENDS_LIMITS };