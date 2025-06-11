/**
 * Video Call Page - Main entry point for video calls
 */
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import VideoCallInterface from '@/components/VideoCallInterface';
import { VideoIcon, UserIcon, ClockIcon } from 'lucide-react';

interface CallJoinFormProps {
  onJoin: (roomId: string, userName: string) => void;
  isLoading?: boolean;
}

function CallJoinForm({ onJoin, isLoading }: CallJoinFormProps) {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      setUserName(user.user_metadata?.full_name || user.email || '');
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && userName.trim()) {
      onJoin(roomId.trim(), userName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <VideoIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Join Video Call
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your call details to join the conversation
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
                Call ID or Room URL
              </label>
              <input
                id="roomId"
                name="roomId"
                type="text"
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter call ID or paste room URL"
              />
            </div>
            
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                id="userName"
                name="userName"
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your display name"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !roomId.trim() || !userName.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <VideoIcon className="-ml-1 mr-3 h-5 w-5" />
                  Join Call
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or</span>
            </div>
          </div>
          
          <div className="mt-6">
            <a
              href="/call/new"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserIcon className="-ml-1 mr-2 h-4 w-4" />
              Create New Call
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoCallPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for room parameter in URL
  useEffect(() => {
    const room = searchParams.get('room');
    if (room) {
      // Convert room ID to full Daily.co URL if needed
      const fullRoomUrl = room.startsWith('https://') 
        ? room 
        : `https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN}.daily.co/${room}`;
      
      if (user) {
        setRoomUrl(fullRoomUrl);
        setUserName(user.user_metadata?.full_name || user.email || 'Guest');
      }
    }
  }, [searchParams, user]);

  const handleJoinCall = async (roomId: string, displayName: string) => {
    setIsLoading(true);
    
    try {
      // Convert room ID to full URL if needed
      let fullRoomUrl = roomId;
      if (!roomId.startsWith('https://')) {
        if (roomId.includes('.daily.co/')) {
          fullRoomUrl = `https://${roomId}`;
        } else {
          fullRoomUrl = `https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN}.daily.co/${roomId}`;
        }
      }
      
      setRoomUrl(fullRoomUrl);
      setUserName(displayName);
    } catch (error) {
      console.error('Error joining call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveCall = () => {
    setRoomUrl(null);
    setUserName('');
    router.push('/dashboard');
  };

  // Show call interface if we have a room URL
  if (roomUrl && userName) {
    return (
      <VideoCallInterface
        roomUrl={roomUrl}
        userName={userName}
        onLeave={handleLeaveCall}
      />
    );
  }

  // Show join form
  return (
    <CallJoinForm
      onJoin={handleJoinCall}
      isLoading={isLoading}
    />
  );
}

export default function VideoCallPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading call...</p>
        </div>
      </div>
    }>
      <VideoCallPageContent />
    </Suspense>
  );
}