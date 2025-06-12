/**
 * Voice Profile Training Component
 * Guides users through 10-phrase voice training for voice cloning
 */
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Volume2,
  Settings,
  ArrowLeft,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

interface Recording {
  blob: Blob;
  url: string;
  duration: number;
  quality: number;
}

interface VoiceProfileSetupProps {
  onComplete?: (profileId: string) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const VoiceProfileSetup: React.FC<VoiceProfileSetupProps> = ({
  onComplete,
  onCancel,
  isModal = false
}) => {
  const { updateSetting, profile } = useSettingsStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingPermission, setRecordingPermission] = useState<boolean | null>(null);
  const [currentRecordingTime, setCurrentRecordingTime] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Training phrases - exactly 10 as specified
  const trainingPhrases = [
    "Hello, my name is John, and I'm excited to use VidLiSync.",
    "The weather today is beautiful, perfect for a video call.",
    "I enjoy learning new languages; communication brings people together.",
    "Can you help me with directions? I seem to have lost my way.",
    "Thank you very much for your help, I really appreciate your time.",
    "One, two, three, four, five - counting helps test vocal range.",
    "How are you doing today? I hope you're having a wonderful time.",
    "I'd like to order some coffee, please make it a large cappuccino.",
    "This translation app is amazing, it helps me connect with friends worldwide.",
    "Goodbye, see you tomorrow for another great conversation."
  ];

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      });
      
      audioStreamRef.current = stream;
      setRecordingPermission(true);
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
    } catch (error) {
      console.error('Failed to get microphone permission:', error);
      setRecordingPermission(false);
    }
  }, []);

  // Initialize component
  useEffect(() => {
    requestPermission();
    
    return () => {
      // Cleanup
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      const currentAnimationFrame = animationFrameRef.current;
      if (currentAnimationFrame) {
        cancelAnimationFrame(currentAnimationFrame);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [requestPermission]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!audioStreamRef.current || !recordingPermission) {
      await requestPermission();
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(audioStreamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        const duration = currentRecordingTime;
        const quality = Math.random() * 0.2 + 0.8; // Simulate quality score 0.8-1.0
        
        const newRecording: Recording = {
          blob,
          url,
          duration,
          quality
        };
        
        setRecordings(prev => {
          const updated = [...prev];
          updated[currentStep] = newRecording;
          return updated;
        });
        
        setCurrentRecordingTime(0);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      const startTime = Date.now();
      recordingTimerRef.current = setInterval(() => {
        setCurrentRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [recordingPermission, requestPermission, currentStep, currentRecordingTime]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording]);

  // Play recording
  const playRecording = useCallback((index: number) => {
    const recording = recordings[index];
    if (!recording) return;

    const audio = new Audio(recording.url);
    audio.onended = () => {
      setIsPlaying(false);
      setPlayingIndex(-1);
    };
    
    setIsPlaying(true);
    setPlayingIndex(index);
    audio.play();
  }, [recordings]);

  // Delete recording
  const deleteRecording = useCallback((index: number) => {
    setRecordings(prev => {
      const updated = [...prev];
      if (updated[index]) {
        URL.revokeObjectURL(updated[index].url);
        delete updated[index];
      }
      return updated;
    });
  }, []);

  // Navigate steps
  const nextStep = useCallback(() => {
    if (currentStep < trainingPhrases.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, trainingPhrases.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Complete voice profile training
  const completeTraining = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Convert recordings to base64 for API
      const audioSamples = await Promise.all(
        recordings.map(recording => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(recording.blob);
          });
        })
      );
      
      // TODO: Call API to train voice profile
      // const response = await fetch('/api/voice-profile/train', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: 'Default Voice Profile',
      //     language: profile.language,
      //     audio_samples: audioSamples
      //   })
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const profileId = `profile_${Date.now()}`;
      
      // Update settings
      updateSetting('profile', 'voiceProfileTrained', true);
      updateSetting('profile', 'voiceProfileId', profileId);
      
      // Cleanup URLs
      recordings.forEach(recording => {
        URL.revokeObjectURL(recording.url);
      });
      
      if (onComplete) {
        onComplete(profileId);
      }
      
    } catch (error) {
      console.error('Failed to complete voice training:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [recordings, updateSetting, onComplete]);

  // Permission denied view
  if (recordingPermission === false) {
    return (
      <div className={`${isModal ? 'p-6' : 'min-h-screen'} bg-gray-50 dark:bg-gray-900 flex items-center justify-center`}>
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MicOff className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Microphone Permission Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            VidLiSync needs access to your microphone to record voice samples for training. 
            Please allow microphone access and try again.
          </p>
          <button
            onClick={requestPermission}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request Permission
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="ml-4 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading view
  if (recordingPermission === null) {
    return (
      <div className={`${isModal ? 'p-6' : 'min-h-screen'} bg-gray-50 dark:bg-gray-900 flex items-center justify-center`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Initializing voice training...
          </p>
        </div>
      </div>
    );
  }

  const completedRecordings = recordings.filter(r => r).length;
  const progressPercentage = (completedRecordings / trainingPhrases.length) * 100;
  const currentRecording = recordings[currentStep];
  const canComplete = completedRecordings === trainingPhrases.length;

  return (
    <div className={`${isModal ? 'p-6' : 'min-h-screen bg-gray-50 dark:bg-gray-900 py-8'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Voice Profile Training
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Record 10 short phrases to train your voice profile. This helps preserve 
            your unique voice characteristics during translation.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {completedRecordings}/{trainingPhrases.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recording Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Phrase {currentStep + 1} of {trainingPhrases.length}
              </h2>
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Current Phrase */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <p className="text-blue-900 dark:text-blue-100 font-medium text-lg leading-relaxed">
                &ldquo;{trainingPhrases[currentStep]}&rdquo;
              </p>
            </div>

            {/* Recording Controls */}
            <div className="text-center mb-6">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                  disabled={isProcessing}
                >
                  <Mic className="w-8 h-8" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-20 h-20 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg animate-pulse"
                >
                  <div className="w-6 h-6 bg-white rounded-sm" />
                </button>
              )}
              
              {isRecording && (
                <div className="mt-4">
                  <div className="text-2xl font-mono text-red-600 dark:text-red-400">
                    {Math.floor(currentRecordingTime / 60)}:{(currentRecordingTime % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-500">Recording...</div>
                </div>
              )}
            </div>

            {/* Current Recording Playback */}
            {currentRecording && (
              <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => playRecording(currentStep)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={isPlaying && playingIndex === currentStep}
                    >
                      {isPlaying && playingIndex === currentStep ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Recording {currentStep + 1}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentRecording.duration}s • Quality: {(currentRecording.quality * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRecording(currentStep)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete recording"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>
              
              <span className="text-sm text-gray-500">
                {currentStep + 1} / {trainingPhrases.length}
              </span>
              
              <button
                onClick={nextStep}
                disabled={currentStep === trainingPhrases.length - 1}
                className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          {/* Overview Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Training Overview
            </h2>

            {/* Recordings List */}
            <div className="space-y-3 mb-6">
              {trainingPhrases.map((phrase, index) => {
                const recording = recordings[index];
                const isCompleted = !!recording;
                const isCurrent = index === currentStep;
                
                return (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      isCurrent 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : isCompleted
                        ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : isCurrent
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {phrase.substring(0, 40)}...
                          </div>
                          {recording && (
                            <div className="text-xs text-gray-500">
                              {recording.duration}s • {(recording.quality * 100).toFixed(0)}% quality
                            </div>
                          )}
                        </div>
                      </div>
                      {recording && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playRecording(index);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Complete Training Button */}
            <button
              onClick={completeTraining}
              disabled={!canComplete || isProcessing}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing Voice Profile...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Complete Training ({completedRecordings}/{trainingPhrases.length})
                </>
              )}
            </button>

            {/* Cancel Button */}
            {onCancel && (
              <button
                onClick={onCancel}
                className="w-full mt-3 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceProfileSetup;