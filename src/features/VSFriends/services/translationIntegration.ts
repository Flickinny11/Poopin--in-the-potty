/**
 * VS Friends Translation Integration
 * Integrates VS Friends with the existing VidLiSync AI translation pipeline
 */

import { AudioStream, TranslationRequest, TranslationResult } from '../types';

export interface VSFriendsTranslationConfig {
  apiEndpoint: string;
  apiKey: string;
  enableVoiceCloning: boolean;
  maxLatency: number; // milliseconds
  fallbackLanguage: string;
}

export class VSFriendsTranslationService {
  private config: VSFriendsTranslationConfig;
  private websocketConnection: WebSocket | null = null;
  private activeTranslations = new Map<string, Promise<TranslationResult>>();

  constructor(config: VSFriendsTranslationConfig) {
    this.config = config;
  }

  /**
   * Initialize WebSocket connection for real-time translation
   */
  async initializeRealTimeTranslation(sessionId: string): Promise<void> {
    const wsUrl = `${this.config.apiEndpoint.replace('http', 'ws')}/ws/translation`;
    
    this.websocketConnection = new WebSocket(wsUrl);
    
    return new Promise((resolve, reject) => {
      this.websocketConnection!.onopen = () => {
        // Send session initialization
        this.websocketConnection!.send(JSON.stringify({
          type: 'init_session',
          session_id: sessionId,
          config: {
            enable_voice_cloning: this.config.enableVoiceCloning,
            max_latency_ms: this.config.maxLatency
          }
        }));
        resolve();
      };

      this.websocketConnection!.onerror = (error) => {
        reject(error);
      };

      this.websocketConnection!.onmessage = (event) => {
        this.handleTranslationResult(JSON.parse(event.data));
      };
    });
  }

  /**
   * Translate audio using the existing VidLiSync AI pipeline
   */
  async translateAudio(
    audioData: Uint8Array,
    sourceLanguage: string,
    targetLanguage: string,
    participantId: string,
    useVoiceCloning: boolean = true
  ): Promise<TranslationResult> {
    // Check if we already have a translation in progress for this participant
    const translationKey = `${participantId}_${Date.now()}`;
    
    // Use WebSocket for real-time translation if available
    if (this.websocketConnection && this.websocketConnection.readyState === WebSocket.OPEN) {
      return this.translateViaWebSocket(
        audioData,
        sourceLanguage,
        targetLanguage,
        translationKey,
        useVoiceCloning
      );
    }

    // Fallback to HTTP API
    return this.translateViaHTTP(
      audioData,
      sourceLanguage,
      targetLanguage,
      useVoiceCloning
    );
  }

  /**
   * Translate via WebSocket for lower latency
   */
  private translateViaWebSocket(
    audioData: Uint8Array,
    sourceLanguage: string,
    targetLanguage: string,
    translationKey: string,
    useVoiceCloning: boolean
  ): Promise<TranslationResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.activeTranslations.delete(translationKey);
        reject(new Error('Translation timeout'));
      }, this.config.maxLatency);

      // Store the promise for this translation
      this.activeTranslations.set(translationKey, 
        new Promise((resolveTranslation) => {
          // Set up listener for this specific translation
          const messageHandler = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.translation_key === translationKey) {
              clearTimeout(timeout);
              this.websocketConnection!.removeEventListener('message', messageHandler);
              resolveTranslation(data.result);
            }
          };

          this.websocketConnection!.addEventListener('message', messageHandler);
        })
      );

      // Send translation request
      this.websocketConnection!.send(JSON.stringify({
        type: 'translate_audio',
        translation_key: translationKey,
        audio_data: Array.from(audioData), // Convert to array for JSON
        source_language: sourceLanguage,
        target_language: targetLanguage,
        use_voice_cloning: useVoiceCloning,
        timestamp: Date.now()
      }));

      // Return the promise
      this.activeTranslations.get(translationKey)!.then(resolve).catch(reject);
    });
  }

  /**
   * Translate via HTTP API as fallback
   */
  private async translateViaHTTP(
    audioData: Uint8Array,
    sourceLanguage: string,
    targetLanguage: string,
    useVoiceCloning: boolean
  ): Promise<TranslationResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.config.apiEndpoint}/translation/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          audio_data: btoa(String.fromCharCode(...audioData)),
          source_language: sourceLanguage,
          target_language: targetLanguage,
          use_voice_cloning: useVoiceCloning,
          include_lip_sync: false // VS Friends doesn't need lip sync
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        originalText: result.source_text || '',
        translatedText: result.translated_text || '',
        synthesizedAudio: this.base64ToUint8Array(result.synthesized_audio || ''),
        confidence: result.quality_metrics?.overall_quality || 0.8,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Translation failed:', error);
      
      // Return fallback result
      return {
        originalText: '[Audio detected]',
        translatedText: '[Translation unavailable]',
        synthesizedAudio: new Uint8Array(0),
        confidence: 0.0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Handle translation results from WebSocket
   */
  private handleTranslationResult(data: any): void {
    // This method would handle incoming translation results
    // and route them to the appropriate handlers
    if (data.type === 'translation_complete') {
      const translationKey = data.translation_key;
      // The promise resolution is handled in translateViaWebSocket
    }
  }

  /**
   * Get supported language pairs
   */
  async getSupportedLanguages(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/translation/languages`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.languages || [];
      }
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
    }

    // Return default supported languages
    return [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
      'ar', 'hi', 'th', 'vi', 'tr', 'nl', 'sv', 'da', 'no', 'fi'
    ];
  }

  /**
   * Check translation service health
   */
  async checkServiceHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/translation/health`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Translation service health check failed:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.websocketConnection) {
      this.websocketConnection.close();
      this.websocketConnection = null;
    }

    this.activeTranslations.clear();
  }

  /**
   * Convert base64 string to Uint8Array
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
  }
}

/**
 * VS Friends Billing Integration
 */
