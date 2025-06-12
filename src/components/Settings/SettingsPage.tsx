/**
 * Comprehensive Settings Page Component
 * Provides access to all VidLiSync settings with search, navigation, and management
 */
'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronRight, 
  User, 
  Camera, 
  Languages, 
  Sparkles, 
  Bell, 
  Shield, 
  Palette, 
  Settings as SettingsIcon,
  Download,
  Check,
  X,
  RotateCcw,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

interface SettingSectionConfig {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface SettingItemConfig {
  id: string;
  title: string;
  description?: string;
  type: 'toggle' | 'select' | 'slider' | 'input' | 'navigation' | 'button';
  section: string;
  key: string;
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  badge?: string;
  onClick?: () => void;
}

const SettingsPage: React.FC = () => {
  const {
    profile,
    audioVideo,
    translation,
    vsEnvironment,
    vsPresenter,
    vsFriends,
    notifications,
    privacy,
    appearance,
    advanced,
    modelStatus,
    activeSection,
    searchQuery,
    isLoading,
    updateSetting,
    resetSection,
    resetAllSettings,
    searchSettings,
    setActiveSection,
    downloadModel,
    deleteModel,
    verifyModel,
  } = useSettingsStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSectionId, setResetSectionId] = useState<string | null>(null);

  // Settings sections configuration
  const settingsSections: SettingSectionConfig[] = [
    {
      id: 'account',
      title: 'Account & Profile',
      icon: User,
      description: 'Profile settings, language preferences, and subscription'
    },
    {
      id: 'audioVideo',
      title: 'Audio & Video',
      icon: Camera,
      description: 'Camera, microphone, and audio processing settings'
    },
    {
      id: 'translation',
      title: 'Translation',
      icon: Languages,
      description: 'Language settings, voice cloning, and offline models'
    },
    {
      id: 'vsFeatures',
      title: 'VS Features',
      icon: Sparkles,
      description: 'VS Environment, Presenter, and Friends settings'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Notification preferences and quiet hours'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      description: 'Data collection, analytics, and security settings'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: Palette,
      description: 'Theme, text size, and accessibility options'
    },
    {
      id: 'advanced',
      title: 'Advanced',
      icon: SettingsIcon,
      description: 'Developer options, cache, and experimental features'
    },
    {
      id: 'models',
      title: 'AI Models',
      icon: Download,
      description: 'Download and manage AI models for offline use'
    }
  ];

  // Settings items configuration
  const settingsItems: SettingItemConfig[] = useMemo(() => [
    // Account & Profile
    {
      id: 'profile-language',
      title: 'Language Preferences',
      description: 'Default language for the interface',
      type: 'select',
      section: 'account',
      key: 'language',
      options: [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español' },
        { value: 'fr', label: 'Français' },
        { value: 'de', label: 'Deutsch' },
        { value: 'ja', label: '日本語' },
        { value: 'ko', label: '한국어' },
        { value: 'zh', label: '中文' },
      ]
    },
    {
      id: 'voice-profile',
      title: 'Voice Profile',
      description: 'Set up your voice for cloning',
      type: 'navigation',
      section: 'account',
      key: 'voiceProfileTrained',
      badge: profile.voiceProfileTrained ? 'Trained' : 'Setup Required'
    },
    {
      id: 'subscription',
      title: 'Subscription & Billing',
      description: 'Manage your subscription and billing',
      type: 'navigation',
      section: 'account',
      key: 'subscriptionTier',
      badge: profile.subscriptionTier.charAt(0).toUpperCase() + profile.subscriptionTier.slice(1)
    },

    // Audio & Video
    {
      id: 'video-quality',
      title: 'Video Quality',
      description: 'Default video quality for calls',
      type: 'select',
      section: 'audioVideo',
      key: 'videoQuality',
      options: [
        { value: 'Auto', label: 'Auto' },
        { value: '1080p', label: '1080p (High)' },
        { value: '720p', label: '720p (Medium)' },
        { value: '480p', label: '480p (Low)' }
      ]
    },
    {
      id: 'echo-cancellation',
      title: 'Echo Cancellation',
      description: 'Reduce echo during calls',
      type: 'toggle',
      section: 'audioVideo',
      key: 'echoCancellation'
    },
    {
      id: 'noise-reduction',
      title: 'Noise Reduction',
      description: 'Filter background noise',
      type: 'toggle',
      section: 'audioVideo',
      key: 'noiseReduction'
    },

    // Translation
    {
      id: 'voice-cloning',
      title: 'Voice Cloning',
      description: 'Preserve voice characteristics in translations',
      type: 'toggle',
      section: 'translation',
      key: 'enableVoiceCloning'
    },
    {
      id: 'voice-quality',
      title: 'Voice Quality',
      description: 'Balance between quality and speed',
      type: 'select',
      section: 'translation',
      key: 'voiceQuality',
      options: [
        { value: 'High (Slower)', label: 'High Quality (Slower)' },
        { value: 'Balanced', label: 'Balanced' },
        { value: 'Fast (Lower Quality)', label: 'Fast (Lower Quality)' }
      ]
    },
    {
      id: 'offline-mode',
      title: 'Offline Mode',
      description: 'Use downloaded models for offline translation',
      type: 'toggle',
      section: 'translation',
      key: 'offlineMode'
    },

    // VS Features
    {
      id: 'vs-auto-start',
      title: 'Auto-Start VS Environment',
      description: 'Start VS Environment automatically on launch',
      type: 'toggle',
      section: 'vsEnvironment',
      key: 'autoStart'
    },
    {
      id: 'vs-language-lock',
      title: 'Language Lock by Default',
      description: 'Limit to 2 languages to save costs',
      type: 'toggle',
      section: 'vsPresenter',
      key: 'languageLockDefault'
    },
    {
      id: 'vs-friends-auto-accept',
      title: 'Auto-Accept Friend Connections',
      description: 'Skip confirmation when phones tap',
      type: 'toggle',
      section: 'vsFriends',
      key: 'autoAccept'
    },

    // Notifications
    {
      id: 'call-notifications',
      title: 'Call Notifications',
      description: 'Get notified about incoming calls',
      type: 'toggle',
      section: 'notifications',
      key: 'callNotifications'
    },
    {
      id: 'marketing-emails',
      title: 'Marketing Emails',
      description: 'Receive product updates and promotions',
      type: 'toggle',
      section: 'notifications',
      key: 'marketingEmails'
    },

    // Privacy & Security
    {
      id: 'analytics-toggle',
      title: 'Analytics',
      description: 'Help improve VidLiSync by sharing usage data',
      type: 'toggle',
      section: 'privacy',
      key: 'analyticsToggle'
    },
    {
      id: 'voice-data-storage',
      title: 'Voice Data Storage',
      description: 'Store voice recordings for profile improvement',
      type: 'toggle',
      section: 'privacy',
      key: 'voiceDataStorage'
    },
    {
      id: 'auto-delete-transcripts',
      title: 'Auto-Delete Transcripts',
      description: 'Automatically delete call transcripts',
      type: 'toggle',
      section: 'privacy',
      key: 'autoDeleteTranscripts'
    },

    // Appearance
    {
      id: 'theme',
      title: 'Theme',
      description: 'Choose your preferred color theme',
      type: 'select',
      section: 'appearance',
      key: 'theme',
      options: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'auto', label: 'Auto (System)' }
      ]
    },
    {
      id: 'text-size',
      title: 'Text Size',
      description: 'Adjust text size for better readability',
      type: 'select',
      section: 'appearance',
      key: 'textSize',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'extra-large', label: 'Extra Large' }
      ]
    },
    {
      id: 'high-contrast',
      title: 'High Contrast',
      description: 'Increase contrast for better visibility',
      type: 'toggle',
      section: 'appearance',
      key: 'highContrast'
    },
    {
      id: 'reduce-motion',
      title: 'Reduce Motion',
      description: 'Minimize animations and transitions',
      type: 'toggle',
      section: 'appearance',
      key: 'reduceMotion'
    },

    // Advanced
    {
      id: 'developer-mode',
      title: 'Developer Mode',
      description: 'Enable advanced debugging features',
      type: 'toggle',
      section: 'advanced',
      key: 'developerMode'
    },
    {
      id: 'gpu-acceleration',
      title: 'GPU Acceleration',
      description: 'Use GPU for faster AI processing',
      type: 'toggle',
      section: 'advanced',
      key: 'gpuAcceleration'
    },
    {
      id: 'cache-size',
      title: 'Cache Size (MB)',
      description: 'Amount of storage for temporary files',
      type: 'slider',
      section: 'advanced',
      key: 'cacheSize',
      min: 512,
      max: 4096,
      step: 256
    }
  ], [profile.voiceProfileTrained, profile.subscriptionTier]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SettingItemConfig[] = [];

    settingsItems.forEach(item => {
      if (
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.section.toLowerCase().includes(query)
      ) {
        results.push(item);
      }
    });

    return results;
  }, [searchQuery, settingsItems]);

  // Get current setting value
  const getSettingValue = (section: string, key: string) => {
    const sectionData: Record<string, any> = {
      account: profile,
      audioVideo,
      translation,
      vsEnvironment,
      vsPresenter,
      vsFriends,
      notifications,
      privacy,
      appearance,
      advanced
    };

    return sectionData[section]?.[key];
  };

  // Render setting item
  const renderSettingItem = (item: SettingItemConfig) => {
    const value = getSettingValue(item.section, item.key);

    switch (item.type) {
      case 'toggle':
        return (
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {item.description}
                </p>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => updateSetting(item.section, item.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        );

      case 'select':
        return (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {item.description}
              </p>
            )}
            <select
              value={value || ''}
              onChange={(e) => updateSetting(item.section, item.key, e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {item.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'slider':
        return (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {item.description}
              </p>
            )}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{item.min}</span>
              <input
                type="range"
                min={item.min}
                max={item.max}
                step={item.step}
                value={value || item.min}
                onChange={(e) => updateSetting(item.section, item.key, parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-sm text-gray-500">{item.max}</span>
            </div>
            <div className="text-center mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {value || item.min} {item.key === 'cacheSize' ? 'MB' : ''}
            </div>
          </div>
        );

      case 'navigation':
        return (
          <div 
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            onClick={item.onClick}
          >
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {item.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {item.badge && (
                <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render models section
  const renderModelsSection = () => {
    const models = [
      { id: 'whisper', name: 'Whisper Large v3', description: 'Speech recognition model' },
      { id: 'nllb', name: 'NLLB-200 Distilled', description: 'Translation model' },
      { id: 'wunjoVoice', name: 'Wunjo Voice v2.1', description: 'Voice cloning model' },
      { id: 'wunjoLips', name: 'Wunjo Lips v1.8', description: 'Lip sync model' }
    ] as const;

    return (
      <div className="space-y-4">
        {models.map(model => {
          const status = modelStatus[model.id];
          return (
            <div key={model.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {model.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {model.description} • {(status.size / 1024 / 1024 / 1024).toFixed(1)} GB
                  </p>
                  {status.lastUpdated && (
                    <p className="text-xs text-gray-400 mt-1">
                      Updated: {status.lastUpdated.toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {status.downloaded ? (
                    <>
                      <span className="flex items-center text-green-600 dark:text-green-400 text-sm">
                        <Check className="w-4 h-4 mr-1" />
                        Downloaded
                      </span>
                      <button
                        onClick={() => deleteModel(model.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete model"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => downloadModel(model.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render section content
  const renderSectionContent = () => {
    if (activeSection === 'models') {
      return renderModelsSection();
    }

    const sectionItems = settingsItems.filter(item => {
      const sectionMapping = {
        account: ['account'],
        audioVideo: ['audioVideo'],
        translation: ['translation'],
        vsFeatures: ['vsEnvironment', 'vsPresenter', 'vsFriends'],
        notifications: ['notifications'],
        privacy: ['privacy'],
        appearance: ['appearance'],
        advanced: ['advanced']
      };

      return sectionMapping[activeSection as keyof typeof sectionMapping]?.includes(item.section);
    });

    return (
      <div className="space-y-4">
        {sectionItems.map(item => (
          <div key={item.id}>
            {renderSettingItem(item)}
          </div>
        ))}
        {sectionItems.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No settings found in this section.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your VidLiSync experience
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => searchSettings(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <nav className="space-y-2">
                {settingsSections.map(section => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center p-3 text-left rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {section.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Reset Section Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setResetSectionId(activeSection);
                    setShowResetConfirm(true);
                  }}
                  className="w-full flex items-center justify-center p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Section
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {searchQuery ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Search Results ({searchResults.length})
                </h2>
                <div className="space-y-4">
                  {searchResults.map(item => (
                    <div key={item.id}>
                      {renderSettingItem(item)}
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No settings found matching your search.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {settingsSections.find(s => s.id === activeSection)?.title}
                  </h2>
                  {activeSection !== 'models' && (
                    <button
                      onClick={() => {
                        setResetSectionId(activeSection);
                        setShowResetConfirm(true);
                      }}
                      className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Section
                    </button>
                  )}
                </div>
                {renderSectionContent()}
              </div>
            )}
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Reset Settings Section
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to reset all settings in this section to their default values? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (resetSectionId) {
                      resetSection(resetSectionId);
                    }
                    setShowResetConfirm(false);
                    setResetSectionId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;