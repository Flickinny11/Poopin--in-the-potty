/**
 * Comprehensive settings store for VidLiSync
 * Manages all user preferences, configurations, and app settings
 */
import { create } from 'zustand';

// Settings structure interfaces
export interface ProfileSettings {
  language: string;
  voiceProfileTrained: boolean;
  voiceProfileId: string | null;
  subscriptionTier: 'free' | 'basic' | 'pro' | 'business';
}

export interface AudioVideoSettings {
  defaultCamera: string;
  defaultMicrophone: string;
  defaultSpeaker: string;
  videoQuality: 'Auto' | '1080p' | '720p' | '480p';
  audioQuality: 'High' | 'Medium' | 'Low';
  echoCancellation: boolean;
  noiseReduction: boolean;
  bluetoothEnabled: boolean;
  autoGainControl: boolean;
}

export interface TranslationSettings {
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  frequentLanguages: string[];
  enableVoiceCloning: boolean;
  voiceQuality: 'High (Slower)' | 'Balanced' | 'Fast (Lower Quality)';
  translationQuality: 'Accurate' | 'Fast' | 'Balanced';
  offlineMode: boolean;
  performanceMode: 'Quality' | 'Speed' | 'Balanced';
}

export interface VSEnvironmentSettings {
  autoStart: boolean;
  defaultMode: 'Audio Only' | 'Text Only' | 'Audio + Text';
  autoJoinTranslation: boolean;
  showLiveTranscription: boolean;
}

export interface VSPresenterSettings {
  defaultMode: 'In-Person' | 'Hybrid' | 'Multi-User Hub';
  languageLockDefault: boolean;
  maxParticipants: number;
  autoRecording: boolean;
  shareTranscriptByDefault: boolean;
}

export interface VSFriendsSettings {
  autoAccept: boolean;
  nearbyDiscovery: boolean;
  allowVoiceRequests: boolean;
  shareLocationForNearby: boolean;
}

export interface NotificationSettings {
  callNotifications: boolean;
  translationAlerts: boolean;
  usageWarnings: boolean;
  marketingEmails: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface PrivacySettings {
  dataCollection: boolean;
  analyticsToggle: boolean;
  crashReporting: boolean;
  performanceData: boolean;
  voiceDataStorage: boolean;
  autoDeleteTranscripts: boolean;
  transcriptRetentionDays: number;
  allowContactSync: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  textSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reduceMotion: boolean;
  compactMode: boolean;
  showOnboardingTips: boolean;
}

export interface AdvancedSettings {
  developerMode: boolean;
  debugLogging: boolean;
  cacheSize: number; // MB
  maxCacheAge: number; // days
  forceLocalProcessing: boolean;
  gpuAcceleration: boolean;
  experimentalFeatures: boolean;
}

export interface ModelStatus {
  whisper: {
    downloaded: boolean;
    size: number;
    version: string;
    lastUpdated: Date | null;
  };
  nllb: {
    downloaded: boolean;
    size: number;
    version: string;
    lastUpdated: Date | null;
  };
  wunjoVoice: {
    downloaded: boolean;
    size: number;
    version: string;
    lastUpdated: Date | null;
  };
  wunjoLips: {
    downloaded: boolean;
    size: number;
    version: string;
    lastUpdated: Date | null;
  };
}

export interface SettingsState {
  // Settings categories
  profile: ProfileSettings;
  audioVideo: AudioVideoSettings;
  translation: TranslationSettings;
  vsEnvironment: VSEnvironmentSettings;
  vsPresenter: VSPresenterSettings;
  vsFriends: VSFriendsSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
  advanced: AdvancedSettings;
  
  // Model management
  modelStatus: ModelStatus;
  
  // UI state
  activeSection: string;
  searchQuery: string;
  isLoading: boolean;
  lastSyncTime: Date | null;
  
  // Actions
  updateSetting: (section: string, key: string, value: any) => void;
  resetSection: (section: string) => void;
  resetAllSettings: () => void;
  searchSettings: (query: string) => void;
  setActiveSection: (section: string) => void;
  importSettings: (settings: Partial<SettingsState>) => void;
  exportSettings: () => Partial<SettingsState>;
  syncWithServer: () => Promise<void>;
  
  // Model management actions
  downloadModel: (modelId: keyof ModelStatus) => Promise<void>;
  verifyModel: (modelId: keyof ModelStatus) => Promise<boolean>;
  deleteModel: (modelId: keyof ModelStatus) => Promise<void>;
  