export interface VSFriendsBillingEvent {
  type: 'session_start' | 'session_end' | 'participant_joined' | 'participant_left';
  sessionId: string;
  initiatorId: string;
  participantId?: string;
  timestamp: Date;
  metadata: {
    participantCount: number;
    languagePairs: string[];
    duration?: number; // in milliseconds
  };
}

export class VSFriendsBillingService {
  private apiEndpoint: string;
  private apiKey: string;
  private activeSessions = new Map<string, VSFriendsBillingEvent>();

  constructor(apiEndpoint: string, apiKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  /**
   * Track VS Friends session events for billing
   */
  async trackEvent(event: VSFriendsBillingEvent): Promise<void> {
    try {
      if (event.type === 'session_start') {
        this.activeSessions.set(event.sessionId, event);
      } else if (event.type === 'session_end') {
        const startEvent = this.activeSessions.get(event.sessionId);
        if (startEvent) {
          event.metadata.duration = event.timestamp.getTime() - startEvent.timestamp.getTime();
          this.activeSessions.delete(event.sessionId);
        }
      }

      await fetch(`${this.apiEndpoint}/billing/vsfriends/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(event)
      });

    } catch (error) {
      console.error('Failed to track billing event:', error);
    }
  }

  /**
   * Calculate cost for a VS Friends session
   */
  async calculateSessionCost(
    sessionId: string,
    durationMs: number,
    participantCount: number,
    languagePairs: string[]
  ): Promise<number> {
    try {
      const response = await fetch(`${this.apiEndpoint}/billing/vsfriends/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          duration_ms: durationMs,
          participant_count: participantCount,
          language_pairs: languagePairs
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.cost || 0;
      }

    } catch (error) {
      console.error('Failed to calculate session cost:', error);
    }

    // Fallback calculation
    const minutes = Math.ceil(durationMs / 60000);
    const baseRate = 0.02; // $0.02 per minute
    const participantMultiplier = Math.max(1, participantCount);
    
    return minutes * baseRate * participantMultiplier;
  }

  /**
   * Get user's billing limits for VS Friends
   */
  async getUserLimits(userId: string): Promise<{
    maxParticipants: number;
    monthlyMinuteLimit: number;
    remainingMinutes: number;
  }> {
    try {
      const response = await fetch(`${this.apiEndpoint}/billing/vsfriends/limits/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        return await response.json();
      }

    } catch (error) {
      console.error('Failed to get user limits:', error);
    }

    // Default free tier limits
    return {
      maxParticipants: 2,
      monthlyMinuteLimit: 5,
      remainingMinutes: 5
    };
  }
}

/**
 * Factory function to create configured VS Friends services
 */
export function createVSFriendsServices(config: {
  translationApiEndpoint: string;
  billingApiEndpoint: string;
  apiKey: string;
  enableVoiceCloning?: boolean;
  maxLatency?: number;
}) {
  const translationConfig: VSFriendsTranslationConfig = {
    apiEndpoint: config.translationApiEndpoint,
    apiKey: config.apiKey,
    enableVoiceCloning: config.enableVoiceCloning ?? true,
    maxLatency: config.maxLatency ?? 400,
    fallbackLanguage: 'en'
  };

  const translationService = new VSFriendsTranslationService(translationConfig);
  const billingService = new VSFriendsBillingService(config.billingApiEndpoint, config.apiKey);

  return {
    translationService,
    billingService
  };
}

// Export singleton for easy use
let vsFriendsServices: ReturnType<typeof createVSFriendsServices> | null = null;

export function getVSFriendsServices(): ReturnType<typeof createVSFriendsServices> {
  if (!vsFriendsServices) {
    throw new Error('VS Friends services not initialized. Call createVSFriendsServices first.');
  }
  return vsFriendsServices;
}

export function initializeVSFriendsServices(config: Parameters<typeof createVSFriendsServices>[0]): void {
  vsFriendsServices = createVSFriendsServices(config);
}