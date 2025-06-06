import { create } from 'zustand'
import DailyIframe, { DailyCall, DailyEvent, DailyParticipant } from '@daily-co/daily-js'
import type { CallSession, CallParticipant } from '@/types'

interface CallState {
  // Call session
  callSession: CallSession | null
  dailyCall: DailyCall | null
  
  // Participants
  participants: Map<string, DailyParticipant>
  localParticipant: DailyParticipant | null
  
  // Call state
  isInCall: boolean
  isConnecting: boolean
  callStartTime: Date | null
  callDuration: number
  
  // Media state
  isMicMuted: boolean
  isCameraOff: boolean
  isSpeakerMuted: boolean
  
  // Translation state
  isTranslationActive: boolean
  selectedLanguage: string
  targetLanguage: string
  
  // Recording state
  isRecording: boolean
  
  // UI state
  isFullscreen: boolean
  showParticipants: boolean
  showSettings: boolean
  
  // Actions
  setCallSession: (session: CallSession | null) => void
  setDailyCall: (call: DailyCall | null) => void
  addParticipant: (participant: DailyParticipant) => void
  removeParticipant: (sessionId: string) => void
  updateParticipant: (sessionId: string, updates: Partial<DailyParticipant>) => void
  setLocalParticipant: (participant: DailyParticipant | null) => void
  
  // Call actions
  joinCall: (roomUrl: string) => Promise<void>
  leaveCall: () => Promise<void>
  setCallState: (isInCall: boolean, isConnecting?: boolean) => void
  updateCallDuration: () => void
  
  // Media actions
  toggleMic: () => Promise<void>
  toggleCamera: () => Promise<void>
  toggleSpeaker: () => Promise<void>
  
  // Translation actions
  toggleTranslation: () => void
  setLanguages: (selected: string, target: string) => void
  
  // Recording actions
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  
  // UI actions
  toggleFullscreen: () => void
  toggleParticipants: () => void
  toggleSettings: () => void
  
  // Reset
  reset: () => void
}

