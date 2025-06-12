'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ChevronRight, 
  Check, 
  User, 
  Camera, 
  Languages, 
  Sparkles, 
  Bell, 
  Shield, 
  Palette, 
  Settings,
  Save,
  RotateCcw,
  Download,
  Upload,
  Loader
} from 'lucide-react';
import { useSettingsStore, AllSettings } from '@/stores/settingsStore';

interface SettingsSectionConfig {
  title: string;
  icon: React.ComponentType<any>;
  items: SettingItemConfig[];
}

interface SettingItemConfig {
  id: string;
  title: string;
  description?: string;
  type: 'toggle' | 'select' | 'slider' | 'navigation' | 'button' | 'multiselect';
  section: keyof AllSettings;
  key: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  badge?: string;
  action?: () => void;
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
];

export default function ComprehensiveSettingsPage() {
  const {
    searchQuery,
    activeSection,
    isLoading,
    hasUnsavedChanges,
    updateSetting,
    resetSection,
    resetAllSettings,
    saveSettings,
    setSearchQuery,
    setActiveSection,
    exportSettings,
    importSettings,
    ...settings
  } = useSettingsStore();

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);

  // Settings configuration
  const settingsSections = useMemo((): Record<keyof AllSettings, SettingsSectionConfig> => ({
    account: {
      title: 'Account & Profile',
      icon: User,
      items: [
        {
          id: 'profile-language',
          title: 'Profile Language',
          description: 'Your primary language for the interface',
          type: 'select',
          section: 'account',
          key: 'profileLanguage',
          options: LANGUAGE_OPTIONS,
        },
        {
          id: 'voice-profile',
          title: 'Voice Profile Management',
          description: 'Train and manage your voice profiles',
          type: 'navigation',
          section: 'account',
          key: 'voiceProfileTrained',
          badge: settings.account.voiceProfileTrained ? 'Trained' : 'Setup Required',
        },
        {
          id: 'subscription',
          title: 'Subscription & Billing',
          description: 'Manage your subscription and billing information',
          type: 'navigation',
          section: 'account',
          key: 'subscriptionTier',
          badge: settings.account.subscriptionTier.toUpperCase(),
        },
      ],
    },
    audioVideo: {
      title: 'Audio & Video',
      icon: Camera,
      items: [
        {
          id: 'video-quality',
          title: 'Video Quality',
          description: 'Default video quality for calls',
          type: 'select',
          section: 'audioVideo',
          key: 'videoQuality',
          options: [
            { value: 'auto', label: 'Auto' },
            { value: '1080p', label: '1080p HD' },
            { value: '720p', label: '720p HD' },
            { value: '480p', label: '480p SD' },
          ],
        },
        {
          id: 'noise-reduction',
          title: 'Noise Reduction',
          description: 'Reduce background noise during calls',
          type: 'toggle',
          section: 'audioVideo',
          key: 'noiseReduction',
        },
        {
          id: 'echo-cancellation',
          title: 'Echo Cancellation',
          description: 'Prevent audio feedback and echo',
          type: 'toggle',
          section: 'audioVideo',
          key: 'echoCancellation',
        },
        {
          id: 'mic-gain',
          title: 'Microphone Gain',
          description: 'Adjust microphone sensitivity',
          type: 'slider',
          section: 'audioVideo',
          key: 'micGain',
          min: 0,
          max: 100,
          step: 5,
        },
        {
          id: 'output-volume',
          title: 'Output Volume',
          description: 'Adjust speaker/headphone volume',
          type: 'slider',
          section: 'audioVideo',
          key: 'outputVolume',
          min: 0,
          max: 100,
          step: 5,
        },
      ],
    },
    translation: {
      title: 'Translation',
      icon: Languages,
      items: [
        {
          id: 'source-language',
          title: 'My Language',
          description: 'Your primary speaking language',
          type: 'select',
          section: 'translation',
          key: 'defaultSourceLanguage',
          options: LANGUAGE_OPTIONS,
        },
        {
          id: 'frequent-languages',
          title: 'Frequent Languages',
          description: 'Languages you use most often',
          type: 'multiselect',
          section: 'translation',
          key: 'frequentLanguages',
          options: LANGUAGE_OPTIONS,
        },
        {
          id: 'voice-cloning',
          title: 'Voice Cloning',
          description: 'Preserve your voice characteristics in translations',
          type: 'toggle',
          section: 'translation',
          key: 'enableVoiceCloning',
        },
        {
          id: 'voice-quality',
          title: 'Voice Quality',
          description: 'Balance between quality and speed',
          type: 'select',
          section: 'translation',
          key: 'voiceQuality',
          options: [
            { value: 'high', label: 'High (Slower)' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'fast', label: 'Fast (Lower Quality)' },
          ],
        },
        {
          id: 'offline-models',
          title: 'Offline Models',
          description: 'Download models for offline translation',
          type: 'toggle',
          section: 'translation',
          key: 'offlineModelsEnabled',
        },
      ],
    },
    vsFeatures: {
      title: 'VS Features',
      icon: Sparkles,
      items: [
        {
          id: 'vs-environment-auto-start',
          title: 'VS Environment Auto-Start',
          description: 'Automatically start VS Environment on app launch',
          type: 'toggle',
          section: 'vsFeatures',
          key: 'vsEnvironment.autoStart',
        },
        {
          id: 'vs-environment-mode',
          title: 'Default VS Environment Mode',
          description: 'Choose default output mode',
          type: 'select',
          section: 'vsFeatures',
          key: 'vsEnvironment.defaultMode',
          options: [
            { value: 'audio', label: 'Audio Only' },
            { value: 'text', label: 'Text Only' },
            { value: 'both', label: 'Audio + Text' },
          ],
        },
        {
          id: 'vs-presenter-mode',
          title: 'Default VS Presenter Mode',
          description: 'Choose default presenter mode',
          type: 'select',
          section: 'vsFeatures',
          key: 'vsPresenter.defaultMode',
          options: [
            { value: 'in-person', label: 'In-Person' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'multi-user-hub', label: 'Multi-User Hub' },
          ],
        },
        {
          id: 'language-lock',
          title: 'Language Lock by Default',
          description: 'Limit to 2 languages to save costs',
          type: 'toggle',
          section: 'vsFeatures',
          key: 'vsPresenter.languageLockDefault',
        },
        {
          id: 'vs-friends-auto-accept',
          title: 'Auto-Accept VS Friends',
          description: 'Skip confirmation when phones tap',
          type: 'toggle',
          section: 'vsFeatures',
          key: 'vsFriends.autoAcceptConnections',
        },
      ],
    },
    notifications: {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          id: 'call-notifications',
          title: 'Call Notifications',
          description: 'Receive notifications for incoming calls',
          type: 'toggle',
          section: 'notifications',
          key: 'callNotifications',
        },
        {
          id: 'translation-alerts',
          title: 'Translation Alerts',
          description: 'Get notified about translation issues',
          type: 'toggle',
          section: 'notifications',
          key: 'translationAlerts',
        },
        {
          id: 'quality-warnings',
          title: 'Quality Warnings',
          description: 'Alert when call quality is poor',
          type: 'toggle',
          section: 'notifications',
          key: 'qualityWarnings',
        },
        {
          id: 'usage-warnings',
          title: 'Usage Warnings',
          description: 'Warn when approaching limits',
          type: 'toggle',
          section: 'notifications',
          key: 'usageWarnings',
        },
        {
          id: 'marketing-emails',
          title: 'Marketing Emails',
          description: 'Receive promotional emails (opt-out available)',
          type: 'toggle',
          section: 'notifications',
          key: 'marketingEmails',
        },
      ],
    },
    privacy: {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        {
          id: 'analytics',
          title: 'Analytics',
          description: 'Help improve VidLiSync with usage analytics',
          type: 'toggle',
          section: 'privacy',
          key: 'analyticsEnabled',
        },
        {
          id: 'crash-reporting',
          title: 'Crash Reporting',
          description: 'Send crash reports to help fix bugs',
          type: 'toggle',
          section: 'privacy',
          key: 'crashReporting',
        },
        {
          id: 'export-data',
          title: 'Export My Data',
          description: 'Download a copy of your data',
          type: 'button',
          section: 'privacy',
          key: 'dataExportRequested',
          action: () => {
            // TODO: Implement data export
            console.log('Export data requested');
          },
        },
        {
          id: 'delete-account',
          title: 'Delete Account',
          description: 'Permanently delete your account and data',
          type: 'button',
          section: 'privacy',
          key: 'accountDeletionRequested',
          action: () => {
            // TODO: Implement account deletion
            console.log('Account deletion requested');
          },
        },
      ],
    },
    appearance: {
      title: 'Appearance',
      icon: Palette,
      items: [
        {
          id: 'theme',
          title: 'Theme',
          description: 'Choose your preferred theme',
          type: 'select',
          section: 'appearance',
          key: 'theme',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto (System)' },
          ],
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
            { value: 'extra-large', label: 'Extra Large' },
          ],
        },
        {
          id: 'high-contrast',
          title: 'High Contrast',
          description: 'Increase contrast for better visibility',
          type: 'toggle',
          section: 'appearance',
          key: 'highContrast',
        },
        {
          id: 'reduce-motion',
          title: 'Reduce Motion',
          description: 'Minimize animations and transitions',
          type: 'toggle',
          section: 'appearance',
          key: 'reduceMotion',
        },
      ],
    },
    advanced: {
      title: 'Advanced',
      icon: Settings,
      items: [
        {
          id: 'developer-mode',
          title: 'Developer Mode',
          description: 'Enable advanced debugging features',
          type: 'toggle',
          section: 'advanced',
          key: 'developerMode',
        },
        {
          id: 'enable-logging',
          title: 'Enable Logging',
          description: 'Log app activity for troubleshooting',
          type: 'toggle',
          section: 'advanced',
          key: 'enableLogging',
        },
        {
          id: 'cache-size',
          title: 'Cache Size (MB)',
          description: 'Maximum cache size for offline data',
          type: 'slider',
          section: 'advanced',
          key: 'cacheSize',
          min: 100,
          max: 2000,
          step: 100,
        },
        {
          id: 'auto-clear-cache',
          title: 'Auto Clear Cache',
          description: 'Automatically clear cache when full',
          type: 'toggle',
          section: 'advanced',
          key: 'autoClearCache',
        },
        {
          id: 'gpu-acceleration',
          title: 'GPU Acceleration',
          description: 'Use GPU for AI processing (requires restart)',
          type: 'toggle',
          section: 'advanced',
          key: 'enableGPUAcceleration',
        },
      ],
    },
  }), [settings]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery) return null;

    const results: Array<{ section: keyof AllSettings; item: SettingItemConfig }> = [];
    
    Object.entries(settingsSections).forEach(([sectionKey, section]) => {
      section.items.forEach(item => {
        const searchFields = [
          item.title,
          item.description,
          section.title
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (searchFields.includes(searchQuery)) {
          results.push({
            section: sectionKey as keyof AllSettings,
            item
          });
        }
      });
    });
    
    return results;
  }, [searchQuery, settingsSections]);

  // Save settings handler
  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    try {
      await saveSettings();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save settings:', error);
    }
  };

  // Reset section handler
  const handleResetSection = (section: keyof AllSettings) => {
    resetSection(section);
    setShowResetConfirm(null);
  };

  // Export settings handler
  const handleExportSettings = async () => {
    try {
      const settingsJson = await exportSettings();
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vidlisync-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export settings:', error);
    }
  };

  // Import settings handler
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const settingsJson = e.target?.result as string;
        await importSettings(settingsJson);
      } catch (error) {
        console.error('Failed to import settings:', error);
        alert('Failed to import settings. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Get setting value by path
  const getSettingValue = (section: keyof AllSettings, key: string): any => {
    const sectionData = settings[section] as any;
    if (key.includes('.')) {
      const keys = key.split('.');
      return keys.reduce((obj, k) => obj?.[k], sectionData);
    }
    return sectionData[key];
  };

  // Update setting by path
  const handleUpdateSetting = (section: keyof AllSettings, key: string, value: any) => {
    if (key.includes('.')) {
      // Handle nested keys like 'vsEnvironment.autoStart'
      const keys = key.split('.');
      const nestedUpdate = { ...settings[section] as any };
      let current = nestedUpdate;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      // Use type assertion to bypass strict typing for nested updates
      (updateSetting as any)(section, keys[0], nestedUpdate[keys[0]]);
    } else {
      (updateSetting as any)(section, key, value);
    }
  };

  // Render setting item
  const renderSettingItem = (item: SettingItemConfig, sectionKey: keyof AllSettings) => {
    const value = getSettingValue(sectionKey, item.key);

    switch (item.type) {
      case 'toggle':
        return (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleUpdateSetting(sectionKey, item.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        );

      case 'select':
        return (
          <div>
            <div className="mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              )}
            </div>
            <select
              value={value}
              onChange={(e) => handleUpdateSetting(sectionKey, item.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
          <div>
            <div className="mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={item.min}
                max={item.max}
                step={item.step}
                value={value}
                onChange={(e) => handleUpdateSetting(sectionKey, item.key, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3ch]">
                {value}{item.key.includes('Volume') || item.key.includes('Gain') ? '%' : ''}
              </span>
            </div>
          </div>
        );

      case 'navigation':
        return (
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg"
            onClick={() => {
              // TODO: Navigate to specific setting page
              console.log(`Navigate to ${item.title}`);
            }}
          >
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {item.badge && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        );

      case 'button':
        return (
          <div>
            <div className="mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              )}
            </div>
            <button
              onClick={item.action}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {item.title}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize VidLiSync to your preferences
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
            id="import-settings"
          />
          <label
            htmlFor="import-settings"
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </label>
          
          <button
            onClick={handleExportSettings}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveSettings}
              disabled={isLoading || saveStatus === 'saving'}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : saveStatus === 'saved' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {saveStatus === 'saving' ? 'Saving...' : 
                 saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Settings Navigation */}
        {!searchQuery && (
          <div className="lg:w-64 space-y-2">
            {Object.entries(settingsSections).map(([sectionKey, section]) => {
              const Icon = section.icon;
              const isActive = activeSection === sectionKey;
              
              return (
                <button
                  key={sectionKey}
                  onClick={() => setActiveSection(sectionKey as keyof AllSettings)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {searchQuery ? (
            /* Search Results */
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Search Results ({searchResults?.length || 0})
              </h2>
              
              {searchResults?.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No settings found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try searching with different keywords
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {searchResults?.map(({ section, item }, index) => (
                    <div key={`${section}-${item.id}`} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="mb-2">
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {settingsSections[section].title}
                        </span>
                      </div>
                      {renderSettingItem(item, section)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeSection ? (
            /* Active Section Settings */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {settingsSections[activeSection].title}
                  </h2>
                </div>
                <button
                  onClick={() => setShowResetConfirm(activeSection)}
                  className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Section</span>
                </button>
              </div>
              
              <div className="space-y-6">
                {settingsSections[activeSection].items.map(item => (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    {renderSettingItem(item, activeSection)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Default View - All Sections Overview */
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                All Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Select a category from the sidebar to configure specific settings, or use the search bar to find what you&apos;re looking for.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(settingsSections).map(([sectionKey, section]) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={sectionKey}
                      onClick={() => setActiveSection(sectionKey as keyof AllSettings)}
                      className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {section.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {section.items.length} settings available
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reset {settingsSections[showResetConfirm as keyof AllSettings].title}?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will restore all settings in this section to their default values. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetSection(showResetConfirm as keyof AllSettings)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}