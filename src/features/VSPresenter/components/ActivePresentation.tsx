/**
 * Active Presentation Component - Live presentation dashboard
 * Professional presenter interface with real-time controls
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useVSPresenterStore } from '../stores/vsPresenterStore';
import { useCallStore } from '@/stores/callStore';
import VideoCallInterface from '@/components/VideoCallInterface';
import { 
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  CircleIcon,
  StopCircleIcon,
  PhoneOffIcon,
  UsersIcon,
  ShareIcon,
  QrCodeIcon,
  HandIcon,
  VolumeXIcon,
  Volume2Icon,
  BarChart3Icon,
  DollarSignIcon
} from 'lucide-react';

export const ActivePresentation: React.FC = () => {
  const {
    session,
    participants,
    raisedHands,
    mutedParticipants,
    analytics,
    costEstimate,
    showParticipantList,
    showLanguageDistribution,
    showCostEstimate,
    muteParticipant,
    unmuteParticipant,
    muteAllParticipants,
    unmuteAllParticipants,
    allowParticipantToSpeak,
    endPresentation,
    toggleParticipantList,
    toggleLanguageDistribution,
    toggleCostEstimate,
    updateAnalytics,
    calculateCost
  } = useVSPresenterStore();

  const {
    isInCall,
    localAudio,
    localVideo,
    toggleAudio,
    toggleVideo,
    toggleRecording,
    isRecording
  } = useCallStore();

  const [allMuted, setAllMuted] = useState(false);

  // Update analytics and cost periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateAnalytics();
      calculateCost();
    }, 5000);

    return () => clearInterval(interval);
  }, [updateAnalytics, calculateCost]);

  const handleToggleAllMute = () => {
    if (allMuted) {
      unmuteAllParticipants();
    } else {
      muteAllParticipants();
    }
    setAllMuted(!allMuted);
  };

  const handleParticipantAction = (participantId: string, action: string) => {
    switch (action) {
      case 'mute':
        muteParticipant(participantId);
        break;
      case 'unmute':
        unmuteParticipant(participantId);
        break;
      case 'allow-speak':
        allowParticipantToSpeak(participantId);
        break;
    }
  };

  const copyJoinLink = () => {
    if (session?.roomCode) {
      const joinLink = `${window.location.origin}/presentation/join?code=${session.roomCode}`;
      navigator.clipboard.writeText(joinLink);
      // TODO: Show success notification
    }
  };

  const showQRCode = () => {
    // TODO: Implement QR code modal
    console.log('Show QR code for:', session?.roomCode);
  };

  if (!session || !isInCall) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Connecting to presentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-semibold text-lg">Live Presentation</span>
            </div>
            <span className="text-gray-400">Room: {session.roomCode}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Quick Stats */}
            <div className="text-white text-sm">
              <span>{participants.length} participants</span>
            </div>
            <div className="text-white text-sm">
              <span>${costEstimate.currentCost.toFixed(2)} cost</span>
            </div>
          </div>
        </div>

        {/* Video Call Interface */}
        <div className="flex-1 relative">
          {session.roomCode && (
            <VideoCallInterface
              roomUrl={`https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN}.daily.co/${session.roomCode}`}
              userName="Presenter"
              onLeave={endPresentation}
            />
          )}

          {/* Presenter Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-4 flex items-center space-x-4">
              {/* Audio Control */}
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-xl transition-all ${
                  localAudio 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {localAudio ? <MicIcon className="w-5 h-5" /> : <MicOffIcon className="w-5 h-5" />}
              </button>

              {/* Video Control */}
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-xl transition-all ${
                  localVideo 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {localVideo ? <VideoIcon className="w-5 h-5" /> : <VideoOffIcon className="w-5 h-5" />}
              </button>

              {/* Mute All */}
              <button
                onClick={handleToggleAllMute}
                className="p-3 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition-all"
              >
                {allMuted ? <Volume2Icon className="w-5 h-5" /> : <VolumeXIcon className="w-5 h-5" />}
              </button>

              {/* Recording */}
              <button
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-all ${
                  isRecording 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {isRecording ? <StopCircleIcon className="w-5 h-5" /> : <CircleIcon className="w-5 h-5" />}
              </button>

              {/* End Presentation */}
              <button
                onClick={endPresentation}
                className="p-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all"
              >
                <PhoneOffIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Panel */}
        {showLanguageDistribution && (
          <div className="bg-gray-800 p-6 border-t border-gray-700">
            <h3 className="text-white font-semibold mb-4">Language Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analytics.languageDistribution.map((lang) => (
                <div key={lang.language} className="bg-gray-700 rounded-lg p-3">
                  <div className="text-white font-medium">{lang.language.toUpperCase()}</div>
                  <div className="text-gray-300 text-sm">{lang.count} participants</div>
                  <div className="text-purple-400 text-sm">{lang.percentage.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Estimate Panel */}
        {showCostEstimate && (
          <div className="bg-gray-800 p-6 border-t border-gray-700">
            <h3 className="text-white font-semibold mb-4">Cost Estimate</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-gray-300 text-sm">Current Cost</div>
                <div className="text-white font-bold">${costEstimate.currentCost.toFixed(2)}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-gray-300 text-sm">Per Minute</div>
                <div className="text-white font-bold">${costEstimate.estimatedCostPerMinute.toFixed(3)}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-gray-300 text-sm">Participants</div>
                <div className="text-white font-bold">{costEstimate.participantCount}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-gray-300 text-sm">Languages</div>
                <div className="text-white font-bold">{costEstimate.languageCount}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Participant List */}
      {showParticipantList && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold">Participants ({participants.length})</h2>
            
            {/* Quick Actions */}
            <div className="mt-4 space-y-2">
              <button 
                onClick={copyJoinLink}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
              >
                <ShareIcon className="w-4 h-4" />
                <span>Share Join Link</span>
              </button>
              <button 
                onClick={showQRCode}
                className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center space-x-2"
              >
                <QrCodeIcon className="w-4 h-4" />
                <span>Show QR Code</span>
              </button>
            </div>
          </div>

          {/* Participant List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {participants.map((participant) => (
              <div 
                key={participant.id}
                className={`p-3 rounded-lg ${
                  participant.isPresenter ? 'bg-purple-600/20 border border-purple-500' : 'bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      participant.isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-white text-sm font-medium">
                      {participant.name}
                      {participant.isPresenter && ' (Presenter)'}
                    </span>
                  </div>
                  
                  {raisedHands.has(participant.id) && (
                    <HandIcon className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-gray-400 text-xs">{participant.selectedLanguage.toUpperCase()}</span>
                  
                  {!participant.isPresenter && (
                    <div className="flex space-x-1">
                      {raisedHands.has(participant.id) && (
                        <button
                          onClick={() => handleParticipantAction(participant.id, 'allow-speak')}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          Allow
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleParticipantAction(
                          participant.id, 
                          mutedParticipants.has(participant.id) ? 'unmute' : 'mute'
                        )}
                        className={`px-2 py-1 text-xs rounded ${
                          mutedParticipants.has(participant.id)
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                      >
                        {mutedParticipants.has(participant.id) ? 'Unmute' : 'Mute'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Controls */}
          <div className="p-4 border-t border-gray-700 space-y-2">
            <button
              onClick={toggleLanguageDistribution}
              className={`w-full py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${
                showLanguageDistribution 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <BarChart3Icon className="w-4 h-4" />
              <span>Languages</span>
            </button>
            
            <button
              onClick={toggleCostEstimate}
              className={`w-full py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${
                showCostEstimate 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <DollarSignIcon className="w-4 h-4" />
              <span>Cost</span>
            </button>
          </div>
        </div>
      )}

      {/* Toggle Sidebar Button */}
      <button
        onClick={toggleParticipantList}
        className="fixed top-1/2 right-0 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-l-lg hover:bg-gray-700 transition-all"
      >
        <UsersIcon className="w-5 h-5" />
      </button>
    </div>
  );
};