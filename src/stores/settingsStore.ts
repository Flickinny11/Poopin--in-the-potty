/**
 * Comprehensive Settings Store for VidLiSync
 * Manages all application settings with persistence and search functionality
 */
import { create } from 'zustand';

export interface AudioVideoSettings {
  // Camera settings
  defaultCamera: string;
  videoQuality: 'auto' | '1080p' | '720p' | '480p';
  
  // Microphone settings
  defaultMicrophone: string;
  noiseReduction: boolean;
  echoCancellation: boolean;
  micGain: number; // 0-100
  
  // Speaker/Headphone settings
  defaultSpeaker: string;
  outputVolume: number; // 0-100
  
  // Bluetooth device management
  bluetoothDevices: Array<{
    id: string;
    name: string;
    type: 'microphone' | 'speaker' | 'headphones';
    connected: boolean;
  }>;
}

export interface TranslationSettings {
  defaultSourceLanguage: string;
  frequentLanguages: string[];
  
  // Voice cloning settings
  enableVoiceCloning: boolean;
  voiceQuality: 'high' | 'balanced' | 'fast';
  
  // Translation quality
  translationQuality: 'high' | 'balanced' | 'fast';
  
  // Offline models
  offlineModelsEnabled: boolean;
  
  // Performance mode
  performanceMode: 'quality' | 'balanced' | 'speed';
}

export interface VSFeatureSettings {
  // VS Environment
  vsEnvironment: {
    autoStart: boolean;
    defaultMode: 'audio' | 'text' | 'both';
    enableBackgroundMode: boolean;
  };
  
  // VS Presenter
  vsPresenter: {
    defaultMode: 'in-person' | 'hybrid' | 'multi-user-hub';
    languageLockDefault: boolean;
    maxParticipants: number;
  };
  
  // VS Friends
  vsFriends: {
    autoAcceptConnections: boolean;
    nearbyDiscovery: boolean;
    shareLocation: boolean;
  };
}

export interface NotificationSettings {
  // Call notifications
  callNotifications: boolean;
  incomingCallSound: boolean;
  callEndNotification: boolean;
  
  // Translation alerts
  translationAlerts: boolean;
  qualityWarnings: boolean;
  connectionIssues: boolean;
  
  // Usage warnings
  usageWarnings: boolean;
  dataUsageAlerts: boolean;
  billingAlerts: boolean;
  
  // Marketing (with opt-out)
  marketingEmails: boolean;
  productUpdates: boolean;
  featureAnnouncements: boolean;
}

export interface PrivacySecuritySettings {
  // Data collection
  analyticsEnabled: boolean;
  crashReporting: boolean;
  usageMetrics: boolean;
  
  // Export/Delete
  dataExportRequested: boolean;
  accountDeletionRequested: boolean;
  
  // Blocked users
  blockedUsers: Array<{
    userId: string;
    username: string;
    blockedAt: string;
  }>;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  textSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reduceMotion: boolean;
  colorScheme: 'default' | 'blue' | 'green' | 'purple';
}

export interface AdvancedSettings {
  // Developer options
  developerMode: boolean;
  enableLogging: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  
  // Cache management
  cacheSize: number; // in MB
  autoClearCache: boolean;
  clearCacheOnExit: boolean;
  
  // Performance
  enableGPUAcceleration: boolean;
  maxConcurrentTranslations: number;
}

export interface AccountProfileSettings {
  profileLanguage: string;
  timeZone: string;
  voiceProfileTrained: boolean;
  subscriptionTier: 'free' | 'basic' | 'pro' | 'business';
}

export interface AllSettings {
  account: AccountProfileSettings;
  audioVideo: AudioVideoSettings;
  translation: TranslationSettings;
  vsFeatures: VSFeatureSettings;
  notifications: NotificationSettings;
  privacy: PrivacySecuritySettings;
  appearance: AppearanceSettings;
  advanced: AdvancedSettings;
}

export interface SettingsState extends AllSettings {
  // UI state
  searchQuery: string;
  activeSection: keyof AllSettings | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  
  // Actions
  updateSetting: <T extends keyof AllSettings, K extends keyof AllSettings[T]>(
    section: T, 
    key: K, 
    value: AllSettings[T][K]
  ) => void;
  resetSection: (section: keyof AllSettings) => void;
  resetAllSettings: () => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setActiveSection: (section: keyof AllSettings | null) => void;
  exportSettings: () => Promise<string>;
  importSettings: (settingsJson: string) => Promise<void>;
  getAvailableDevices: () => Promise<void>;
}

