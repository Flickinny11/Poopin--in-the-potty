/**
 * Translation state management with Zustand
 * Manages real-time translation during video calls
 */
import { create } from 'zustand';

export interface TranslationMetrics {
  latency_ms: number;
  quality_score: number;
  accuracy: number;
  processing_time_ms: number;
}

export interface TranslationResult {
  sessionId: string;
  sourceText: string;
  translatedText: string;
  synthesizedAudio: string; // base64 encoded
  lipSyncVideo?: string; // base64 encoded
  qualityMetrics: TranslationMetrics;
  timestamp: number;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface TranslationState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Translation session
  sessionId: string | null;
  isTranslationActive: boolean;
  
  // Language settings
  sourceLanguage: string;
  targetLanguage: string;
  availableLanguages: LanguageOption[];
  autoDetectLanguage: boolean;
  
  // Real-time translation results
  currentTranslation: TranslationResult | null;
  translationHistory: TranslationResult[];
  
  // Quality metrics
  averageLatency: number;
  translationQuality: 'excellent' | 'good' | 'fair' | 'poor';
  connectionQuality: 'stable' | 'unstable' | 'poor';
  
  // UI state
  showTranslationOverlay: boolean;
  showOriginalText: boolean;
  overlayPosition: 'top' | 'bottom' | 'center';
  translationVolume: number;
  
  // Voice profile
  voiceProfileId: string | null;
  isVoiceTrainingRequired: boolean;
  
  // Error handling
  lastError: string | null;
  fallbackMode: 'original-audio' | 'text-only' | 'off';
  
  // Performance monitoring
  isMonitoringEnabled: boolean;
  performanceStats: {
    totalTranslations: number;
    successfulTranslations: number;
    averageLatency: number;
    qualityScore: number;
  };
  
  // Actions
  connect: (userId: string, token: string) => Promise<void>;
  disconnect: () => void;
  startTranslation: (sourceLanguage: string, targetLanguage: string, voiceProfileId?: string) => Promise<void>;
  stopTranslation: () => void;
  switchLanguages: (sourceLanguage: string, targetLanguage: string) => Promise<void>;
  setSourceLanguage: (language: string) => void;
  setTargetLanguage: (language: string) => void;
  setAutoDetectLanguage: (enabled: boolean) => void;
  setShowTranslationOverlay: (show: boolean) => void;
  setShowOriginalText: (show: boolean) => void;
  setOverlayPosition: (position: 'top' | 'bottom' | 'center') => void;
  setTranslationVolume: (volume: number) => void;
  setVoiceProfileId: (profileId: string | null) => void;
  setFallbackMode: (mode: 'original-audio' | 'text-only' | 'off') => void;
  clearError: () => void;
  addTranslationResult: (result: TranslationResult) => void;
  updatePerformanceStats: (metrics: TranslationMetrics) => void;
}

// Default language options
const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

