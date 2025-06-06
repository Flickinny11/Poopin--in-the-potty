export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  subscription_tier: 'free' | 'basic' | 'pro' | 'business'
  voice_profile_trained: boolean
  usage_stats: {
    minutes_used: number
    calls_made: number
    languages_used: string[]
  }
  created_at: string
  updated_at: string
}

export interface Call {
  id: string
  caller_id: string
  callee_id: string
  duration: number
  languages: {
    caller: string
    callee: string
  }
  status: 'active' | 'ended' | 'missed'
  recording_url?: string
  quality_rating?: number
  feedback?: string
  created_at: string
  ended_at?: string
}

export interface VoiceProfile {
  id: string
  user_id: string
  language: string
  voice_data: any
  is_trained: boolean
  training_progress?: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  tier: 'free' | 'basic' | 'pro' | 'business'
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
}

export interface UsageLog {
  id: string
  user_id: string
  call_id: string
  minutes_used: number
  feature_used: string
  timestamp: string
}

export interface Contact {
  id: string
  user_id: string
  contact_user_id: string
  contact_user: User
  favorite: boolean
  preferred_language_pair: {
    my_language: string
    their_language: string
  }
  added_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  audio_video_preferences: {
    microphone_device_id?: string
    camera_device_id?: string
    speaker_device_id?: string
    auto_join_audio: boolean
    auto_join_video: boolean
    hd_video: boolean
    noise_cancellation: boolean
  }
  privacy_settings: {
    allow_recording: boolean
    share_usage_data: boolean
    marketing_emails: boolean
    show_online_status: boolean
  }
  notification_settings: {
    email_notifications: boolean
    push_notifications: boolean
    call_notifications: boolean
    message_notifications: boolean
  }
  language_settings: {
    interface_language: string
    default_translation_language: string
    auto_detect_language: boolean
  }
}

export interface Language {
  code: string
  name: string
  native_name: string
  supported_features: {
    speech_to_text: boolean
    text_to_speech: boolean
    translation: boolean
    voice_cloning: boolean
  }
}

export interface CallSession {
  id: string
  daily_room_url: string
  participants: CallParticipant[]
  translation_active: boolean
  recording_active: boolean
  created_at: string
}

export interface CallParticipant {
  id: string
  user_id: string
  user: User
  language: string
  voice_profile_id?: string
  joined_at: string
  left_at?: string
  status: 'joined' | 'left' | 'connecting'
}

export interface TranslationEvent {
  id: string
  call_id: string
  speaker_id: string
  original_text: string
  translated_text: string
  source_language: string
  target_language: string
  confidence_score: number
  processing_time: number
  timestamp: string
}

export interface PricingPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: {
    monthly_minutes: number | 'unlimited'
    max_participants: number
    supported_languages: number | 'all'
    hd_video: boolean
    recording: boolean
    priority_support: boolean
    api_access: boolean
    team_features: boolean
  }
  stripe_price_id: string
  popular?: boolean
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page?: number
    per_page?: number
    total?: number
    total_pages?: number
  }
}

export interface WebSocketMessage {
  type: 'audio_chunk' | 'translated_audio' | 'call_quality' | 'user_status' | 'translation_text' | 'error'
  data: any
  timestamp: string
  user_id?: string
  call_id?: string
}

export interface AudioChunk {
  audio_data: ArrayBuffer
  language: string
  user_id: string
  timestamp: number
}

export interface TranslatedAudio {
  audio_data: ArrayBuffer
  original_text: string
  translated_text: string
  source_language: string
  target_language: string
  user_id: string
  timestamp: number
}

export interface CallQuality {
  user_id: string
  video_quality: number
  audio_quality: number
  connection_quality: number
  latency: number
  packet_loss: number
  timestamp: number
}

export interface FormErrors {
  [key: string]: string[]
}