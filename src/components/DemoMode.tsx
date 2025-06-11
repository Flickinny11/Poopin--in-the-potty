/**
 * Demo Mode Component
 * Provides try-before-signup functionality with pre-recorded examples
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  LanguagesIcon, 
  MicIcon,
  VolumeXIcon,
  Volume2Icon,
  SettingsIcon,
  XIcon,
} from 'lucide-react';
import { useTranslationStore } from '@/stores/translationStore';

interface DemoCall {
  id: string;
  title: string;
  description: string;
  participants: {
    name: string;
    language: string;
    flag: string;
    avatar?: string;
  }[];
  conversation: {
    speaker: string;
    originalText: string;
    originalLanguage: string;
    translatedText: string;
    translatedLanguage: string;
    audioUrl?: string;
    timestamp: number;
  }[];
  duration: number; // seconds
}

interface DemoModeProps {
  className?: string;
  onClose?: () => void;
}

// Pre-recorded demo conversations
const DEMO_CALLS: DemoCall[] = [
  {
    id: 'business-meeting',
    title: 'Business Meeting (English ↔ Spanish)',
    description: 'Experience a professional meeting with real-time translation',
    participants: [
      { name: 'Sarah', language: 'English', flag: '🇺🇸' },
      { name: 'Carlos', language: 'Spanish', flag: '🇪🇸' },
    ],
    conversation: [
      {
        speaker: 'Sarah',
        originalText: 'Good morning Carlos! Thank you for joining our meeting today.',
        originalLanguage: 'en',
        translatedText: '¡Buenos días Carlos! Gracias por unirte a nuestra reunión hoy.',
        translatedLanguage: 'es',
        timestamp: 1000,
      },
      {
        speaker: 'Carlos',
        originalText: 'Buenos días Sarah. Es un placer estar aquí.',
        originalLanguage: 'es',
        translatedText: 'Good morning Sarah. It\'s a pleasure to be here.',
        translatedLanguage: 'en',
        timestamp: 4000,
      },
      {
        speaker: 'Sarah',
        originalText: 'Let\'s discuss our Q4 marketing strategy. What are your thoughts on the new campaign?',
        originalLanguage: 'en',
        translatedText: 'Hablemos de nuestra estrategia de marketing para el Q4. ¿Cuáles son tus pensamientos sobre la nueva campaña?',
        translatedLanguage: 'es',
        timestamp: 7000,
      },
      {
        speaker: 'Carlos',
        originalText: 'Creo que la campaña tiene un gran potencial. Los datos muestran una respuesta muy positiva del mercado.',
        originalLanguage: 'es',
        translatedText: 'I think the campaign has great potential. The data shows a very positive market response.',
        translatedLanguage: 'en',
        timestamp: 12000,
      },
    ],
    duration: 30,
  },
  {
    id: 'casual-chat',
    title: 'Casual Chat (English ↔ French)',
    description: 'See how natural conversations flow with translation',
    participants: [
      { name: 'Mike', language: 'English', flag: '🇺🇸' },
      { name: 'Marie', language: 'French', flag: '🇫🇷' },
    ],
    conversation: [
      {
        speaker: 'Mike',
        originalText: 'Hi Marie! How was your weekend in Paris?',
        originalLanguage: 'en',
        translatedText: 'Salut Marie ! Comment s\'est passé ton week-end à Paris ?',
        translatedLanguage: 'fr',
        timestamp: 1000,
      },
      {
        speaker: 'Marie',
        originalText: 'C\'était fantastique ! J\'ai visité le Louvre et j\'ai mangé dans un restaurant incroyable.',
        originalLanguage: 'fr',
        translatedText: 'It was fantastic! I visited the Louvre and ate at an incredible restaurant.',
        translatedLanguage: 'en',
        timestamp: 4500,
      },
      {
        speaker: 'Mike',
        originalText: 'That sounds amazing! I\'d love to visit Paris someday. What was your favorite part?',
        originalLanguage: 'en',
        translatedText: 'Ça sonne incroyable ! J\'aimerais visiter Paris un jour. Quelle était ta partie préférée ?',
        translatedLanguage: 'fr',
        timestamp: 8000,
      },
    ],
    duration: 20,
  },
];

export default function DemoMode({ className = '', onClose }: DemoModeProps) {
  const [selectedDemo, setSelectedDemo] = useState<DemoCall | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentMessage, setCurrentMessage] = useState<number>(-1);
  const [showTranslation, setShowTranslation] = useState(true);
  const [volume, setVolume] = useState(0.8);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { availableLanguages } = useTranslationStore();

  // Start demo playback
  const startDemo = (demo: DemoCall) => {
    setSelectedDemo(demo);
    setCurrentTime(0);
    setCurrentMessage(-1);
    setIsPlaying(true);
  };

  // Play/pause demo
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Stop demo
  const stopDemo = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentMessage(-1);
    setSelectedDemo(null);
  };

  // Update demo time and messages
  useEffect(() => {
    if (!isPlaying || !selectedDemo) return;

    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 100; // Update every 100ms
        
        // Check if we should show a new message
        const nextMessage = selectedDemo.conversation.findIndex(
          msg => msg.timestamp <= newTime && msg.timestamp > prev
        );
        
        if (nextMessage !== -1) {
          setCurrentMessage(nextMessage);
        }
        
        // Stop if demo is complete
        if (newTime >= selectedDemo.duration * 1000) {
          setIsPlaying(false);
          return selectedDemo.duration * 1000;
        }
        
        return newTime;
      });
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, selectedDemo]);

  const getLanguageFlag = (code: string) => {
    const lang = availableLanguages.find(l => l.code === code);
    return lang ? lang.flag : '🌐';
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (!selectedDemo) {
    return (
      <div className={`bg-white rounded-lg shadow-xl p-6 max-w-2xl mx-auto ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <PlayIcon className="w-6 h-6 mr-2 text-blue-500" />
            Try VidLiSync Demo
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <p className="text-gray-600 mb-6">
          Experience real-time translation without signing up. Choose a demo conversation to see how VidLiSync works.
        </p>
        
        <div className="space-y-4">
          {DEMO_CALLS.map((demo) => (
            <div
              key={demo.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors duration-200 cursor-pointer"
              onClick={() => startDemo(demo)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{demo.title}</h3>
                <div className="flex items-center space-x-1">
                  {demo.participants.map((participant, index) => (
                    <span key={index} className="text-lg" title={`${participant.name} (${participant.language})`}>
                      {participant.flag}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-3">{demo.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Duration: {demo.duration}s</span>
                  <span>{demo.conversation.length} messages</span>
                </div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Start Demo
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What you&apos;ll see:</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Real-time speech translation between languages</li>
            <li>• Original and translated text display</li>
            <li>• Natural conversation flow preservation</li>
            <li>• Voice synthesis in different languages</li>
          </ul>
        </div>
      </div>
    );
  }

  const currentMsg = currentMessage >= 0 ? selectedDemo.conversation[currentMessage] : null;
  const progress = (currentTime / (selectedDemo.duration * 1000)) * 100;

  return (
    <div className={`bg-gray-900 rounded-lg shadow-xl overflow-hidden max-w-4xl mx-auto ${className}`}>
      {/* Demo Video Area */}
      <div className="relative bg-black aspect-video flex items-center justify-center">
        {/* Simulated Video Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        
        {/* Participants */}
        <div className="relative z-10 flex items-center justify-center space-x-8">
          {selectedDemo.participants.map((participant, index) => (
            <div key={index} className="text-center">
              <div className={`
                w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-2
                ${currentMsg?.speaker === participant.name ? 'ring-4 ring-blue-500 bg-blue-100' : 'bg-gray-600'}
              `}>
                {participant.avatar || participant.flag}
              </div>
              <p className="text-white font-medium">{participant.name}</p>
              <p className="text-gray-300 text-sm">{participant.language}</p>
            </div>
          ))}
        </div>

        {/* Translation Overlay */}
        {showTranslation && currentMsg && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="bg-black bg-opacity-80 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase">
                  {getLanguageFlag(currentMsg.originalLanguage)} Original
                </span>
                <LanguagesIcon className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-white text-sm mb-3">{currentMsg.originalText}</p>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-300 uppercase">
                  {getLanguageFlag(currentMsg.translatedLanguage)} Translation
                </span>
                <Volume2Icon className="w-4 h-4 text-blue-300" />
              </div>
              <p className="text-white font-medium">{currentMsg.translatedText}</p>
            </div>
          </div>
        )}

        {/* Demo Controls Overlay */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-black bg-opacity-50 rounded-lg p-2 flex items-center space-x-2">
            <span className="text-white text-sm font-medium">DEMO</span>
            <PlayIcon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(selectedDemo.duration * 1000)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={togglePlayback}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors duration-200"
          >
            {isPlaying ? (
              <PauseIcon className="w-6 h-6" />
            ) : (
              <PlayIcon className="w-6 h-6" />
            )}
          </button>
          
          <button
            onClick={stopDemo}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Stop Demo
          </button>
        </div>

        {/* Settings */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showTranslation}
                onChange={(e) => setShowTranslation(e.target.checked)}
                className="rounded"
              />
              <span>Show Translation</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <VolumeXIcon className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20"
            />
            <Volume2Icon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Demo Info */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{selectedDemo.title}</h3>
            <p className="text-gray-600 text-sm">{selectedDemo.description}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Ready to try it yourself?</p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              Sign Up Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}