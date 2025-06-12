'use client';

import { useEffect, useState } from 'react';
import { LanguagesIcon, CheckIcon, XIcon } from 'lucide-react';

export default function TeamsConfigPage() {
  const [isTeamsContext, setIsTeamsContext] = useState(false);
  const [configState, setConfigState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedLanguages, setSelectedLanguages] = useState({
    source: 'en',
    target: 'es'
  });

  useEffect(() => {
    // Initialize Teams SDK
    if (typeof window !== 'undefined' && window.microsoftTeams) {
      window.microsoftTeams?.initialize?.(() => {
        setIsTeamsContext(true);
        window.microsoftTeams?.getContext?.((context) => {
          console.log('Teams context:', context);
          setConfigState('ready');
        });
      });
    } else {
      // Fallback for non-Teams environment
      setConfigState('ready');
    }
  }, []);

  const handleSaveConfig = () => {
    if (isTeamsContext && window.microsoftTeams) {
      // Save configuration to Teams
      const config = {
        entityId: 'vidlisync-translation',
        contentUrl: `${window.location.origin}/teams/dashboard?source=${selectedLanguages.source}&target=${selectedLanguages.target}`,
        websiteUrl: `${window.location.origin}/dashboard`,
        suggestedDisplayName: 'VidLiSync Translation'
      };

      // Save the configuration
      window.microsoftTeams.settings?.setSettings?.(config);
      window.microsoftTeams.settings?.setValidityState?.(true);
    }
  };

  if (configState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Initializing Teams integration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-6">
            <LanguagesIcon className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-white">VidLiSync for Teams</h1>
              <p className="text-gray-400">Configure real-time translation for your meetings</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Language Configuration */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Default Languages</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Source Language
                  </label>
                  <select
                    value={selectedLanguages.source}
                    onChange={(e) => setSelectedLanguages(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="es">🇪🇸 Spanish</option>
                    <option value="fr">🇫🇷 French</option>
                    <option value="de">🇩🇪 German</option>
                    <option value="it">🇮🇹 Italian</option>
                    <option value="pt">🇵🇹 Portuguese</option>
                    <option value="ru">🇷🇺 Russian</option>
                    <option value="zh">🇨🇳 Chinese</option>
                    <option value="ja">🇯🇵 Japanese</option>
                    <option value="ko">🇰🇷 Korean</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Language
                  </label>
                  <select
                    value={selectedLanguages.target}
                    onChange={(e) => setSelectedLanguages(prev => ({ ...prev, target: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="es">🇪🇸 Spanish</option>
                    <option value="fr">🇫🇷 French</option>
                    <option value="de">🇩🇪 German</option>
                    <option value="it">🇮🇹 Italian</option>
                    <option value="pt">🇵🇹 Portuguese</option>
                    <option value="ru">🇷🇺 Russian</option>
                    <option value="zh">🇨🇳 Chinese</option>
                    <option value="ja">🇯🇵 Japanese</option>
                    <option value="ko">🇰🇷 Korean</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Features Overview */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
              <div className="space-y-2">
                <div className="flex items-center text-green-400">
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Real-time speech-to-speech translation
                </div>
                <div className="flex items-center text-green-400">
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Voice cloning to preserve your unique voice
                </div>
                <div className="flex items-center text-green-400">
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Lip synchronization for natural video
                </div>
                <div className="flex items-center text-green-400">
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Sub-400ms latency for seamless conversations
                </div>
                <div className="flex items-center text-green-400">
                  <CheckIcon className="w-5 h-5 mr-2" />
                  50+ language support
                </div>
              </div>
            </div>

            {/* Configuration Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <button
                onClick={handleSaveConfig}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}