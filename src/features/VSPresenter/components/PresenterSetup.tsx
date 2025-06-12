/**
 * Presenter Setup Component - Configuration flow for VS Presenter
 * Professional setup interface for presentation configuration
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useVSPresenterStore } from '../stores/vsPresenterStore';
import { PresenterConfig, PresentationMode, VoiceMode } from '../types';
import { 
  PresentationIcon,
  MicIcon,
  UsersIcon,
  GlobeIcon,
  SettingsIcon,
  PlayIcon
} from 'lucide-react';

const PRESENTATION_MODES: { mode: PresentationMode; title: string; description: string }[] = [
  {
    mode: 'in-person',
    title: 'In-Person Presentation',
    description: 'Presenter uses earbuds, audience hears through venue speakers'
  },
  {
    mode: 'hybrid',
    title: 'Hybrid Presentation',
    description: 'Mix of in-person and remote audience members'
  },
  {
    mode: 'multi-user-hub',
    title: 'Multi-User Audio Hub',
    description: 'Each participant uses their own device like Zoom/Teams'
  }
];

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ru', name: 'Russian' }
];

export const PresenterSetup: React.FC = () => {
  const { 
    config, 
    updateConfig, 
    startPresentation,
    audioRouting,
    updateAudioRouting 
  } = useVSPresenterStore();
  
  const [isStarting, setIsStarting] = useState(false);

  const handleModeChange = (mode: PresentationMode) => {
    updateConfig({ mode });
    
    // Update audio routing based on mode
    if (mode === 'in-person') {
      updateAudioRouting({
        audience: { output: 'venue-speakers' }
      });
    } else {
      updateAudioRouting({
        audience: { output: 'individual-devices' }
      });
    }
  };

  const handleLanguageLockChange = (enabled: boolean) => {
    updateConfig({ 
      languageLock: enabled,
      audienceLanguages: enabled ? [config.audienceLanguages[0] || 'es'] : config.audienceLanguages
    });
  };

  const handleStartPresentation = async () => {
    setIsStarting(true);
    try {
      await startPresentation(config);
    } catch (error) {
      console.error('Failed to start presentation:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const getModeIcon = (mode: PresentationMode) => {
    switch (mode) {
      case 'in-person':
        return <MicIcon className="w-6 h-6" />;
      case 'hybrid':
        return <UsersIcon className="w-6 h-6" />;
      case 'multi-user-hub':
        return <GlobeIcon className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <PresentationIcon className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">VS Presenter Setup</h1>
          <p className="text-white/80 text-lg">Configure your multi-language presentation</p>
        </div>

        {/* Setup Form */}
        <div className="space-y-8">
          {/* Presentation Mode Selection */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Presentation Mode</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRESENTATION_MODES.map(({ mode, title, description }) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`p-4 rounded-xl transition-all text-left ${
                    config.mode === mode
                      ? 'bg-white text-purple-600 ring-2 ring-purple-300'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {getModeIcon(mode)}
                    <span className="ml-2 font-semibold">{title}</span>
                  </div>
                  <p className={`text-sm ${config.mode === mode ? 'text-purple-500' : 'text-white/70'}`}>
                    {description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Language Configuration */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Language Settings</h2>
            
            {/* Presenter Language */}
            <div className="mb-6">
              <label className="text-white mb-2 block font-medium">Your Language</label>
              <select
                value={config.presenterLanguage}
                onChange={(e) => updateConfig({ presenterLanguage: e.target.value })}
                className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:border-white focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="text-gray-900">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Lock Option */}
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl mb-4">
              <div>
                <h3 className="text-white font-semibold">Language Lock</h3>
                <p className="text-white/70 text-sm">
                  Limit to 2 languages to reduce costs (recommended for budget control)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.languageLock}
                  onChange={(e) => handleLanguageLockChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Audience Languages */}
            {!config.languageLock && (
              <div>
                <label className="text-white mb-2 block font-medium">Audience Languages</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SUPPORTED_LANGUAGES.filter(lang => lang.code !== config.presenterLanguage).map(lang => (
                    <label key={lang.code} className="flex items-center p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.audienceLanguages.includes(lang.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateConfig({ 
                              audienceLanguages: [...config.audienceLanguages, lang.code] 
                            });
                          } else {
                            updateConfig({ 
                              audienceLanguages: config.audienceLanguages.filter(l => l !== lang.code) 
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-white text-sm">{lang.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {config.languageLock && (
              <div>
                <label className="text-white mb-2 block font-medium">Audience Language</label>
                <select
                  value={config.audienceLanguages[0] || 'es'}
                  onChange={(e) => updateConfig({ audienceLanguages: [e.target.value] })}
                  className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:border-white focus:outline-none"
                >
                  {SUPPORTED_LANGUAGES.filter(lang => lang.code !== config.presenterLanguage).map(lang => (
                    <option key={lang.code} value={lang.code} className="text-gray-900">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Voice Settings */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Voice Settings</h2>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center p-4 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer flex-1">
                  <input
                    type="radio"
                    name="voiceMode"
                    value="clone"
                    checked={config.voiceMode === 'clone'}
                    onChange={(e) => updateConfig({ voiceMode: e.target.value as VoiceMode })}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div className="ml-3">
                    <div className="text-white font-medium">Use My Cloned Voice</div>
                    <div className="text-white/70 text-sm">Preserve your unique voice characteristics</div>
                  </div>
                </label>
                
                <label className="flex items-center p-4 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer flex-1">
                  <input
                    type="radio"
                    name="voiceMode"
                    value="ai-voice"
                    checked={config.voiceMode === 'ai-voice'}
                    onChange={(e) => updateConfig({ voiceMode: e.target.value as VoiceMode })}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div className="ml-3">
                    <div className="text-white font-medium">Use AI Voice</div>
                    <div className="text-white/70 text-sm">Professional AI-generated voice</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Audio Routing for In-Person/Hybrid */}
          {config.mode !== 'multi-user-hub' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Audio Routing</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-white font-medium mb-2">Presenter Audio</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-white/80 text-sm">Microphone</label>
                        <select className="w-full p-2 rounded bg-white/20 text-white border border-white/30">
                          <option className="text-gray-900">Default Device</option>
                          <option className="text-gray-900">Bluetooth Headset</option>
                          <option className="text-gray-900">USB Microphone</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-white/80 text-sm">Earbuds (for questions)</label>
                        <select className="w-full p-2 rounded bg-white/20 text-white border border-white/30">
                          <option className="text-gray-900">Bluetooth Earbuds</option>
                          <option className="text-gray-900">Wired Headphones</option>
                          <option className="text-gray-900">Device Speaker</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {config.mode === 'in-person' && (
                    <div>
                      <h3 className="text-white font-medium mb-2">Audience Audio</h3>
                      <div>
                        <label className="text-white/80 text-sm">Output Device</label>
                        <select className="w-full p-2 rounded bg-white/20 text-white border border-white/30">
                          <option className="text-gray-900">Venue Speakers</option>
                          <option className="text-gray-900">PA System</option>
                          <option className="text-gray-900">Wireless Speakers</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Advanced Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-white mb-2 block font-medium">Max Participants</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={config.maxParticipants}
                  onChange={(e) => updateConfig({ maxParticipants: parseInt(e.target.value) })}
                  className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:border-white focus:outline-none"
                />
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.recordingEnabled}
                    onChange={(e) => updateConfig({ recordingEnabled: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-white font-medium">Enable Recording</span>
                </label>
              </div>
            </div>
          </div>

          {/* Start Presentation Button */}
          <div className="text-center">
            <button
              onClick={handleStartPresentation}
              disabled={isStarting || config.audienceLanguages.length === 0}
              className="inline-flex items-center px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold text-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                  Starting Presentation...
                </>
              ) : (
                <>
                  <PlayIcon className="w-6 h-6 mr-2" />
                  Start Presentation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};