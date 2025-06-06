import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string, metadata?: any) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password
    })
  },

  signInWithGoogle: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  },

  signInWithApple: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  },

  signOut: async () => {
    return await supabase.auth.signOut()
  },

  resetPassword: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
  },

  updatePassword: async (password: string) => {
    return await supabase.auth.updateUser({ password })
  },

  getSession: async () => {
    return await supabase.auth.getSession()
  },

  getUser: async () => {
    return await supabase.auth.getUser()
  }
}

// Database helper functions
export const db = {
  // Users
  getUser: async (userId: string) => {
    return await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
  },

  updateUser: async (userId: string, updates: any) => {
    return await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
  },

  // Calls
  getCalls: async (userId: string, limit = 20) => {
    return await supabase
      .from('calls')
      .select(`
        *,
        caller:users!caller_id(*),
        callee:users!callee_id(*)
      `)
      .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit)
  },

  createCall: async (callData: any) => {
    return await supabase
      .from('calls')
      .insert(callData)
      .select()
      .single()
  },

  updateCall: async (callId: string, updates: any) => {
    return await supabase
      .from('calls')
      .update(updates)
      .eq('id', callId)
      .select()
      .single()
  },

  // Contacts
  getContacts: async (userId: string) => {
    return await supabase
      .from('contacts')
      .select(`
        *,
        contact_user:users!contact_user_id(*)
      `)
      .eq('user_id', userId)
      .order('favorite', { ascending: false })
      .order('added_at', { ascending: false })
  },

  addContact: async (userId: string, contactUserId: string, languagePair?: any) => {
    return await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        contact_user_id: contactUserId,
        preferred_language_pair: languagePair,
        favorite: false
      })
      .select()
      .single()
  },

  removeContact: async (userId: string, contactUserId: string) => {
    return await supabase
      .from('contacts')
      .delete()
      .eq('user_id', userId)
      .eq('contact_user_id', contactUserId)
  },

  toggleFavoriteContact: async (contactId: string, favorite: boolean) => {
    return await supabase
      .from('contacts')
      .update({ favorite })
      .eq('id', contactId)
      .select()
      .single()
  },

  // Voice Profiles
  getVoiceProfiles: async (userId: string) => {
    return await supabase
      .from('voice_profiles')
      .select('*')
      .eq('user_id', userId)
  },

  createVoiceProfile: async (voiceProfileData: any) => {
    return await supabase
      .from('voice_profiles')
      .insert(voiceProfileData)
      .select()
      .single()
  },

  updateVoiceProfile: async (profileId: string, updates: any) => {
    return await supabase
      .from('voice_profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single()
  },

  // Subscriptions
  getSubscription: async (userId: string) => {
    return await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
  },

  createSubscription: async (subscriptionData: any) => {
    return await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()
  },

  updateSubscription: async (userId: string, updates: any) => {
    return await supabase
      .from('subscriptions')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
  },

  // Usage Logs
  getUsageLogs: async (userId: string, limit = 100) => {
    return await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)
  },

  createUsageLog: async (usageData: any) => {
    return await supabase
      .from('usage_logs')
      .insert(usageData)
      .select()
      .single()
  },

  // User Settings
  getUserSettings: async (userId: string) => {
    return await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
  },

  updateUserSettings: async (userId: string, settings: any) => {
    return await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings
      })
      .select()
      .single()
  }
}

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to call updates
  subscribeToCall: (callId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`call:${callId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calls',
        filter: `id=eq.${callId}`
      }, callback)
      .subscribe()
  },

  // Subscribe to user's calls
  subscribeToUserCalls: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`user_calls:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calls',
        filter: `caller_id=eq.${userId}`
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calls',
        filter: `callee_id=eq.${userId}`
      }, callback)
      .subscribe()
  },

  // Subscribe to user status
  subscribeToUserStatus: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`user_status:${userId}`)
      .on('presence', { event: 'sync' }, callback)
      .on('presence', { event: 'join' }, callback)
      .on('presence', { event: 'leave' }, callback)
      .subscribe()
  }
}