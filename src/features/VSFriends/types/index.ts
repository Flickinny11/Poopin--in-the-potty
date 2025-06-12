/**
 * TypeScript definitions for VS Friends feature
 */

export interface VSFriend {
  id: string;
  name: string;
  deviceName: string;
  language: string;
  selectedLanguage: string;
  isSpeaking: boolean;
  isConnected: boolean;
  joinedAt: Date;
  peerID: string;
  initials: string;
  hasRaisedHand?: boolean;
}

export interface VSFriendsConfig {
  maxParticipants: number;
  allowLanguageSwitch: boolean;
  useVoiceCloning: boolean;
  autoEndTimeout: number; // minutes
  backgroundMode: boolean;
}

export interface VSFriendsSession {
  id: string;
  initiatorId: string;
  participants: VSFriend[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  conversationId: string;
}

export interface ConnectionInfo {
  deviceName: string;
  language: string;
  userId: string;
  sessionId: string;
}

export interface AudioStream {
  participantId: string;
  audioData: Uint8Array;
  timestamp: number;
  language: string;
}

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

export interface VSFriendsBilling {
  initiatorId: string;
  conversationId: string;
  participants: string[];
  startTime: Date;
  endTime?: Date;
  totalMinutes: number;
  languagePairs: string[];
  cost: number;
}

export type ConversationState = 
  | 'idle' 
  | 'discovering' 
  | 'connecting' 
  | 'active' 
  | 'ended';

export type EarbudControl = 
  | 'playPause' 
  | 'next' 
  | 'volumeUp' 
  | 'volumeDown';

export interface VSFriendsLimits {
  free: {
    minutesPerMonth: number;
    maxParticipants: number;
  };
  basic: {
    minutesPerMonth: number;
    maxParticipants: number;
  };
  pro: {
    minutesPerMonth: number;
    maxParticipants: number;
  };
  business: {
    minutesPerMonth: number;
    maxParticipants: number;
  };
}