export const useCallStore = create<CallState>((set, get) => ({
  // Initial state
  callSession: null,
  dailyCall: null,
  participants: new Map(),
  localParticipant: null,
  isInCall: false,
  isConnecting: false,
  callStartTime: null,
  callDuration: 0,
  isMicMuted: false,
  isCameraOff: false,
  isSpeakerMuted: false,
  isTranslationActive: true,
  selectedLanguage: 'en',
  targetLanguage: 'es',
  isRecording: false,
  isFullscreen: false,
  showParticipants: false,
  showSettings: false,

  // State setters
  setCallSession: (callSession) => set({ callSession }),
  setDailyCall: (dailyCall) => set({ dailyCall }),
  
  addParticipant: (participant) => 
    set((state) => {
      const newParticipants = new Map(state.participants)
      newParticipants.set(participant.session_id, participant)
      return { participants: newParticipants }
    }),
    
  removeParticipant: (sessionId) =>
    set((state) => {
      const newParticipants = new Map(state.participants)
      newParticipants.delete(sessionId)
      return { participants: newParticipants }
    }),
    
  updateParticipant: (sessionId, updates) =>
    set((state) => {
      const newParticipants = new Map(state.participants)
      const existing = newParticipants.get(sessionId)
      if (existing) {
        newParticipants.set(sessionId, { ...existing, ...updates })
      }
      return { participants: newParticipants }
    }),
    
  setLocalParticipant: (localParticipant) => set({ localParticipant }),

  // Call actions
  joinCall: async (roomUrl: string) => {
    const { dailyCall } = get()
    
    if (!dailyCall) {
      const call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true,
      })
      
      set({ dailyCall: call, isConnecting: true })
      
      // Set up event listeners
      call.on('joined-meeting', (event: DailyEvent) => {
        set({ 
          isInCall: true, 
          isConnecting: false,
          callStartTime: new Date(),
          localParticipant: event.participants.local
        })
      })
      
      call.on('left-meeting', () => {
        set({ 
          isInCall: false, 
          isConnecting: false,
          callStartTime: null,
          callDuration: 0
        })
      })
      
      call.on('participant-joined', (event: DailyEvent) => {
        if (event.participant) {
          get().addParticipant(event.participant)
        }
      })
      
      call.on('participant-left', (event: DailyEvent) => {
        if (event.participant) {
          get().removeParticipant(event.participant.session_id)
        }
      })
      
      call.on('participant-updated', (event: DailyEvent) => {
        if (event.participant) {
          get().updateParticipant(event.participant.session_id, event.participant)
        }
      })
      
      try {
        await call.join({ url: roomUrl })
      } catch (error) {
        console.error('Failed to join call:', error)
        set({ isConnecting: false, dailyCall: null })
        throw error
      }
    }
  },

  leaveCall: async () => {
    const { dailyCall } = get()
    if (dailyCall) {
      await dailyCall.leave()
      await dailyCall.destroy()
      get().reset()
    }
  },

  setCallState: (isInCall, isConnecting = false) => 
    set({ isInCall, isConnecting }),

  updateCallDuration: () => {
    const { callStartTime } = get()
    if (callStartTime) {
      const duration = Math.floor((Date.now() - callStartTime.getTime()) / 1000)
      set({ callDuration: duration })
    }
  },

  // Media actions
  toggleMic: async () => {
    const { dailyCall, isMicMuted } = get()
    if (dailyCall) {
      await dailyCall.setLocalAudio(!isMicMuted)
      set({ isMicMuted: !isMicMuted })
    }
  },

  toggleCamera: async () => {
    const { dailyCall, isCameraOff } = get()
    if (dailyCall) {
      await dailyCall.setLocalVideo(!isCameraOff)
      set({ isCameraOff: !isCameraOff })
    }
  },

  toggleSpeaker: async () => {
    const { dailyCall, isSpeakerMuted } = get()
    if (dailyCall) {
      // This would typically control speaker output
      set({ isSpeakerMuted: !isSpeakerMuted })
    }
  },

  // Translation actions
  toggleTranslation: () => 
    set((state) => ({ isTranslationActive: !state.isTranslationActive })),

  setLanguages: (selectedLanguage, targetLanguage) => 
    set({ selectedLanguage, targetLanguage }),

  // Recording actions
  startRecording: async () => {
    const { dailyCall } = get()
    if (dailyCall) {
      try {
        await dailyCall.startRecording()
        set({ isRecording: true })
      } catch (error) {
        console.error('Failed to start recording:', error)
        throw error
      }
    }
  },

  stopRecording: async () => {
    const { dailyCall } = get()
    if (dailyCall) {
      try {
        await dailyCall.stopRecording()
        set({ isRecording: false })
      } catch (error) {
        console.error('Failed to stop recording:', error)
        throw error
      }
    }
  },

  // UI actions
  toggleFullscreen: () => 
    set((state) => ({ isFullscreen: !state.isFullscreen })),

  toggleParticipants: () => 
    set((state) => ({ showParticipants: !state.showParticipants })),

  toggleSettings: () => 
    set((state) => ({ showSettings: !state.showSettings })),

  // Reset
  reset: () => set({
    callSession: null,
    dailyCall: null,
    participants: new Map(),
    localParticipant: null,
    isInCall: false,
    isConnecting: false,
    callStartTime: null,
    callDuration: 0,
    isMicMuted: false,
    isCameraOff: false,
    isSpeakerMuted: false,
    isTranslationActive: true,
    selectedLanguage: 'en',
    targetLanguage: 'es',
    isRecording: false,
    isFullscreen: false,
    showParticipants: false,
    showSettings: false,
  }),
}))

// Hook to automatically update call duration
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useCallStore.getState()
    if (state.isInCall && state.callStartTime) {
      state.updateCallDuration()
    }
  }, 1000)
}