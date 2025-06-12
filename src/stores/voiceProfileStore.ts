/**
 * Voice Profile Store for VidLiSync
 * Manages voice profile training, storage, and management
 */
import { create } from 'zustand';

export interface VoiceRecording {
  id: string;
  phrase: string;
  audioBlob: Blob;
  duration: number;
  quality: number; // 0-1
  timestamp: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  language: string;
  recordings: VoiceRecording[];
  qualityScore: number;
  trainingDuration: number;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  features?: {
    fundamentalFrequency: number;
    formants: number[];
    voiceCharacteristics: string;
  };
}

export interface VoiceProfileState {
  // Current training session
  isTraining: boolean;
  currentStep: number;
  totalSteps: number;
  currentRecording: VoiceRecording | null;
  
  // Training phrases
  trainingPhrases: string[];
  
  // Voice profiles
  profiles: VoiceProfile[];
  activeProfileId: string | null;
  
  // Recording state
  isRecording: boolean;
  audioLevel: number;
  recordingDuration: number;
  
  // Training progress
  completedRecordings: VoiceRecording[];
  overallQuality: number;
  
  // UI state
  showTrainingWizard: boolean;
  currentPhrase: string;
  phraseIndex: number;
  
  // Actions
  startTraining: (language: string, profileName?: string) => void;
  stopTraining: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  nextPhrase: () => void;
  previousPhrase: () => void;
  retryRecording: () => void;
  completeTraining: () => Promise<string>;
  deleteRecording: (recordingId: string) => void;
  
  // Profile management
  createProfile: (name: string, language: string) => Promise<string>;
  updateProfile: (profileId: string, updates: Partial<VoiceProfile>) => void;
  deleteProfile: (profileId: string) => void;
  setActiveProfile: (profileId: string | null) => void;
  getProfile: (profileId: string) => VoiceProfile | null;
  
  // Persistence
  saveProfiles: () => Promise<void>;
  loadProfiles: () => Promise<void>;
  
  // Audio analysis
  analyzeAudioQuality: (audioBlob: Blob) => Promise<number>;
  calculateOverallQuality: () => number;
}

// Default training phrases for voice profile setup
const DEFAULT_TRAINING_PHRASES = [
  "Hello, my name is Alex and I enjoy using translation technology.",
  "The weather today is beautiful and perfect for a walk outside.",
  "I love learning new languages and connecting with people worldwide.",
  "Can you please help me find the nearest coffee shop?",
  "Thank you very much for your patience and understanding.",
  "One, two, three, four, five, six, seven, eight, nine, ten.",
  "How are you doing today? I hope you're having a wonderful time.",
  "I would like to order a cappuccino and a chocolate croissant please.",
  "This translation application is amazing and very user-friendly.",
  "Goodbye everyone, see you tomorrow at the same time."
];

