/**
 * Translation Controls Component
 * Language selection and translation controls for video calls
 */
'use client';

import { useState } from 'react';
import { 
  LanguagesIcon, 
  PlayIcon, 
  PauseIcon, 
  SettingsIcon,
  VolumeXIcon,
  Volume2Icon,
  RefreshCwIcon,
  MicIcon,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react';
import { useTranslationStore } from '@/stores/translationStore';
import { useTranslationWebSocket } from '@/hooks/useTranslationWebSocket';

interface TranslationControlsProps {
  className?: string;
  compact?: boolean;
  onOpenPanel?: () => void;
}

export default function TranslationControls({ className = '', compact = false, onOpenPanel }: TranslationControlsProps) {
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    isTranslationActive,
    sourceLanguage,
    targetLanguage,
    availableLanguages,
    showTranslationOverlay,
    showOriginalText,
    translationVolume,
    translationQuality,
    connectionQuality,
    averageLatency,
    isVoiceTrainingRequired,
    setSourceLanguage,
    setTargetLanguage,
    setShowTranslationOverlay,
    setShowOriginalText,
    setTranslationVolume,
    switchLanguages,
  } = useTranslationStore();
  
  const { isConnected, startTranslation, stopTranslation, connect } = useTranslationWebSocket();

  const getLanguageName = (code: string) => {
    const lang = availableLanguages.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code.toUpperCase();
  };

  const handleToggleTranslation = async () => {
    try {
      if (isTranslationActive) {
        stopTranslation();
      } else {
        if (!isConnected) {
          // Connect first if not connected
          await connect();
        }
        await startTranslation(sourceLanguage, targetLanguage);
      }
    } catch (error) {
      console.error('Failed to toggle translation:', error);
    }
  };

  const handleSwapLanguages = async () => {
    try {
      await switchLanguages(targetLanguage, sourceLanguage);
    } catch (error) {
      console.error('Failed to swap languages:', error);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionColor = (quality: string) => {
    switch (quality) {
      case 'stable': return 'text-green-500';
      case 'unstable': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Translation Toggle */}
        <button
          onClick={handleToggleTranslation}
          disabled={!isConnected && !isTranslationActive}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full
            ${isTranslationActive 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
            transition-colors duration-200
            ${(!isConnected && !isTranslationActive) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={isTranslationActive ? 'Stop Translation' : 'Start Translation'}
        >
          <LanguagesIcon className="w-5 h-5" />
        </button>
        
        {/* Quick Quality Indicator */}
        {isTranslationActive && (
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${getQualityColor(translationQuality)}`} />
            <span className="text-xs text-gray-400">{averageLatency}ms</span>
          </div>
        )}
        
        {/* Settings Button */}
        {onOpenPanel && (
          <button
            onClick={onOpenPanel}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200"
            title="Open Translation Settings (T)"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <LanguagesIcon className="w-5 h-5 mr-2" />
          Translation
        </h3>
        
        {/* Quality Indicators */}
        <div className="flex items-center space-x-3 text-sm">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${getQualityColor(translationQuality)}`} />
            <span className="text-gray-400">Quality: {translationQuality}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${getConnectionColor(connectionQuality)}`} />
            <span className="text-gray-400">{averageLatency}ms</span>
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {/* Source Language */}
          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            disabled={isTranslationActive}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          
          {/* Swap Button */}
          <button
            onClick={handleSwapLanguages}
            disabled={isTranslationActive}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors duration-200 disabled:opacity-50"
            title="Swap Languages"
          >
            <RefreshCwIcon className="w-4 h-4 text-white" />
          </button>
          
          {/* Target Language */}
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            disabled={isTranslationActive}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between mb-4">
        {/* Translation Toggle */}
        <button
          onClick={handleToggleTranslation}
          disabled={!isConnected && !isTranslationActive}
          className={`
            flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200
            ${isTranslationActive 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
            ${(!isConnected && !isTranslationActive) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isTranslationActive ? (
            <>
              <PauseIcon className="w-4 h-4 mr-2" />
              Stop Translation
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4 mr-2" />
              Start Translation
            </>
          )}
        </button>
        
        {/* Voice Training Warning */}
        {isVoiceTrainingRequired && (
          <div className="flex items-center text-yellow-400 text-sm">
            <MicIcon className="w-4 h-4 mr-1" />
            Voice training required
          </div>
        )}
      </div>

      {/* Display Options */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Show Overlay Toggle */}
          <label className="flex items-center space-x-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showTranslationOverlay}
              onChange={(e) => setShowTranslationOverlay(e.target.checked)}
              className="rounded"
            />
            <span>Show Overlay</span>
          </label>
          
          {/* Show Original Text Toggle */}
          <label className="flex items-center space-x-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showOriginalText}
              onChange={(e) => setShowOriginalText(e.target.checked)}
              className="rounded"
            />
            <span>Show Original</span>
          </label>
        </div>
        
        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <VolumeXIcon className="w-4 h-4 text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={translationVolume}
            onChange={(e) => setTranslationVolume(parseFloat(e.target.value))}
            className="w-20"
          />
          <Volume2Icon className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Current Translation Display */}
      {isTranslationActive && (
        <div className="text-center text-sm text-gray-400">
          Translating {getLanguageName(sourceLanguage)} → {getLanguageName(targetLanguage)}
        </div>
      )}
    </div>
  );
}