  // Persistence
  loadSettings: () => void;
  saveSettings: () => void;
}

// Default settings
const defaultSettings = {
  profile: {
    language: 'en',
    voiceProfileTrained: false,
    voiceProfileId: null,
    subscriptionTier: 'free' as const,
  },
  audioVideo: {
    defaultCamera: 'auto',
    defaultMicrophone: 'auto',
    defaultSpeaker: 'auto',
    videoQuality: 'Auto' as const,
    audioQuality: 'High' as const,
    echoCancellation: true,
    noiseReduction: true,
    bluetoothEnabled: true,
    autoGainControl: true,
  },
  translation: {
    defaultSourceLanguage: 'en',
    defaultTargetLanguage: 'es',
    frequentLanguages: ['en', 'es', 'fr', 'de'],
    enableVoiceCloning: false,
    voiceQuality: 'Balanced' as const,
    translationQuality: 'Balanced' as const,
    offlineMode: false,
    performanceMode: 'Balanced' as const,
  },
  vsEnvironment: {
    autoStart: false,
    defaultMode: 'Audio + Text' as const,
    autoJoinTranslation: true,
    showLiveTranscription: true,
  },
  vsPresenter: {
    defaultMode: 'In-Person' as const,
    languageLockDefault: true,
    maxParticipants: 10,
    autoRecording: false,
    shareTranscriptByDefault: true,
  },
  vsFriends: {
    autoAccept: false,
    nearbyDiscovery: true,
    allowVoiceRequests: true,
    shareLocationForNearby: false,
  },
  notifications: {
    callNotifications: true,
    translationAlerts: true,
    usageWarnings: true,
    marketingEmails: false,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  },
  privacy: {
    dataCollection: true,
    analyticsToggle: true,
    crashReporting: true,
    performanceData: true,
    voiceDataStorage: false,
    autoDeleteTranscripts: true,
    transcriptRetentionDays: 30,
    allowContactSync: false,
  },
  appearance: {
    theme: 'auto' as const,
    textSize: 'medium' as const,
    highContrast: false,
    reduceMotion: false,
    compactMode: false,
    showOnboardingTips: true,
  },
  advanced: {
    developerMode: false,
    debugLogging: false,
    cacheSize: 1024, // 1GB
    maxCacheAge: 7,
    forceLocalProcessing: false,
    gpuAcceleration: true,
    experimentalFeatures: false,
  },
  modelStatus: {
    whisper: {
      downloaded: false,
      size: 1610000000, // 1.5GB
      version: 'large-v3',
      lastUpdated: null,
    },
    nllb: {
      downloaded: false,
      size: 2400000000, // 2.4GB
      version: 'nllb-200-distilled',
      lastUpdated: null,
    },
    wunjoVoice: {
      downloaded: false,
      size: 500000000, // 500MB
      version: 'v2.1',
      lastUpdated: null,
    },
    wunjoLips: {
      downloaded: false,
      size: 800000000, // 800MB
      version: 'v1.8',
      lastUpdated: null,
    },
  },
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  ...defaultSettings,
  activeSection: 'account',
  searchQuery: '',
  isLoading: false,
  lastSyncTime: null,

  // Actions
  updateSetting: (section: string, key: string, value: any) => {
    set((state) => {
      const currentSection = (state as any)[section];
      if (!currentSection || typeof currentSection !== 'object') {
        return state;
      }
      
      return {
        ...state,
        [section]: {
          ...currentSection,
          [key]: value,
        },
      };
    });
    
    // Auto-save after update
    get().saveSettings();
  },

  resetSection: (section: string) => {
    const defaultSectionSettings = (defaultSettings as any)[section];
    if (defaultSectionSettings) {
      set((state) => ({
        ...state,
        [section]: { ...defaultSectionSettings },
      }));
      get().saveSettings();
    }
  },

  resetAllSettings: () => {
    set((state) => ({
      ...state,
      ...defaultSettings,
    }));
    get().saveSettings();
  },

  searchSettings: (query: string) => {
    set({ searchQuery: query });
  },

  setActiveSection: (section: string) => {
    set({ activeSection: section });
  },

  importSettings: (settings: Partial<SettingsState>) => {
    set((state) => ({
      ...state,
      ...settings,
    }));
    get().saveSettings();
  },

  exportSettings: () => {
    const state = get();
    return {
      profile: state.profile,
      audioVideo: state.audioVideo,
      translation: state.translation,
      vsEnvironment: state.vsEnvironment,
      vsPresenter: state.vsPresenter,
      vsFriends: state.vsFriends,
      notifications: state.notifications,
      privacy: state.privacy,
      appearance: state.appearance,
      advanced: state.advanced,
      modelStatus: state.modelStatus,
    };
  },

  syncWithServer: async () => {
    set({ isLoading: true });
    try {
      // TODO: Implement API sync
      const settings = get().exportSettings();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set({ 
        isLoading: false,
        lastSyncTime: new Date(),
      });
    } catch (error) {
      console.error('Failed to sync settings:', error);
      set({ isLoading: false });
    }
  },

  downloadModel: async (modelId: keyof ModelStatus) => {
    set((state) => ({
      modelStatus: {
        ...state.modelStatus,
        [modelId]: {
          ...state.modelStatus[modelId],
          downloading: true,
        },
      },
    }));

    try {
      // TODO: Implement actual model download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      set((state) => ({
        modelStatus: {
          ...state.modelStatus,
          [modelId]: {
            ...state.modelStatus[modelId],
            downloaded: true,
            lastUpdated: new Date(),
            downloading: false,
          },
        },
      }));
    } catch (error) {
      console.error(`Failed to download ${modelId} model:`, error);
      set((state) => ({
        modelStatus: {
          ...state.modelStatus,
          [modelId]: {
            ...state.modelStatus[modelId],
            downloading: false,
          },
        },
      }));
    }
  },

  verifyModel: async (modelId: keyof ModelStatus) => {
    try {
      // TODO: Implement model verification
      return true;
    } catch (error) {
      console.error(`Failed to verify ${modelId} model:`, error);
      return false;
    }
  },

  deleteModel: async (modelId: keyof ModelStatus) => {
    try {
      // TODO: Implement model deletion
      set((state) => ({
        modelStatus: {
          ...state.modelStatus,
          [modelId]: {
            ...state.modelStatus[modelId],
            downloaded: false,
            lastUpdated: null,
          },
        },
      }));
    } catch (error) {
      console.error(`Failed to delete ${modelId} model:`, error);
    }
  },

  loadSettings: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('vidlisync-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        set((state) => ({
          ...state,
          ...settings,
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  saveSettings: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const settings = get().exportSettings();
      localStorage.setItem('vidlisync-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
}));

// Initialize settings on browser load
if (typeof window !== 'undefined') {
  const store = useSettingsStore.getState();
  store.loadSettings();
}