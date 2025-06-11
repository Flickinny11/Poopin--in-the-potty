/**
 * Professional HD Video Call Interface Component
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCallStore } from '@/stores/callStore';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import { useCallQualityMonitor } from '@/hooks/useCallQualityMonitor';
import { 
  MicIcon, 
  MicOffIcon, 
  VideoIcon, 
  VideoOffIcon, 
  PhoneOffIcon,
  ScreenShareIcon,
  CircleIcon,
  UsersIcon,
  MessageSquareIcon,
  SettingsIcon,
  MaximizeIcon,
  MinimizeIcon,
  VolumeXIcon,
  Volume2Icon,
  WifiIcon,
  WifiOffIcon,
} from 'lucide-react';

interface VideoCallInterfaceProps {
  roomUrl: string;
  userName: string;
  token?: string;
  onLeave?: () => void;
}

export default function VideoCallInterface({ 
  roomUrl, 
  userName, 
  token, 
  onLeave 
}: VideoCallInterfaceProps) {
  const {
    isInCall,
    isConnecting,
    connectionState,
    localAudio,
    localVideo,
    localScreen,
    participants,
    participantCount,
    networkQuality,
    isRecording,
    showParticipants,
    showChat,
    isFullscreen,
    error,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleRecording,
    setShowParticipants,
    setShowChat,
    setFullscreen,
    clearError,
  } = useCallStore();

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor call quality
  useCallQualityMonitor();

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setIsControlsVisible(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
  }, []);

  // Join call on mount
  useEffect(() => {
    if (!isInCall && !isConnecting) {
      joinCall(roomUrl, userName, token);
    }
  }, [roomUrl, userName, token, isInCall, isConnecting, joinCall]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger shortcuts when typing
      }

      const isMod = e.ctrlKey || e.metaKey;
      
      if (isMod && e.key === 'd') {
        e.preventDefault();
        toggleAudio();
      } else if (isMod && e.key === 'e') {
        e.preventDefault();
        toggleVideo();
      } else if (isMod && e.key === 's') {
        e.preventDefault();
        toggleScreenShare();
      } else if (isMod && e.key === 'k') {
        e.preventDefault();
        setShowShortcuts(true);
      } else if (e.key === 'Escape') {
        if (showShortcuts) {
          setShowShortcuts(false);
        } else if (isFullscreen) {
          setFullscreen(false);
        }
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setShowParticipants(!showParticipants);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setShowChat(!showChat);
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
      } else if (e.key === ' ' && !localAudio) {
        e.preventDefault();
        // Push to talk (implement later)
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localAudio, localVideo, isFullscreen, showParticipants, showChat, showShortcuts, toggleAudio, toggleVideo, toggleScreenShare, setFullscreen, setShowParticipants, setShowChat]);

  // Mouse movement handler for auto-hiding controls
  useEffect(() => {
    const handleMouseMove = () => resetControlsTimeout();
    const container = videoContainerRef.current;
    
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      resetControlsTimeout();
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // Handle leave call
  const handleLeave = () => {
    leaveCall();
    onLeave?.();
  };

  // Error display
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
          <div className="text-red-500 mb-4">
            <WifiOffIcon size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={clearError}
            className="btn-primary w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Connecting state
  if (isConnecting || connectionState === 'connecting') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Connecting to call...</h2>
          <p className="text-gray-300">Setting up HD video connection</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={videoContainerRef}
      className={`relative bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'}`}
    >
      {/* Daily.co video container */}
      <div 
        id="daily-video-container"
        className="absolute inset-0"
        style={{ background: '#000' }}
      />

      {/* Network quality indicator */}
      <div className="absolute top-4 left-4 z-20">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
          networkQuality === 'good' ? 'bg-green-500 text-white' :
          networkQuality === 'warning' ? 'bg-yellow-500 text-black' :
          'bg-red-500 text-white'
        }`}>
          {networkQuality === 'poor' ? <WifiOffIcon size={16} /> : <WifiIcon size={16} />}
          <span>
            {networkQuality === 'good' ? 'HD' :
             networkQuality === 'warning' ? 'Good' : 'Poor'}
          </span>
        </div>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center space-x-2 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Recording</span>
          </div>
        </div>
      )}

      {/* Participant count */}
      <div className="absolute top-16 right-4 z-20">
        <div className="flex items-center space-x-2 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
          <UsersIcon size={16} />
          <span>{participantCount} participants</span>
        </div>
      </div>

      {/* Call controls */}
      <div className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${
        isControlsVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-gradient-to-t from-black to-transparent pt-16 pb-6">
          <div className="flex items-center justify-center space-x-4">
            {/* Audio toggle */}
            <button
              onClick={toggleAudio}
              className={`relative p-4 rounded-full transition-colors ${
                localAudio 
                  ? 'bg-gray-600 hover:bg-gray-500' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              title={`${localAudio ? 'Mute' : 'Unmute'} microphone (Cmd/Ctrl+D)`}
              aria-label={`${localAudio ? 'Mute' : 'Unmute'} microphone`}
            >
              {localAudio ? (
                <MicIcon size={24} className="text-white" />
              ) : (
                <MicOffIcon size={24} className="text-white" />
              )}
            </button>

            {/* Video toggle */}
            <button
              onClick={toggleVideo}
              className={`relative p-4 rounded-full transition-colors ${
                localVideo 
                  ? 'bg-gray-600 hover:bg-gray-500' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              title={`${localVideo ? 'Turn off' : 'Turn on'} camera (Cmd/Ctrl+E)`}
              aria-label={`${localVideo ? 'Turn off' : 'Turn on'} camera`}
            >
              {localVideo ? (
                <VideoIcon size={24} className="text-white" />
              ) : (
                <VideoOffIcon size={24} className="text-white" />
              )}
            </button>

            {/* Screen share */}
            <button
              onClick={toggleScreenShare}
              className={`relative p-4 rounded-full transition-colors ${
                localScreen 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title={`${localScreen ? 'Stop' : 'Start'} screen sharing (Cmd/Ctrl+S)`}
              aria-label={`${localScreen ? 'Stop' : 'Start'} screen sharing`}
            >
              <ScreenShareIcon size={24} className="text-white" />
            </button>

            {/* Record */}
            <button
              onClick={toggleRecording}
              className={`relative p-4 rounded-full transition-colors ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title={`${isRecording ? 'Stop' : 'Start'} recording`}
              aria-label={`${isRecording ? 'Stop' : 'Start'} recording`}
            >
              <CircleIcon size={24} className="text-white" />
            </button>

            {/* Participants */}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`relative p-4 rounded-full transition-colors ${
                showParticipants 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title="Show participants"
              aria-label="Show participants"
            >
              <UsersIcon size={24} className="text-white" />
            </button>

            {/* Chat */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`relative p-4 rounded-full transition-colors ${
                showChat 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title="Open chat"
              aria-label="Open chat"
            >
              <MessageSquareIcon size={24} className="text-white" />
            </button>

            {/* Help / Shortcuts */}
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
              title="Show keyboard shortcuts (Cmd/Ctrl+K)"
              aria-label="Show keyboard shortcuts"
            >
              <SettingsIcon size={24} className="text-white" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setFullscreen(!isFullscreen)}
              className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
              title={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen (Esc to exit)`}
              aria-label={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen`}
            >
              {isFullscreen ? (
                <MinimizeIcon size={24} className="text-white" />
              ) : (
                <MaximizeIcon size={24} className="text-white" />
              )}
            </button>

            {/* Leave call */}
            <button
              onClick={handleLeave}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              title="Leave call"
              aria-label="Leave call"
            >
              <PhoneOffIcon size={24} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Participants sidebar */}
      {showParticipants && (
        <div className="absolute top-0 right-0 w-80 h-full bg-white bg-opacity-95 backdrop-blur-sm z-20 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Participants ({participantCount})
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close participants panel"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {Array.from(participants.values()).map((participant) => (
                <div key={participant.session_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {participant.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {participant.user_name}
                        {participant.local && ' (You)'}
                        {participant.owner && ' (Host)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {!participant.audio && <MicOffIcon size={16} className="text-red-500" />}
                    {!participant.video && <VideoOffIcon size={16} className="text-red-500" />}
                    {participant.screen && <ScreenShareIcon size={16} className="text-blue-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}