/**
 * Language Selector Component
 */

'use client';

import React, { useState } from 'react';
import { X, Check, Globe } from 'lucide-react';

interface LanguageSelectorProps {
  onClose: () => void;
  onLanguageSelect?: (language: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' }
];

export function LanguageSelector({ onClose, onLanguageSelect }: LanguageSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem('userLanguage') || 'en'
  );

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    localStorage.setItem('userLanguage', languageCode);
    
    if (onLanguageSelect) {
      onLanguageSelect(languageCode);
    }
    
    // Auto-close after selection
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Globe className="w-6 h-6" />
              Select Language
            </h2>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 transition-colors duration-200 rounded-lg p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Language List */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-2">
            {filteredLanguages.map(language => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`
                  w-full text-left p-3 rounded-lg transition-colors duration-200
                  ${selectedLanguage === language.code 
                    ? 'bg-blue-500/30 border-2 border-blue-400/50' 
                    : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{language.flag}</span>
                    <div>
                      <p className="font-medium text-white">{language.name}</p>
                      <p className="text-sm text-white/60">{language.code.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  {selectedLanguage === language.code && (
                    <Check className="w-5 h-5 text-blue-400" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/60">No languages found</p>
              <p className="text-sm text-white/40 mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 bg-white/5">
          <p className="text-xs text-white/50 text-center">
            Your voice will be cloned in the selected language
          </p>
        </div>
      </div>
    </div>
  );
}