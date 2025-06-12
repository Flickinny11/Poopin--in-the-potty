/**
 * VS Presenter Types and Interfaces
 * Core types for the VidLiSync VS Presenter feature
 */

export type PresentationMode = 'in-person' | 'hybrid' | 'multi-user-hub';
export type VoiceMode = 'clone' | 'ai-voice';
export type AudioDevice = 'device' | 'bluetooth' | 'usb';
export type PresentationState = 'setup' | 'active' | 'ended';

export interface PresenterConfig {
  mode: PresentationMode;
  presenterLanguage: string;
  audienceLanguages: string[];
  voiceMode: VoiceMode;
  selectedAIVoice?: string;
  languageLock: boolean;
  maxParticipants: number;
  recordingEnabled: boolean;
}

export interface AudioRoutingConfig {
  presenter: {
    microphone: AudioDevice;
    earbuds: AudioDevice;
    monitor: 'original' | 'translated';
  };
  audience: {
    output: 'venue-speakers' | 'individual-devices';
  };
}

export interface VSParticipant {
  id: string;
  name: string;
  selectedLanguage: string;
  isPresenter: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  hasRaisedHand: boolean;
  joinedAt: Date;
  audio: boolean;
  video: boolean;
}

export interface PresentationRoom {
  id: string;
  code: string;
  joinLink: string;
  qrCode: string;
  config: PresenterConfig;
  createdAt: Date;
  isActive: boolean;
}

export interface LanguageDistribution {
  language: string;
  count: number;
  percentage: number;
}

export interface PresentationAnalytics {
  totalParticipants: number;
  activeParticipants: number;
  languageDistribution: LanguageDistribution[];
  averageEngagement: number;
  questionCount: number;
  translationAccuracy: number;
}

export interface CostEstimate {
  participantCount: number;
  languageCount: number;
  estimatedCostPerMinute: number;
  currentCost: number;
  projectedCost: number;
}

export interface VSPresenterSession {
  id: string;
  roomCode: string;
  config: PresenterConfig;
  participants: VSParticipant[];
  audioRouting: AudioRoutingConfig;
  startTime: Date;
  endTime?: Date;
  isRecording: boolean;
  recordingId?: string;
  analytics: PresentationAnalytics;
  costEstimate: CostEstimate;
}