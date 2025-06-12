/**
 * VS Presenter Store - Manages presentation state and functionality
 * Extends the existing call infrastructure for presenter-specific features
 */
import { create } from 'zustand';
import { 
  PresenterConfig, 
  VSPresenterSession, 
  VSParticipant, 
  PresentationState,
  AudioRoutingConfig,
  PresentationAnalytics,
  CostEstimate
} from '../types';
import { useCallStore } from '@/stores/callStore';

interface VSPresenterState {
  // Presentation state
  presentationState: PresentationState;
  session: VSPresenterSession | null;
  config: PresenterConfig;
  
  // Participants (extends call participants with presenter features)
  participants: VSParticipant[];
  raisedHands: Set<string>;
  mutedParticipants: Set<string>;
  
  // Audio routing
  audioRouting: AudioRoutingConfig;
  availableDevices: {
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
    cameras: MediaDeviceInfo[];
  };
  
  // Cost control
  costEstimate: CostEstimate;
  languageLockActive: boolean;
  
  // Analytics
  analytics: PresentationAnalytics;
  
  // UI state
  showParticipantList: boolean;
  showLanguageDistribution: boolean;
  showCostEstimate: boolean;
  
  // Actions
  updateConfig: (config: Partial<PresenterConfig>) => void;
  startPresentation: (config: PresenterConfig) => Promise<void>;
  endPresentation: () => void;
  updateAudioRouting: (routing: Partial<AudioRoutingConfig>) => void;
  
  // Participant management
  muteParticipant: (participantId: string) => void;
  unmuteParticipant: (participantId: string) => void;
  muteAllParticipants: () => void;
  unmuteAllParticipants: () => void;
  handleRaiseHand: (participantId: string, raised: boolean) => void;
  allowParticipantToSpeak: (participantId: string) => void;
  
  // Language management
  enforceLanguageLock: () => void;
  updateParticipantLanguage: (participantId: string, language: string) => void;
  
  // Cost control
  calculateCost: () => void;
  updateCostEstimate: (estimate: Partial<CostEstimate>) => void;
  
  // Analytics
  updateAnalytics: () => void;
  
  // UI actions
  toggleParticipantList: () => void;
  toggleLanguageDistribution: () => void;
  toggleCostEstimate: () => void;
}

export const useVSPresenterStore = create<VSPresenterState>((set, get) => ({
  // Initial state
  presentationState: 'setup',
  session: null,
  config: {
    mode: 'multi-user-hub',
    presenterLanguage: 'en',
    audienceLanguages: ['es', 'fr', 'de', 'zh'],
    voiceMode: 'clone',
    languageLock: false,
    maxParticipants: 100,
    recordingEnabled: true
  },
  
  participants: [],
  raisedHands: new Set(),
  mutedParticipants: new Set(),
  
  audioRouting: {
    presenter: {
      microphone: 'device',
      earbuds: 'bluetooth',
      monitor: 'translated'
    },
    audience: {
      output: 'individual-devices'
    }
  },
  
  availableDevices: {
    microphones: [],
    speakers: [],
    cameras: []
  },
  
  costEstimate: {
    participantCount: 0,
    languageCount: 1,
    estimatedCostPerMinute: 0.02,
    currentCost: 0,
    projectedCost: 0
  },
  
  languageLockActive: false,
  
  analytics: {
    totalParticipants: 0,
    activeParticipants: 0,
    languageDistribution: [],
    averageEngagement: 0,
    questionCount: 0,
    translationAccuracy: 0
  },
  
  showParticipantList: true,
  showLanguageDistribution: false,
  showCostEstimate: false,
  
  // Actions
  updateConfig: (configUpdate) => {
    set((state) => ({
      config: { ...state.config, ...configUpdate }
    }));
  },
  
  startPresentation: async (config) => {
    set({ 
      presentationState: 'active',
      config,
      languageLockActive: config.languageLock
    });
    
    // Create presentation room through API
    try {
      const response = await fetch('/api/presenter/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const room = await response.json();
      
      set((state) => ({
        session: {
          id: room.id,
          roomCode: room.code,
          config,
          participants: [],
          audioRouting: state.audioRouting,
          startTime: new Date(),
          isRecording: config.recordingEnabled,
          analytics: state.analytics,
          costEstimate: state.costEstimate
        }
      }));
      
      // Start the call using existing call store
      const callStore = useCallStore.getState();
      await callStore.joinCall(room.joinLink, 'Presenter', room.token);
      
    } catch (error) {
      console.error('Failed to start presentation:', error);
      set({ presentationState: 'setup' });
    }
  },
  
  endPresentation: () => {
    const { session } = get();
    if (session) {
      set((state) => ({
        presentationState: 'ended',
        session: {
          ...state.session!,
          endTime: new Date(),
          isRecording: false
        }
      }));
      
      // Leave the call
      const callStore = useCallStore.getState();
      callStore.leaveCall();
    }
  },
  
  updateAudioRouting: (routingUpdate) => {
    set((state) => ({
      audioRouting: {
        ...state.audioRouting,
        ...routingUpdate
      }
    }));
  },
  
  // Participant management
  muteParticipant: (participantId) => {
    set((state) => ({
      mutedParticipants: new Set([...state.mutedParticipants, participantId])
    }));
  },
  
  unmuteParticipant: (participantId) => {
    set((state) => {
      const newMuted = new Set(state.mutedParticipants);
      newMuted.delete(participantId);
      return { mutedParticipants: newMuted };
    });
  },
  
  muteAllParticipants: () => {
    const { participants } = get();
    set({
      mutedParticipants: new Set(participants.filter(p => !p.isPresenter).map(p => p.id))
    });
  },
  
  unmuteAllParticipants: () => {
    set({ mutedParticipants: new Set() });
  },
  
  handleRaiseHand: (participantId, raised) => {
    set((state) => {
      const newRaisedHands = new Set(state.raisedHands);
      if (raised) {
        newRaisedHands.add(participantId);
      } else {
        newRaisedHands.delete(participantId);
      }
      return { raisedHands: newRaisedHands };
    });
  },
  
  allowParticipantToSpeak: (participantId) => {
    const { unmuteParticipant, handleRaiseHand } = get();
    unmuteParticipant(participantId);
    handleRaiseHand(participantId, false);
  },
  
  // Language management
  enforceLanguageLock: () => {
    const { config, participants } = get();
    if (config.languageLock) {
      const allowedLanguages = [
        config.presenterLanguage,
        config.audienceLanguages[0] || 'en'
      ];
      
      set((state) => ({
        participants: state.participants.map(participant => ({
          ...participant,
          selectedLanguage: allowedLanguages.includes(participant.selectedLanguage) 
            ? participant.selectedLanguage 
            : allowedLanguages[1]
        }))
      }));
    }
  },
  
  updateParticipantLanguage: (participantId, language) => {
    set((state) => ({
      participants: state.participants.map(participant =>
        participant.id === participantId
          ? { ...participant, selectedLanguage: language }
          : participant
      )
    }));
  },
  
  // Cost control
  calculateCost: () => {
    const { config, participants, session } = get();
    const participantCount = participants.length;
    const languageCount = config.languageLock ? 2 : config.audienceLanguages.length + 1;
    
    let estimatedCostPerMinute = 0.02; // Base cost for language lock
    if (!config.languageLock) {
      estimatedCostPerMinute = participantCount * languageCount * 0.001;
    }
    
    const currentDuration = session 
      ? (Date.now() - session.startTime.getTime()) / (1000 * 60)
      : 0;
    
    const currentCost = currentDuration * estimatedCostPerMinute;
    const projectedCost = (currentDuration + 10) * estimatedCostPerMinute; // Project 10 more minutes
    
    set({
      costEstimate: {
        participantCount,
        languageCount,
        estimatedCostPerMinute,
        currentCost,
        projectedCost
      }
    });
  },
  
  updateCostEstimate: (estimate) => {
    set((state) => ({
      costEstimate: { ...state.costEstimate, ...estimate }
    }));
  },
  
  // Analytics
  updateAnalytics: () => {
    const { participants } = get();
    const languageDistribution = participants.reduce((acc, participant) => {
      const existing = acc.find(item => item.language === participant.selectedLanguage);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ language: participant.selectedLanguage, count: 1, percentage: 0 });
      }
      return acc;
    }, [] as { language: string; count: number; percentage: number }[]);
    
    // Calculate percentages
    const total = participants.length;
    languageDistribution.forEach(item => {
      item.percentage = total > 0 ? (item.count / total) * 100 : 0;
    });
    
    set((state) => ({
      analytics: {
        ...state.analytics,
        totalParticipants: total,
        activeParticipants: participants.filter(p => p.isSpeaking).length,
        languageDistribution
      }
    }));
  },
  
  // UI actions
  toggleParticipantList: () => {
    set((state) => ({ showParticipantList: !state.showParticipantList }));
  },
  
  toggleLanguageDistribution: () => {
    set((state) => ({ showLanguageDistribution: !state.showLanguageDistribution }));
  },
  
  toggleCostEstimate: () => {
    set((state) => ({ showCostEstimate: !state.showCostEstimate }));
  }
}));