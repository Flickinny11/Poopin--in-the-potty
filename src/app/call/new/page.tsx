/**
 * Create New Call Page
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { 
  VideoIcon, 
  UserIcon, 
  ClockIcon,
  CopyIcon,
  CheckIcon,
  CalendarIcon,
  Settings2Icon,
  UsersIcon,
  ShareIcon,
} from 'lucide-react';

interface CallSettings {
  name: string;
  maxParticipants: number;
  enableRecording: boolean;
  enableChat: boolean;
  startAudioOff: boolean;
  startVideoOff: boolean;
  isScheduled: boolean;
  scheduledTime?: Date;
}

export default function CreateCallPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ url: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<CallSettings>({
    name: '',
    maxParticipants: 10,
    enableRecording: false,
    enableChat: true,
    startAudioOff: false,
    startVideoOff: false,
    isScheduled: false,
  });

  const handleCreateCall = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setIsCreating(true);
    
    try {
      // Create room via our backend API
      const response = await fetch('/api/calls/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: settings.name || `${user.user_metadata?.full_name || user.email}'s Call`,
          maxParticipants: settings.maxParticipants,
          enableRecording: settings.enableRecording,
          enableChat: settings.enableChat,
          startAudioOff: settings.startAudioOff,
          startVideoOff: settings.startVideoOff,
          scheduledTime: settings.scheduledTime,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create call');
      }

      const data = await response.json();
      setCreatedRoom({ url: data.url, id: data.name });
      
    } catch (error) {
      console.error('Error creating call:', error);
      alert('Failed to create call. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (createdRoom) {
      await navigator.clipboard.writeText(createdRoom.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinCall = () => {
    if (createdRoom) {
      router.push(`/call?room=${createdRoom.id}`);
    }
  };

  const handleShareCall = () => {
    if (createdRoom && typeof navigator !== 'undefined' && 'share' in navigator) {
      navigator.share({
        title: 'Join my video call',
        text: 'Join me for a video call on VidLiSync',
        url: createdRoom.url,
      });
    }
  };

  // Show success state after room creation
  if (createdRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Call Created!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Share this link with others to invite them to join
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={createdRoom.url}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    title="Copy link"
                  >
                    {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call ID
                </label>
                <p className="text-lg font-mono bg-gray-100 p-3 rounded-md text-center">
                  {createdRoom.id}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleJoinCall}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <VideoIcon className="-ml-1 mr-3 h-5 w-5" />
              Join Call Now
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleShareCall}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ShareIcon className="-ml-1 mr-3 h-5 w-5" />
                Share Call
              </button>
            )}

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show creation form
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <VideoIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create New Call
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your video call preferences and get a shareable link
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            {/* Basic Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Settings2Icon className="mr-2 h-5 w-5" />
                Call Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="callName" className="block text-sm font-medium text-gray-700">
                    Call Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="callName"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter a name for your call"
                  />
                </div>

                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
                    Maximum Participants
                  </label>
                  <select
                    id="maxParticipants"
                    value={settings.maxParticipants}
                    onChange={(e) => setSettings({ ...settings, maxParticipants: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={2}>2 participants</option>
                    <option value={5}>5 participants</option>
                    <option value={10}>10 participants</option>
                    <option value={25}>25 participants</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Feature Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Features
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enableChat}
                    onChange={(e) => setSettings({ ...settings, enableChat: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Enable chat during call</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enableRecording}
                    onChange={(e) => setSettings({ ...settings, enableRecording: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Allow call recording</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.startAudioOff}
                    onChange={(e) => setSettings({ ...settings, startAudioOff: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Start with microphone muted</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.startVideoOff}
                    onChange={(e) => setSettings({ ...settings, startVideoOff: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Start with camera off</span>
                </label>
              </div>
            </div>

            {/* Scheduling (Future Feature) */}
            <div className="border-t pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.isScheduled}
                  onChange={(e) => setSettings({ ...settings, isScheduled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled
                />
                <span className="ml-3 text-sm text-gray-400">
                  <CalendarIcon className="inline mr-1 h-4 w-4" />
                  Schedule for later (Coming Soon)
                </span>
              </label>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleCreateCall}
              disabled={isCreating}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating Call...
                </>
              ) : (
                <>
                  <VideoIcon className="-ml-1 mr-3 h-5 w-5" />
                  Create Call
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}