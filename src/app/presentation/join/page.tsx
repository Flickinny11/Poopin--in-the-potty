/**
 * Presentation Join Page - Audience entry point
 * Allows participants to join presentations via link or QR code
 */
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { 
  UsersIcon, 
  GlobeIcon, 
  UserIcon,
  PlayIcon,
  QrCodeIcon
} from 'lucide-react';

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

interface PresentationJoinFormProps {
  onJoin: (roomCode: string, name: string, language: string) => void;
  isLoading?: boolean;
  roomCode?: string;
}

function PresentationJoinForm({ onJoin, isLoading, roomCode: initialRoomCode }: PresentationJoinFormProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [name, setName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || user.email || '');
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim() && name.trim()) {
      onJoin(roomCode.trim(), name.trim(), selectedLanguage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <UsersIcon className="mx-auto h-12 w-12 text-white" />
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Join Presentation
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Enter your details to join the multi-language presentation
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!initialRoomCode && (
              <div>
                <label htmlFor="roomCode" className="block text-sm font-medium text-white">
                  Presentation Code
                </label>
                <input
                  id="roomCode"
                  name="roomCode"
                  type="text"
                  required
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-white/30 placeholder-white/50 text-white bg-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white focus:z-10 sm:text-sm backdrop-blur-sm"
                  placeholder="Enter presentation code"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white">
                Your Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-white/30 placeholder-white/50 text-white bg-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white focus:z-10 sm:text-sm backdrop-blur-sm"
                placeholder="Enter your display name"
              />
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-white">
                Preferred Language
              </label>
              <select
                id="language"
                name="language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="mt-1 block w-full px-3 py-3 border border-white/30 text-white bg-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white backdrop-blur-sm"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="text-gray-900">
                    {lang.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-white/70">
                You&apos;ll hear the presentation translated to this language
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !roomCode.trim() || !name.trim()}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-purple-600 bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                  Joining Presentation...
                </>
              ) : (
                <>
                  <PlayIcon className="-ml-1 mr-3 h-5 w-5" />
                  Join Presentation
                </>
              )}
            </button>
          </div>
        </form>

        {!initialRoomCode && (
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/80">Or</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => {
                  // TODO: Implement QR code scanner
                  console.log('Scan QR code');
                }}
                className="inline-flex items-center px-4 py-2 border border-white/30 text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white backdrop-blur-sm transition-all"
              >
                <QrCodeIcon className="-ml-1 mr-2 h-4 w-4" />
                Scan QR Code
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-white/60">
            By joining, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}

function PresentationJoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  const [isJoining, setIsJoining] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  // Check for presentation code in URL
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setRoomCode(code.toUpperCase());
    }
  }, [searchParams]);

  const handleJoinPresentation = async (code: string, name: string, language: string) => {
    setIsJoining(true);
    
    try {
      // Validate presentation exists
      const response = await fetch(`/api/presenter/validate-room?code=${code}`);
      if (!response.ok) {
        throw new Error('Invalid presentation code');
      }
      
      const roomData = await response.json();
      
      // Store participant info and navigate to presentation interface
      const participantData = {
        roomCode: code,
        name,
        language,
        roomData
      };
      
      // Store in sessionStorage for the presentation interface
      sessionStorage.setItem('presentationParticipant', JSON.stringify(participantData));
      
      // Navigate to presentation interface
      router.push(`/presentation/room?code=${code}`);
      
    } catch (error) {
      console.error('Error joining presentation:', error);
      alert('Failed to join presentation. Please check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <PresentationJoinForm
      onJoin={handleJoinPresentation}
      isLoading={isJoining}
      roomCode={roomCode || undefined}
    />
  );
}

export default function PresentationJoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading presentation...</p>
        </div>
      </div>
    }>
      <PresentationJoinPageContent />
    </Suspense>
  );
}