/**
 * Translation Overlay Component
 * Displays real-time translation results over video calls
 */
'use client';

import { useEffect, useState } from 'react';
import { useTranslationStore } from '@/stores/translationStore';
import { 
  LanguagesIcon, 
  EyeIcon, 
  EyeOffIcon,
  VolumeXIcon,
  Volume2Icon,
  WifiIcon,
  AlertTriangleIcon,
} from 'lucide-react';

interface TranslationOverlayProps {
  className?: string;
}

export default function TranslationOverlay({ className = '' }: TranslationOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [autoHideTimeout, setAutoHideTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const {
    isTranslationActive,
    showTranslationOverlay,
    showOriginalText,
    overlayPosition,
    currentTranslation,
    translationQuality,
    connectionQuality,
    averageLatency,
    availableLanguages,
    sourceLanguage,
    targetLanguage,
    setShowTranslationOverlay,
  } = useTranslationStore();

  // Auto-hide overlay after inactivity
  useEffect(() => {
    if (currentTranslation) {
      setIsVisible(true);
      
      // Clear existing timeout
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }
      
      // Set new timeout to hide after 5 seconds of no new translations
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      setAutoHideTimeout(timeout);
    }
    
    return () => {
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
      }
    };
  }, [currentTranslation, autoHideTimeout]);

  // Don't render if translation is not active or overlay is disabled
  if (!isTranslationActive || !showTranslationOverlay) {
    return null;
  }

  const getLanguageName = (code: string) => {
    const lang = availableLanguages.find(l => l.code === code);
    return lang ? lang.name : code.toUpperCase();
  };

  const getLanguageFlag = (code: string) => {
    const lang = availableLanguages.find(l => l.code === code);
    return lang ? lang.flag : '🌐';
  };

  const getQualityIcon = () => {
    switch (connectionQuality) {
      case 'stable': return <WifiIcon className="w-3 h-3 text-green-400" />;
      case 'unstable': return <WifiIcon className="w-3 h-3 text-yellow-400" />;
      case 'poor': return <AlertTriangleIcon className="w-3 h-3 text-red-400" />;
      default: return <WifiIcon className="w-3 h-3 text-gray-400" />;
    }
  };

  const getPositionClasses = () => {
    switch (overlayPosition) {
      case 'top':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return 'bottom-20 left-1/2 transform -translate-x-1/2';
    }
  };

  return (
    <div 
      className={`
        fixed z-50 pointer-events-none
        ${getPositionClasses()}
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        ${className}
      `}
    >
      {/* Main Translation Display */}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 min-w-[400px] max-w-[600px] mx-auto pointer-events-auto">
        {/* Header with languages and controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <LanguagesIcon className="w-4 h-4" />
            <span>
              {getLanguageFlag(sourceLanguage)} {getLanguageName(sourceLanguage)}
              <span className="mx-2">→</span>
              {getLanguageFlag(targetLanguage)} {getLanguageName(targetLanguage)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Quality Indicator */}
            <div className="flex items-center space-x-1">
              {getQualityIcon()}
              <span className="text-xs text-gray-400">{averageLatency}ms</span>
            </div>
            
            {/* Hide Button */}
            <button
              onClick={() => setShowTranslationOverlay(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors duration-200"
              title="Hide Translation Overlay"
            >
              <EyeOffIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Translation Content */}
        {currentTranslation ? (
          <div className="space-y-3">
            {/* Original Text */}
            {showOriginalText && currentTranslation.sourceText && (
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-400 uppercase">
                    {getLanguageFlag(sourceLanguage)} Original
                  </span>
                  <Volume2Icon className="w-3 h-3 text-gray-400" />
                </div>
                <p className="text-white text-sm leading-relaxed">
                  {currentTranslation.sourceText}
                </p>
              </div>
            )}
            
            {/* Translated Text */}
            {currentTranslation.translatedText && (
              <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-300 uppercase">
                    {getLanguageFlag(targetLanguage)} Translation
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-blue-300">
                      {Math.round(currentTranslation.qualityMetrics.quality_score * 100)}%
                    </span>
                    <Volume2Icon className="w-3 h-3 text-blue-300" />
                  </div>
                </div>
                <p className="text-white font-medium leading-relaxed">
                  {currentTranslation.translatedText}
                </p>
              </div>
            )}
            
            {/* Quality Metrics */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-3">
                <span>
                  Quality: <span className={`
                    ${translationQuality === 'excellent' ? 'text-green-400' : ''}
                    ${translationQuality === 'good' ? 'text-blue-400' : ''}
                    ${translationQuality === 'fair' ? 'text-yellow-400' : ''}
                    ${translationQuality === 'poor' ? 'text-red-400' : ''}
                  `}>
                    {translationQuality}
                  </span>
                </span>
                <span>
                  Accuracy: {Math.round(currentTranslation.qualityMetrics.accuracy * 100)}%
                </span>
              </div>
              <span className="text-gray-500">
                {new Date(currentTranslation.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ) : (
          /* Waiting for Translation */
          <div className="text-center py-6">
            <div className="inline-flex items-center space-x-2 text-gray-400">
              <div className="animate-spin w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full"></div>
              <span>Listening for speech...</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button to Show/Hide */}
      {!showTranslationOverlay && isTranslationActive && (
        <button
          onClick={() => setShowTranslationOverlay(true)}
          className="fixed bottom-24 right-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 pointer-events-auto"
          title="Show Translation Overlay"
        >
          <LanguagesIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}