// Default settings
const DEFAULT_SETTINGS: AllSettings = {
  account: {
    profileLanguage: 'en',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    voiceProfileTrained: false,
    subscriptionTier: 'free',
  },
  audioVideo: {
    defaultCamera: 'auto',
    videoQuality: 'auto',
    defaultMicrophone: 'auto',
    noiseReduction: true,
    echoCancellation: true,
    micGain: 75,
    defaultSpeaker: 'auto',
    outputVolume: 80,
    bluetoothDevices: [],
  },
  translation: {
    defaultSourceLanguage: 'en',
    frequentLanguages: ['en', 'es', 'fr'],
    enableVoiceCloning: true,
    voiceQuality: 'balanced',
    translationQuality: 'balanced',
    offlineModelsEnabled: true,
    performanceMode: 'balanced',
  },
  vsFeatures: {
    vsEnvironment: {
      autoStart: false,
      defaultMode: 'both',
      enableBackgroundMode: true,
    },
    vsPresenter: {
      defaultMode: 'hybrid',
      languageLockDefault: true,
      maxParticipants: 10,
    },
    vsFriends: {
      autoAcceptConnections: false,
      nearbyDiscovery: true,
      shareLocation: false,
    },
  },
  notifications: {
    callNotifications: true,
    incomingCallSound: true,
    callEndNotification: true,
    translationAlerts: true,
    qualityWarnings: true,
    connectionIssues: true,
    usageWarnings: true,
    dataUsageAlerts: true,
    billingAlerts: true,
    marketingEmails: false,
    productUpdates: true,
    featureAnnouncements: true,
  },
  privacy: {
    analyticsEnabled: false,
    crashReporting: true,
    usageMetrics: false,
    dataExportRequested: false,
    accountDeletionRequested: false,
    blockedUsers: [],
  },
  appearance: {
    theme: 'auto',
    textSize: 'medium',
    highContrast: false,
    reduceMotion: false,
    colorScheme: 'default',
  },
  advanced: {
    developerMode: false,
    enableLogging: false,
    logLevel: 'warn',
    cacheSize: 500,
    autoClearCache: true,
    clearCacheOnExit: false,
    enableGPUAcceleration: true,
    maxConcurrentTranslations: 3,
  },
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  
  // UI state
  searchQuery: '',
  activeSection: null,
  isLoading: false,
  hasUnsavedChanges: false,
  
  // Update a specific setting
  updateSetting: (section, key, value) => {
    set((state) => ({
      ...state,
      [section]: {
        ...state[section],
        [key]: value,
      },
      hasUnsavedChanges: true,
    }));
  },
  
  // Reset a specific section to defaults
  resetSection: (section) => {
    set((state) => ({
      ...state,
      [section]: DEFAULT_SETTINGS[section],
      hasUnsavedChanges: true,
    }));
  },
  
  // Reset all settings to defaults
  resetAllSettings: () => {
    set({
      ...DEFAULT_SETTINGS,
      searchQuery: '',
      activeSection: null,
      isLoading: false,
      hasUnsavedChanges: true,
    });
  },
  
  // Save settings to backend/localStorage
  saveSettings: async () => {
    set({ isLoading: true });
    
    try {
      const currentState = get();
      const settingsToSave = {
        account: currentState.account,
        audioVideo: currentState.audioVideo,
        translation: currentState.translation,
        vsFeatures: currentState.vsFeatures,
        notifications: currentState.notifications,
        privacy: currentState.privacy,
        appearance: currentState.appearance,
        advanced: currentState.advanced,
      };
      
      // Save to localStorage for persistence
      localStorage.setItem('vidlisync-settings', JSON.stringify(settingsToSave));
      
      // TODO: Save to backend API
      // await fetch('/api/user/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settingsToSave)
      // });
      
      set({ hasUnsavedChanges: false });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Load settings from backend/localStorage
  loadSettings: async () => {
    set({ isLoading: true });
    
    try {
      // Load from localStorage first
      const stored = localStorage.getItem('vidlisync-settings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        set((state) => ({
          ...state,
          ...parsedSettings,
          hasUnsavedChanges: false,
        }));
      }
      
      // TODO: Load from backend API and merge
      // const response = await fetch('/api/user/settings');
      // const serverSettings = await response.json();
      // Merge server settings with local settings
      
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Set search query
  setSearchQuery: (query) => {
    set({ searchQuery: query.toLowerCase() });
  },
  
  // Set active section
  setActiveSection: (section) => {
    set({ activeSection: section });
  },
  
  // Export settings as JSON
  exportSettings: async () => {
    const currentState = get();
    const settingsToExport = {
      account: currentState.account,
      audioVideo: currentState.audioVideo,
      translation: currentState.translation,
      vsFeatures: currentState.vsFeatures,
      notifications: currentState.notifications,
      privacy: currentState.privacy,
      appearance: currentState.appearance,
      advanced: currentState.advanced,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    
    return JSON.stringify(settingsToExport, null, 2);
  },
  
  // Import settings from JSON
  importSettings: async (settingsJson) => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      // Validate imported settings structure
      const validSections = ['account', 'audioVideo', 'translation', 'vsFeatures', 'notifications', 'privacy', 'appearance', 'advanced'];
      const settingsToImport: Partial<AllSettings> = {};
      
      for (const section of validSections) {
        if (importedSettings[section]) {
          settingsToImport[section as keyof AllSettings] = {
            ...DEFAULT_SETTINGS[section as keyof AllSettings],
            ...importedSettings[section],
          };
        }
      }
      
      set((state) => ({
        ...state,
        ...settingsToImport,
        hasUnsavedChanges: true,
      }));
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw new Error('Invalid settings file format');
    }
  },
  
  // Get available devices (cameras, microphones, speakers)
  getAvailableDevices: async () => {
    try {
      // Request device permissions
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      // Get device list
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const microphones = devices.filter(device => device.kind === 'audioinput');
      const speakers = devices.filter(device => device.kind === 'audiooutput');
      
      // Update available devices in settings
      // This would be used to populate device selection dropdowns
      console.log('Available devices:', { cameras, microphones, speakers });
      
    } catch (error) {
      console.error('Failed to get available devices:', error);
    }
  },
}));

// Initialize settings on load
if (typeof window !== 'undefined') {
  const store = useSettingsStore.getState();
  store.loadSettings();
}