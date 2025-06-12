/**
 * Integration hook for Teams/Zoom translation
 * Extends existing translation capabilities with platform-specific features
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslationWebSocket } from './useTranslationWebSocket';
import { createIntegrationBridge, IntegrationBridge, AudioBridgeConfig, VideoBridgeConfig, supportsIntegration } from '@/lib/integration-bridge';
import { getPlatformInfo } from '@/lib/platform-detection';
import { useTranslationStore } from '@/stores/translationStore';

interface IntegrationState {
  isIntegrationMode: boolean;
  platform: string;
  bridgeReady: boolean;
  audioCapturing: boolean;
  videoCapturing: boolean;
  error: string | null;
}

export const useIntegrationTranslation = () => {
  const bridgeRef = useRef<IntegrationBridge | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  
  // Use existing translation WebSocket hook
  const {
    isConnected,
    connect,
    disconnect,
    startTranslation: startWebSocketTranslation,
    stopTranslation: stopWebSocketTranslation,
    sendAudioChunk,
  } = useTranslationWebSocket();
  
  // Get translation store state
  const {
    isTranslationActive,
    sourceLanguage,
    targetLanguage,
    voiceProfileId,
    translationHistory,
  } = useTranslationStore();
  
  // Integration state
  const [integrationState, setIntegrationState] = useState<IntegrationState>({
    isIntegrationMode: false,
    platform: 'web',
    bridgeReady: false,
    audioCapturing: false,
    videoCapturing: false,
    error: null,
  });
  
  // Audio processing for translation
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Initialize integration bridge
  const initializeBridge = useCallback(async () => {
    try {
      const platformInfo = getPlatformInfo();
      
      if (!supportsIntegration()) {
        throw new Error('Platform does not support integration');
      }
      
      const bridge = createIntegrationBridge();
      await bridge.initialize();
      
      bridgeRef.current = bridge;
      
      setIntegrationState(prev => ({
        ...prev,
        isIntegrationMode: platformInfo.platform !== 'web',
        platform: platformInfo.platform,
        bridgeReady: true,
        error: null,
      }));
      
    } catch (error) {
      console.error('Failed to initialize integration bridge:', error);
      setIntegrationState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Bridge initialization failed',
        bridgeReady: false,
      }));
    }
  }, []);
  
  // Start audio capture for translation
  const startAudioCapture = useCallback(async () => {
    if (!bridgeRef.current || !integrationState.bridgeReady) {
      throw new Error('Integration bridge not ready');
    }
    
    try {
      const audioConfig: AudioBridgeConfig = {
        sampleRate: 16000, // Optimized for Whisper
        channels: 1,
        bufferSize: 4096,
      };
      
      const audioStream = await bridgeRef.current.startAudioCapture(audioConfig);
      audioStreamRef.current = audioStream;
      
      // Set up audio processing for translation
      const audioContext = new AudioContext({ sampleRate: audioConfig.sampleRate });
      const source = audioContext.createMediaStreamSource(audioStream);
      const processor = audioContext.createScriptProcessor(audioConfig.bufferSize, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (isTranslationActive) {
          const inputBuffer = event.inputBuffer.getChannelData(0);
          const audioData = new Float32Array(inputBuffer);
          
          // Convert to ArrayBuffer and send to translation service
          const buffer = new ArrayBuffer(audioData.length * 4);
          const view = new Float32Array(buffer);
          view.set(audioData);
          
          sendAudioChunk(buffer);
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      audioProcessorRef.current = processor;
      
      setIntegrationState(prev => ({
        ...prev,
        audioCapturing: true,
        error: null,
      }));
      
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      setIntegrationState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Audio capture failed',
        audioCapturing: false,
      }));
    }
  }, [integrationState.bridgeReady, isTranslationActive, sendAudioChunk]);
  
  // Start video capture for lip sync
  const startVideoCapture = useCallback(async () => {
    if (!bridgeRef.current || !integrationState.bridgeReady) {
      throw new Error('Integration bridge not ready');
    }
    
    try {
      const videoConfig: VideoBridgeConfig = {
        width: 640,
        height: 480,
        frameRate: 30,
      };
      
      const videoStream = await bridgeRef.current.startVideoCapture(videoConfig);
      videoStreamRef.current = videoStream;
      
      setIntegrationState(prev => ({
        ...prev,
        videoCapturing: true,
        error: null,
      }));
      
    } catch (error) {
      console.error('Failed to start video capture:', error);
      setIntegrationState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Video capture failed',
        videoCapturing: false,
      }));
    }
  }, [integrationState.bridgeReady]);
  
  // Start integration translation
  const startIntegrationTranslation = useCallback(async () => {
    try {
      // First connect to WebSocket service
      if (!isConnected) {
        await connect();
      }
      
      // Start WebSocket translation
      await startWebSocketTranslation(sourceLanguage, targetLanguage, voiceProfileId || undefined);
      
      // Start platform-specific audio/video capture
      if (integrationState.bridgeReady) {
        await startAudioCapture();
        // Video capture is optional for now
        // await startVideoCapture();
      }
      
    } catch (error) {
      console.error('Failed to start integration translation:', error);
      setIntegrationState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Translation start failed',
      }));
    }
  }, [
    isConnected,
    connect,
    startWebSocketTranslation,
    sourceLanguage,
    targetLanguage,
    voiceProfileId,
    integrationState.bridgeReady,
    startAudioCapture,
  ]);
  
  // Stop integration translation
  const stopIntegrationTranslation = useCallback(async () => {
    try {
      // Stop WebSocket translation
      stopWebSocketTranslation();
      
      // Clean up audio processing
      if (audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
        audioProcessorRef.current = null;
      }
      
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Stop media streams
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
      }
      
      setIntegrationState(prev => ({
        ...prev,
        audioCapturing: false,
        videoCapturing: false,
        error: null,
      }));
      
    } catch (error) {
      console.error('Failed to stop integration translation:', error);
      setIntegrationState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Translation stop failed',
      }));
    }
  }, [stopWebSocketTranslation]);
  
  // Handle translated audio output
  useEffect(() => {
    if (!bridgeRef.current || !integrationState.isIntegrationMode) return;
    
    // Listen for new translation results
    const latestTranslation = translationHistory[translationHistory.length - 1];
    if (latestTranslation?.synthesizedAudio) {
      // Convert base64 to ArrayBuffer
      try {
        const audioData = atob(latestTranslation.synthesizedAudio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < audioData.length; i++) {
          uint8Array[i] = audioData.charCodeAt(i);
        }
        
        // Replace audio through integration bridge
        bridgeRef.current.replaceAudio(arrayBuffer);
        
      } catch (error) {
        console.error('Failed to process translated audio:', error);
      }
    }
  }, [translationHistory, integrationState.isIntegrationMode]);
  
  // Initialize on mount
  useEffect(() => {
    initializeBridge();
    
    return () => {
      // Cleanup on unmount
      if (bridgeRef.current) {
        bridgeRef.current.cleanup();
      }
    };
  }, [initializeBridge]);
  
  return {
    // Integration state
    isIntegrationMode: integrationState.isIntegrationMode,
    platform: integrationState.platform,
    bridgeReady: integrationState.bridgeReady,
    audioCapturing: integrationState.audioCapturing,
    videoCapturing: integrationState.videoCapturing,
    integrationError: integrationState.error,
    
    // Translation state (from existing hook)
    isConnected,
    isTranslationActive,
    
    // Actions
    startIntegrationTranslation,
    stopIntegrationTranslation,
    initializeBridge,
    
    // Media streams (for UI display)
    audioStream: audioStreamRef.current,
    videoStream: videoStreamRef.current,
  };
};