export const useTranslationStore = create<TranslationState>((set, get) => ({
  // Initial state
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  sessionId: null,
  isTranslationActive: false,
  sourceLanguage: 'en',
  targetLanguage: 'es',
  availableLanguages: DEFAULT_LANGUAGES,
  autoDetectLanguage: true,
  currentTranslation: null,
  translationHistory: [],
  averageLatency: 0,
  translationQuality: 'good',
  connectionQuality: 'stable',
  showTranslationOverlay: true,
  showOriginalText: true,
  overlayPosition: 'bottom',
  translationVolume: 1.0,
  voiceProfileId: null,
  isVoiceTrainingRequired: false,
  lastError: null,
  fallbackMode: 'original-audio',
  isMonitoringEnabled: true,
  performanceStats: {
    totalTranslations: 0,
    successfulTranslations: 0,
    averageLatency: 0,
    qualityScore: 0,
  },

  // Connect to translation WebSocket
  connect: async (userId: string, token: string) => {
    set({ isConnecting: true, connectionError: null });
    
    try {
      // This will be implemented by the WebSocket hook
      // For now, just simulate connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set({
        isConnected: true,
        isConnecting: false,
        connectionError: null,
      });
    } catch (error) {
      set({
        isConnected: false,
        isConnecting: false,
        connectionError: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  },

  // Disconnect from translation WebSocket
  disconnect: () => {
    set({
      isConnected: false,
      isConnecting: false,
      sessionId: null,
      isTranslationActive: false,
      currentTranslation: null,
      connectionError: null,
    });
  },

  // Start translation session
  startTranslation: async (sourceLanguage: string, targetLanguage: string, voiceProfileId?: string) => {
    const { isConnected } = get();
    
    if (!isConnected) {
      throw new Error('Not connected to translation service');
    }

    try {
      // Generate session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      set({
        sessionId,
        isTranslationActive: true,
        sourceLanguage,
        targetLanguage,
        voiceProfileId: voiceProfileId || null,
        lastError: null,
      });

      // This will send WebSocket message to start translation
      // Implementation will be in the WebSocket hook
      
    } catch (error) {
      set({
        lastError: error instanceof Error ? error.message : 'Failed to start translation',
        isTranslationActive: false,
      });
    }
  },

  // Stop translation session
  stopTranslation: () => {
    set({
      isTranslationActive: false,
      sessionId: null,
      currentTranslation: null,
    });
  },

  // Switch languages during active translation
  switchLanguages: async (sourceLanguage: string, targetLanguage: string) => {
    const { isTranslationActive, sessionId } = get();
    
    if (isTranslationActive && sessionId) {
      // Stop current translation and start new one
      get().stopTranslation();
      await get().startTranslation(sourceLanguage, targetLanguage, get().voiceProfileId || undefined);
    } else {
      set({ sourceLanguage, targetLanguage });
    }
  },

  // Simple setters
  setSourceLanguage: (language: string) => set({ sourceLanguage: language }),
  setTargetLanguage: (language: string) => set({ targetLanguage: language }),
  setAutoDetectLanguage: (enabled: boolean) => set({ autoDetectLanguage: enabled }),
  setShowTranslationOverlay: (show: boolean) => set({ showTranslationOverlay: show }),
  setShowOriginalText: (show: boolean) => set({ showOriginalText: show }),
  setOverlayPosition: (position: 'top' | 'bottom' | 'center') => set({ overlayPosition: position }),
  setTranslationVolume: (volume: number) => set({ translationVolume: Math.max(0, Math.min(1, volume)) }),
  setVoiceProfileId: (profileId: string | null) => set({ voiceProfileId: profileId }),
  setFallbackMode: (mode: 'original-audio' | 'text-only' | 'off') => set({ fallbackMode: mode }),
  clearError: () => set({ lastError: null, connectionError: null }),

  // Add translation result to history
  addTranslationResult: (result: TranslationResult) => {
    const { translationHistory } = get();
    const newHistory = [...translationHistory, result].slice(-50); // Keep last 50 results
    
    set({
      currentTranslation: result,
      translationHistory: newHistory,
    });
    
    // Update performance stats
    get().updatePerformanceStats(result.qualityMetrics);
  },

  // Update performance statistics
  updatePerformanceStats: (metrics: TranslationMetrics) => {
    const { performanceStats } = get();
    const totalTranslations = performanceStats.totalTranslations + 1;
    const successfulTranslations = performanceStats.successfulTranslations + 1;
    
    // Calculate running averages
    const averageLatency = (
      (performanceStats.averageLatency * performanceStats.totalTranslations + metrics.latency_ms) /
      totalTranslations
    );
    
    const qualityScore = (
      (performanceStats.qualityScore * performanceStats.totalTranslations + metrics.quality_score) /
      totalTranslations
    );

    // Determine overall translation quality
    let translationQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    if (qualityScore >= 0.9) translationQuality = 'excellent';
    else if (qualityScore >= 0.7) translationQuality = 'good';
    else if (qualityScore >= 0.5) translationQuality = 'fair';
    else translationQuality = 'poor';

    // Determine connection quality based on latency
    let connectionQuality: 'stable' | 'unstable' | 'poor' = 'stable';
    if (averageLatency > 1000) connectionQuality = 'poor';
    else if (averageLatency > 500) connectionQuality = 'unstable';

    set({
      performanceStats: {
        totalTranslations,
        successfulTranslations,
        averageLatency,
        qualityScore,
      },
      averageLatency,
      translationQuality,
      connectionQuality,
    });
  },
}));