/**
 * WebSocket hook for real-time translation streaming
 * Connects to backend translation WebSocket endpoint
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslationStore } from '@/stores/translationStore';
import { useAuthStore } from '@/stores/authStore';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface AudioChunkData {
  type: 'audio_chunk';
  audio_data: string; // base64 encoded
  session_id: string;
}

interface TranslationResultMessage {
  type: 'translation_result';
  session_id: string;
  source_text: string;
  translated_text: string;
  synthesized_audio: string; // base64 encoded
  lip_sync_video?: string; // base64 encoded
  quality_metrics: {
    latency_ms: number;
    quality_score: number;
    accuracy: number;
    processing_time_ms: number;
  };
  performance_metrics: {
    total_latency_ms: number;
    whisper_latency_ms: number;
    translation_latency_ms: number;
    voice_synthesis_latency_ms: number;
  };
  timestamp: number;
}

export const useTranslationWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  
  const { user } = useAuthStore();
  const {
    isConnected,
    isConnecting,
    sessionId,
    isTranslationActive,
    sourceLanguage,
    targetLanguage,
    voiceProfileId,
    addTranslationResult,
    connect: setConnected,
    disconnect: setDisconnected,
  } = useTranslationStore();

  // Local state for reconnection attempts
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Get WebSocket URL from environment
  const getWebSocketUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return apiUrl.replace(/^http/, 'ws') + '/ws/translation';
  };

  // Send WebSocket message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Play translated audio
  const playTranslatedAudio = useCallback((audioBase64: string) => {
    try {
      const audioData = atob(audioBase64);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        uint8Array[i] = audioData.charCodeAt(i);
      }
      
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      // Apply volume setting
      const { translationVolume } = useTranslationStore.getState();
      audio.volume = translationVolume;
      
      audio.play().catch(error => {
        console.error('Error playing translated audio:', error);
      });
      
      // Clean up object URL after audio ends
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
    } catch (error) {
      console.error('Error processing translated audio:', error);
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      switch (message.type) {
        case 'authenticated':
          console.log('Translation WebSocket authenticated');
          break;
          
        case 'stream_started':
          console.log('Translation stream started:', message.session_id);
          break;
          
        case 'translation_result':
          const result = message as TranslationResultMessage;
          
          // Add to translation store
          addTranslationResult({
            sessionId: result.session_id,
            sourceText: result.source_text,
            translatedText: result.translated_text,
            synthesizedAudio: result.synthesized_audio,
            lipSyncVideo: result.lip_sync_video,
            qualityMetrics: result.quality_metrics,
            timestamp: result.timestamp,
          });
          
          // Play synthesized audio if available
          if (result.synthesized_audio) {
            playTranslatedAudio(result.synthesized_audio);
          }
          break;
          
        case 'error':
          console.error('Translation WebSocket error:', message.error);
          useTranslationStore.setState({ 
            lastError: message.error,
            connectionError: message.error 
          });
          break;
          
        case 'pong':
          // Handle ping/pong for connection keepalive
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [addTranslationResult, playTranslatedAudio]);

  // Schedule reconnection with exponential backoff  
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30 seconds
    console.log(`Scheduling reconnection in ${delay}ms (attempt ${reconnectAttempts + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      // Use async function to avoid circular dependency
      (async () => {
        try {
          if (!user?.id) return;
          // Reconnect logic here without depending on connect function
          const ws = new WebSocket(getWebSocketUrl());
          wsRef.current = ws;
          // Set up handlers...
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      })();
    }, delay);
  }, [reconnectAttempts, user]);

  // Connect to WebSocket
  const connect: () => Promise<void> = useCallback(async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Translation WebSocket connected');
        
        // Authenticate with the server
        sendMessage({
          type: 'authenticate',
          user_id: user.id,
          token: 'demo_token', // In production, get from Supabase session
        });
        
        setConnected(user.id, 'demo_token');
      };
      
      ws.onmessage = handleMessage;
      
      ws.onclose = (event) => {
        console.log('Translation WebSocket closed:', event.code, event.reason);
        setDisconnected();
        
        // Attempt reconnection if not a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          scheduleReconnect();
        }
      };
      
      ws.onerror = (error) => {
        console.error('Translation WebSocket error:', error);
        useTranslationStore.setState({
          connectionError: 'WebSocket connection failed'
        });
      };
      
      wsRef.current = ws;
      
    } catch (error) {
      console.error('Failed to connect to translation WebSocket:', error);
      throw error;
    }
  }, [user, sendMessage, handleMessage, setConnected, setDisconnected, scheduleReconnect]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Normal closure');
      wsRef.current = null;
    }
    
    setDisconnected();
  }, [setDisconnected]);

  // Start translation stream
  const startTranslation = useCallback(async (
    sourceLanguage: string,
    targetLanguage: string,
    voiceProfileId?: string
  ) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    sendMessage({
      type: 'start_stream',
      source_language: sourceLanguage,
      target_language: targetLanguage,
      voice_profile_id: voiceProfileId,
    });
  }, [sendMessage]);

  // Stop translation stream
  const stopTranslation = useCallback(() => {
    if (sessionId && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'end_stream',
        session_id: sessionId,
      });
    }
  }, [sessionId, sendMessage]);

  // Send audio chunk for translation
  const sendAudioChunk = useCallback((audioData: ArrayBuffer) => {
    if (!sessionId || !isTranslationActive) return;
    
    try {
      // Convert ArrayBuffer to base64
      const uint8Array = new Uint8Array(audioData);
      const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
      const base64Data = btoa(binaryString);
      
      sendMessage({
        type: 'audio_chunk',
        audio_data: base64Data,
        session_id: sessionId,
      });
      
    } catch (error) {
      console.error('Error sending audio chunk:', error);
    }
  }, [sessionId, isTranslationActive, sendMessage]);

  // Process audio queue
  const processAudioQueue = useCallback(() => {
    if (isProcessingRef.current || audioQueueRef.current.length === 0) return;
    
    isProcessingRef.current = true;
    
    const audioData = audioQueueRef.current.shift();
    if (audioData && sessionId && isTranslationActive) {
      sendMessage({
        type: 'audio_chunk',
        audio_data: audioData,
        session_id: sessionId,
      });
    }
    
    isProcessingRef.current = false;
    
    // Process next chunk if available
    if (audioQueueRef.current.length > 0) {
      setTimeout(processAudioQueue, 50); // 50ms delay between chunks
    }
  }, [sessionId, isTranslationActive, sendMessage]);

  // Send keepalive ping
  const sendPing = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendMessage({ type: 'ping', timestamp: Date.now() });
    }
  }, [sendMessage]);

  // Set up periodic ping for keepalive
  useEffect(() => {
    if (isConnected) {
      const pingInterval = setInterval(sendPing, 30000); // 30 seconds
      return () => clearInterval(pingInterval);
    }
  }, [isConnected, sendPing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    startTranslation,
    stopTranslation,
    sendAudioChunk,
    connectionError: useTranslationStore(state => state.connectionError),
  };
};