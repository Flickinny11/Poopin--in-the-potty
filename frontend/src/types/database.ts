export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          subscription_tier: 'free' | 'basic' | 'pro' | 'business'
          voice_profile_trained: boolean
          usage_stats: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          subscription_tier?: 'free' | 'basic' | 'pro' | 'business'
          voice_profile_trained?: boolean
          usage_stats?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          subscription_tier?: 'free' | 'basic' | 'pro' | 'business'
          voice_profile_trained?: boolean
          usage_stats?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      calls: {
        Row: {
          id: string
          caller_id: string
          callee_id: string
          duration: number
          languages: Json
          status: 'active' | 'ended' | 'missed'
          recording_url: string | null
          quality_rating: number | null
          feedback: string | null
          created_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          caller_id: string
          callee_id: string
          duration?: number
          languages: Json
          status?: 'active' | 'ended' | 'missed'
          recording_url?: string | null
          quality_rating?: number | null
          feedback?: string | null
          created_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          caller_id?: string
          callee_id?: string
          duration?: number
          languages?: Json
          status?: 'active' | 'ended' | 'missed'
          recording_url?: string | null
          quality_rating?: number | null
          feedback?: string | null
          created_at?: string
          ended_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_caller_id_fkey"
            columns: ["caller_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_callee_id_fkey"
            columns: ["callee_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      voice_profiles: {
        Row: {
          id: string
          user_id: string
          language: string
          voice_data: Json
          is_trained: boolean
          training_progress: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          language: string
          voice_data: Json
          is_trained?: boolean
          training_progress?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          language?: string
          voice_data?: Json
          is_trained?: boolean
          training_progress?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          tier: 'free' | 'basic' | 'pro' | 'business'
          status: 'active' | 'canceled' | 'past_due' | 'unpaid'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          tier: 'free' | 'basic' | 'pro' | 'business'
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          tier?: 'free' | 'basic' | 'pro' | 'business'
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          call_id: string
          minutes_used: number
          feature_used: string
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          call_id: string
          minutes_used: number
          feature_used: string
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          call_id?: string
          minutes_used?: number
          feature_used?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_call_id_fkey"
            columns: ["call_id"]
            referencedRelation: "calls"
            referencedColumns: ["id"]
          }
        ]
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          contact_user_id: string
          favorite: boolean
          preferred_language_pair: Json
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_user_id: string
          favorite?: boolean
          preferred_language_pair?: Json
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_user_id?: string
          favorite?: boolean
          preferred_language_pair?: Json
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_contact_user_id_fkey"
            columns: ["contact_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          audio_video_preferences: Json
          privacy_settings: Json
          notification_settings: Json
          language_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          audio_video_preferences?: Json
          privacy_settings?: Json
          notification_settings?: Json
          language_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          audio_video_preferences?: Json
          privacy_settings?: Json
          notification_settings?: Json
          language_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: 'free' | 'basic' | 'pro' | 'business'
      call_status: 'active' | 'ended' | 'missed'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}