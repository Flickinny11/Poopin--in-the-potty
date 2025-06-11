/**
 * Notification state management with Zustand
 * Handles in-app notifications for translation and call events
 */
import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'call' | 'translation';
  title: string;
  message: string;
  actions?: NotificationAction[];
  duration?: number; // Auto-dismiss after duration (ms), 0 = no auto-dismiss
  timestamp: number;
  isRead: boolean;
  persistent?: boolean; // Don't auto-dismiss
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  sound?: boolean;
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  callInvitations: boolean;
  translationAlerts: boolean;
  usageLimits: boolean;
  systemMaintenance: boolean;
  doNotDisturbStart?: string; // HH:MM format
  doNotDisturbEnd?: string; // HH:MM format
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isDoNotDisturb: boolean;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  setDoNotDisturb: (enabled: boolean) => void;
  
  // Notification creators
  showCallInvitation: (callerName: string, roomId: string, onAccept: () => void, onDecline: () => void) => void;
  showMissedCall: (callerName: string, timestamp: Date) => void;
  showTranslationError: (error: string, onRetry?: () => void) => void;
  showUsageLimit: (percentage: number, planName: string, onUpgrade?: () => void) => void;
  showPaymentFailure: (reason: string, onUpdate?: () => void) => void;
  showSystemMaintenance: (startTime: Date, duration: string) => void;
  showTranslationQualityAlert: (quality: string, suggestion: string) => void;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  sound: true,
  callInvitations: true,
  translationAlerts: true,
  usageLimits: true,
  systemMaintenance: true,
  emailNotifications: true,
  pushNotifications: true,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: DEFAULT_PREFERENCES,
  isDoNotDisturb: false,

  // Add notification
  addNotification: (notification) => {
    const { preferences, isDoNotDisturb } = get();
    
    // Check if notifications are enabled
    if (!preferences.enabled) return '';
    
    // Check do not disturb mode (except for urgent notifications)
    if (isDoNotDisturb && notification.priority !== 'urgent') return '';
    
    // Check specific notification type preferences
    if (notification.type === 'call' && !preferences.callInvitations) return '';
    if (notification.type === 'translation' && !preferences.translationAlerts) return '';
    
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      isRead: false,
      duration: notification.duration ?? (notification.persistent ? 0 : 5000),
      priority: notification.priority ?? 'normal',
      sound: notification.sound ?? preferences.sound,
    };

    set(state => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Play notification sound if enabled
    if (newNotification.sound && preferences.sound) {
      playNotificationSound(newNotification.type);
    }

    // Auto-dismiss after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  // Remove notification
  removeNotification: (id) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.isRead;
      
      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    });
  },

  // Mark as read
  markAsRead: (id) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.isRead;
      
      return {
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    });
  },

  // Mark all as read
  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  // Clear all notifications
  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  // Update preferences
  updatePreferences: (preferences) => {
    set(state => ({
      preferences: { ...state.preferences, ...preferences },
    }));
  },

  // Set do not disturb
  setDoNotDisturb: (enabled) => {
    set({ isDoNotDisturb: enabled });
  },

  // Show call invitation
  showCallInvitation: (callerName, roomId, onAccept, onDecline) => {
    get().addNotification({
      type: 'call',
      title: 'Incoming Call',
      message: `${callerName} is calling you`,
      priority: 'urgent',
      persistent: true,
      sound: true,
      actions: [
        {
          label: 'Accept',
          action: onAccept,
          style: 'primary',
        },
        {
          label: 'Decline',
          action: onDecline,
          style: 'danger',
        },
      ],
      metadata: { roomId, callerName },
    });
  },

  // Show missed call
  showMissedCall: (callerName, timestamp) => {
    get().addNotification({
      type: 'call',
      title: 'Missed Call',
      message: `Missed call from ${callerName}`,
      priority: 'normal',
      duration: 10000,
      metadata: { callerName, timestamp },
    });
  },

  // Show translation error
  showTranslationError: (error, onRetry) => {
    const actions: NotificationAction[] = [];
    if (onRetry) {
      actions.push({
        label: 'Retry',
        action: onRetry,
        style: 'primary',
      });
    }

    get().addNotification({
      type: 'translation',
      title: 'Translation Error',
      message: error,
      priority: 'high',
      duration: 0, // Don't auto-dismiss
      actions,
    });
  },

  // Show usage limit warning
  showUsageLimit: (percentage, planName, onUpgrade) => {
    const actions: NotificationAction[] = [];
    if (onUpgrade) {
      actions.push({
        label: 'Upgrade Plan',
        action: onUpgrade,
        style: 'primary',
      });
    }

    get().addNotification({
      type: 'warning',
      title: 'Usage Limit Warning',
      message: `You've used ${percentage}% of your ${planName} plan limit`,
      priority: percentage >= 90 ? 'high' : 'normal',
      duration: 0,
      actions,
    });
  },

  // Show payment failure
  showPaymentFailure: (reason, onUpdate) => {
    const actions: NotificationAction[] = [];
    if (onUpdate) {
      actions.push({
        label: 'Update Payment',
        action: onUpdate,
        style: 'primary',
      });
    }

    get().addNotification({
      type: 'error',
      title: 'Payment Failed',
      message: reason,
      priority: 'high',
      duration: 0,
      actions,
    });
  },

  // Show system maintenance
  showSystemMaintenance: (startTime, duration) => {
    get().addNotification({
      type: 'info',
      title: 'Scheduled Maintenance',
      message: `System maintenance scheduled for ${startTime.toLocaleString()}. Duration: ${duration}`,
      priority: 'normal',
      duration: 0,
    });
  },

  // Show translation quality alert
  showTranslationQualityAlert: (quality, suggestion) => {
    get().addNotification({
      type: 'translation',
      title: 'Translation Quality Alert',
      message: `Translation quality is ${quality}. ${suggestion}`,
      priority: 'normal',
      duration: 8000,
    });
  },
}));

// Utility function to play notification sounds
function playNotificationSound(type: Notification['type']) {
  if (typeof window === 'undefined') return;
  
  try {
    // Create audio context for custom sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Different sounds for different notification types
    const frequencies: Record<string, number[]> = {
      call: [800, 600], // Ringing tone
      translation: [400, 500], // Soft notification
      error: [200, 150], // Error tone
      warning: [300, 250], // Warning tone
      success: [500, 700], // Success tone
      info: [400, 400], // Neutral tone
    };
    
    const freq = frequencies[type] || frequencies.info;
    
    // Create oscillator for notification sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
    oscillator.frequency.setValueAtTime(freq[1], audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
  } catch (error) {
    // Fallback to system notification sound
    console.log('Notification sound failed, using fallback');
  }
}

// Auto-update do not disturb based on schedule
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { preferences, setDoNotDisturb } = useNotificationStore.getState();
    
    if (preferences.doNotDisturbStart && preferences.doNotDisturbEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const isInDoNotDisturbPeriod = 
        currentTime >= preferences.doNotDisturbStart &&
        currentTime <= preferences.doNotDisturbEnd;
      
      setDoNotDisturb(isInDoNotDisturbPeriod);
    }
  }, 60000); // Check every minute
}