/**
 * VS Friends Audio Service - Handles audio processing and translation
 */

import { AudioStream } from '../types';

export interface TranslationRequest {
  audioData: Uint8Array;
  sourceLanguage: string;
  targetLanguage: string;
  participantId: string;
  useVoiceCloning: boolean;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  synthesizedAudio: Uint8Array;
  confidence: number;
  processingTime: number;
}

export class VSFriendsAudioService {
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private isRecording = false;
  private audioChunks: Blob[] = [];
  
  // Initialize audio processing
  async initialize(): Promise<void> {
    try {
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Request microphone access with earbuds preference
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      // Set up MediaRecorder for audio capture
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.setupMediaRecorderEvents();
      
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
      throw new Error('Microphone access required for VS Friends');
    }
  }

  // Start audio capture
  startCapture(onAudioData: (audioData: Uint8Array) => void): void {
    if (!this.mediaRecorder || this.isRecording) {
      return;
    }

    this.audioChunks = [];
    this.isRecording = true;

    // Capture audio in small chunks for real-time processing
    this.mediaRecorder.start(500); // 500ms chunks

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
        
        // Convert blob to Uint8Array for processing
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const audioData = new Uint8Array(arrayBuffer);
          onAudioData(audioData);
        };
        reader.readAsArrayBuffer(event.data);
      }
    };
  }

  // Stop audio capture
  stopCapture(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  // Process audio for translation
  async translateAudio(request: TranslationRequest): Promise<TranslationResult> {
    const startTime = Date.now();
    
    try {
      // In real implementation, this would call the VidLiSync AI pipeline
      // For now, simulate the translation process
      const mockResult = await this.simulateTranslation(request);
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...mockResult,
        processingTime
      };
      
    } catch (error) {
      console.error('Translation failed:', error);
      throw new Error('Failed to translate audio');
    }
  }

  // Play translated audio through earbuds
  async playAudio(audioData: Uint8Array): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    try {
      // Convert Uint8Array to AudioBuffer
      const arrayBuffer = audioData.buffer.slice(audioData.byteOffset, audioData.byteOffset + audioData.byteLength) as ArrayBuffer;
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      
      // Create audio source
      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      
      // Connect to output (earbuds preferred)
      source.connect(this.audioContext!.destination);
      
      // Play audio
      source.start();
      
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  // Get audio level for visualization
  getAudioLevel(): number {
    if (!this.audioContext || !this.audioStream) {
      return 0;
    }

    // Create analyzer for audio level detection
    const analyser = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(this.audioStream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    
    return (sum / dataArray.length) / 255; // Normalize to 0-1
  }

  // Check if earbuds are connected
  hasEarbudsConnected(): boolean {
    // Check for Bluetooth audio devices
    if ('bluetooth' in navigator) {
      // In real implementation, check for connected Bluetooth audio devices
      return true; // Assume earbuds are connected for demo
    }

    // Check for wired headphones
    if (this.audioStream) {
      const tracks = this.audioStream.getAudioTracks();
      if (tracks.length > 0) {
        const track = tracks[0];
        const settings = track.getSettings();
        
        // Check if using external audio device
        return settings.deviceId !== 'default';
      }
    }

    return false;
  }

  // Cleanup resources
  cleanup(): void {
    this.stopCapture();
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
  }

  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.onstart = () => {
      console.log('Audio capture started');
    };

    this.mediaRecorder.onstop = () => {
      console.log('Audio capture stopped');
      this.isRecording = false;
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      this.isRecording = false;
    };
  }

  // Simulate translation (in real app, this would call AI services)
  private async simulateTranslation(request: TranslationRequest): Promise<Omit<TranslationResult, 'processingTime'>> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100));

    // Mock translation results based on languages
    const mockTranslations: Record<string, Record<string, string>> = {
      'en': {
        'es': 'Hola, ¿cómo estás?',
        'ja': 'こんにちは、元気ですか？',
        'fr': 'Bonjour, comment allez-vous?'
      },
      'es': {
        'en': 'Hello, how are you?',
        'ja': 'こんにちは、元気ですか？',
        'fr': 'Bonjour, comment allez-vous?'
      },
      'ja': {
        'en': 'Hello, how are you?',
        'es': 'Hola, ¿cómo estás?',
        'fr': 'Bonjour, comment allez-vous?'
      }
    };

    const originalText = 'Hello, how are you?'; // Mock detected text
    const translatedText = mockTranslations[request.sourceLanguage]?.[request.targetLanguage] || originalText;

    return {
      originalText,
      translatedText,
      synthesizedAudio: new Uint8Array(2048), // Mock audio data
      confidence: 0.85 + Math.random() * 0.15 // 85-100% confidence
    };
  }
}

// Singleton instance
export const audioService = new VSFriendsAudioService();