export const useVoiceProfileStore = create<VoiceProfileState>((set, get) => ({
  // Initial state
  isTraining: false,
  currentStep: 0,
  totalSteps: DEFAULT_TRAINING_PHRASES.length,
  currentRecording: null,
  trainingPhrases: DEFAULT_TRAINING_PHRASES,
  profiles: [],
  activeProfileId: null,
  isRecording: false,
  audioLevel: 0,
  recordingDuration: 0,
  completedRecordings: [],
  overallQuality: 0,
  showTrainingWizard: false,
  currentPhrase: DEFAULT_TRAINING_PHRASES[0],
  phraseIndex: 0,
  
  // Start training session
  startTraining: (language: string, profileName?: string) => {
    set({
      isTraining: true,
      currentStep: 0,
      phraseIndex: 0,
      currentPhrase: DEFAULT_TRAINING_PHRASES[0],
      completedRecordings: [],
      overallQuality: 0,
      showTrainingWizard: true,
    });
  },
  
  // Stop training session
  stopTraining: () => {
    set({
      isTraining: false,
      currentStep: 0,
      phraseIndex: 0,
      completedRecordings: [],
      overallQuality: 0,
      showTrainingWizard: false,
      isRecording: false,
      currentRecording: null,
    });
  },
  
  // Start recording
  startRecording: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const audioChunks: Blob[] = [];
      let startTime = Date.now();
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const duration = Date.now() - startTime;
        const quality = await get().analyzeAudioQuality(audioBlob);
        
        const recording: VoiceRecording = {
          id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          phrase: get().currentPhrase,
          audioBlob,
          duration,
          quality,
          timestamp: Date.now(),
        };
        
        set((state) => ({
          currentRecording: recording,
          isRecording: false,
          recordingDuration: 0,
        }));
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start(250); // Collect data every 250ms
      
      set({
        isRecording: true,
        recordingDuration: 0,
        currentRecording: null,
      });
      
      // Update recording duration
      const updateDuration = () => {
        if (get().isRecording) {
          set(state => ({ recordingDuration: state.recordingDuration + 250 }));
          setTimeout(updateDuration, 250);
        }
      };
      updateDuration();
      
      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (get().isRecording) {
          mediaRecorder.stop();
        }
      }, 30000);
      
      // Store recorder reference for manual stop
      (window as any).currentMediaRecorder = mediaRecorder;
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      set({ isRecording: false });
      throw error;
    }
  },
  
  // Stop recording
  stopRecording: async () => {
    const recorder = (window as any).currentMediaRecorder;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
  },
  
  // Move to next phrase
  nextPhrase: () => {
    const { currentRecording, phraseIndex, trainingPhrases } = get();
    
    if (currentRecording) {
      // Add current recording to completed list
      set(state => ({
        completedRecordings: [...state.completedRecordings, currentRecording],
        currentRecording: null,
      }));
    }
    
    if (phraseIndex < trainingPhrases.length - 1) {
      const nextIndex = phraseIndex + 1;
      set({
        phraseIndex: nextIndex,
        currentPhrase: trainingPhrases[nextIndex],
        currentStep: nextIndex,
      });
    } else {
      // Training complete
      get().completeTraining();
    }
  },
  
  // Move to previous phrase
  previousPhrase: () => {
    const { phraseIndex, trainingPhrases } = get();
    
    if (phraseIndex > 0) {
      const prevIndex = phraseIndex - 1;
      set({
        phraseIndex: prevIndex,
        currentPhrase: trainingPhrases[prevIndex],
        currentStep: prevIndex,
        currentRecording: null,
      });
      
      // Remove the recording for this phrase if it exists
      set(state => ({
        completedRecordings: state.completedRecordings.filter((_, index) => index !== prevIndex),
      }));
    }
  },
  
  // Retry current recording
  retryRecording: () => {
    set({
      currentRecording: null,
      isRecording: false,
      recordingDuration: 0,
    });
  },
  
  // Complete training and create profile
  completeTraining: async () => {
    const { completedRecordings, currentRecording } = get();
    
    // Include current recording if exists
    const allRecordings = currentRecording 
      ? [...completedRecordings, currentRecording]
      : completedRecordings;
    
    if (allRecordings.length < 5) {
      throw new Error('At least 5 recordings required for voice profile');
    }
    
    // Calculate overall quality
    const overallQuality = get().calculateOverallQuality();
    
    // Create voice profile
    const profileId = await get().createProfile(
      `Voice Profile ${new Date().toLocaleDateString()}`,
      'en' // TODO: Use selected language
    );
    
    // Update profile with training data
    const profile = get().getProfile(profileId);
    if (profile) {
      get().updateProfile(profileId, {
        recordings: allRecordings,
        qualityScore: overallQuality,
        trainingDuration: allRecordings.reduce((total, r) => total + r.duration, 0),
        features: {
          fundamentalFrequency: 150.0, // TODO: Calculate from audio
          formants: [800, 1200, 2500], // TODO: Calculate from audio
          voiceCharacteristics: 'placeholder_features', // TODO: Extract features
        },
      });
    }
    
    // Reset training state
    get().stopTraining();
    
    return profileId;
  },
  
  // Delete a recording
  deleteRecording: (recordingId: string) => {
    set(state => ({
      completedRecordings: state.completedRecordings.filter(r => r.id !== recordingId),
    }));
  },
  
  // Create new voice profile
  createProfile: async (name: string, language: string) => {
    const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newProfile: VoiceProfile = {
      id: profileId,
      name,
      language,
      recordings: [],
      qualityScore: 0,
      trainingDuration: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    };
    
    set(state => ({
      profiles: [...state.profiles, newProfile],
    }));
    
    await get().saveProfiles();
    
    return profileId;
  },
  
  // Update voice profile
  updateProfile: (profileId: string, updates: Partial<VoiceProfile>) => {
    set(state => ({
      profiles: state.profiles.map(profile =>
        profile.id === profileId
          ? { ...profile, ...updates, updatedAt: new Date().toISOString() }
          : profile
      ),
    }));
    
    get().saveProfiles();
  },
  
  // Delete voice profile
  deleteProfile: (profileId: string) => {
    set(state => ({
      profiles: state.profiles.filter(p => p.id !== profileId),
      activeProfileId: state.activeProfileId === profileId ? null : state.activeProfileId,
    }));
    
    get().saveProfiles();
  },
  
  // Set active profile
  setActiveProfile: (profileId: string | null) => {
    // Update previous default
    if (profileId) {
      set(state => ({
        profiles: state.profiles.map(profile => ({
          ...profile,
          isDefault: profile.id === profileId,
        })),
        activeProfileId: profileId,
      }));
    } else {
      set({ activeProfileId: null });
    }
    
    get().saveProfiles();
  },
  
  // Get profile by ID
  getProfile: (profileId: string) => {
    const { profiles } = get();
    return profiles.find(p => p.id === profileId) || null;
  },
  
  // Save profiles to storage
  saveProfiles: async () => {
    const { profiles } = get();
    
    try {
      // Save to localStorage
      const profilesData = profiles.map(profile => ({
        ...profile,
        recordings: profile.recordings.map(recording => ({
          ...recording,
          audioBlob: null, // Don't save blob to localStorage
        })),
      }));
      
      localStorage.setItem('vidlisync-voice-profiles', JSON.stringify(profilesData));
      
      // TODO: Save to backend API
      // await fetch('/api/user/voice-profiles', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profilesData)
      // });
      
    } catch (error) {
      console.error('Failed to save voice profiles:', error);
    }
  },
  
  // Load profiles from storage
  loadProfiles: async () => {
    try {
      // Load from localStorage
      const stored = localStorage.getItem('vidlisync-voice-profiles');
      if (stored) {
        const profilesData = JSON.parse(stored);
        set({
          profiles: profilesData,
          activeProfileId: profilesData.find((p: VoiceProfile) => p.isDefault)?.id || null,
        });
      }
      
      // TODO: Load from backend API and merge
      // const response = await fetch('/api/user/voice-profiles');
      // const serverProfiles = await response.json();
      // Merge with local profiles
      
    } catch (error) {
      console.error('Failed to load voice profiles:', error);
    }
  },
  
  // Analyze audio quality
  analyzeAudioQuality: async (audioBlob: Blob) => {
    try {
      // Convert blob to array buffer for analysis
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Basic quality analysis based on duration and size
      const duration = get().recordingDuration;
      const size = arrayBuffer.byteLength;
      
      // Quality heuristics
      let quality = 0.5; // Base quality
      
      // Duration check (optimal 3-8 seconds)
      if (duration >= 3000 && duration <= 8000) {
        quality += 0.2;
      } else if (duration < 2000) {
        quality -= 0.3;
      }
      
      // Size check (reasonable audio quality)
      const bytesPerSecond = size / (duration / 1000);
      if (bytesPerSecond > 8000) { // Good quality
        quality += 0.2;
      } else if (bytesPerSecond < 4000) { // Poor quality
        quality -= 0.2;
      }
      
      // Random variation for demo purposes
      quality += (Math.random() - 0.5) * 0.2;
      
      // Clamp between 0 and 1
      return Math.max(0, Math.min(1, quality));
      
    } catch (error) {
      console.error('Failed to analyze audio quality:', error);
      return 0.5; // Default quality
    }
  },
  
  // Calculate overall training quality
  calculateOverallQuality: () => {
    const { completedRecordings } = get();
    
    if (completedRecordings.length === 0) return 0;
    
    const totalQuality = completedRecordings.reduce((sum, recording) => sum + recording.quality, 0);
    return totalQuality / completedRecordings.length;
  },
}));

// Initialize voice profiles on load
if (typeof window !== 'undefined') {
  const store = useVoiceProfileStore.getState();
  store.loadProfiles();
}