/**
 * Idle View - Initial state for VS Friends
 */

'use client';

import React, { useState } from 'react';
import { Users, Smartphone, Headphones, Globe } from 'lucide-react';
import { useVSFriendsStore } from '../stores/vsFriendsStore';
import { connectionService } from '../services/connectionService';
import { VSFriendsConnectionService } from '../services/connectionService';
import { InstructionsModal } from './InstructionsModal';

export function IdleView() {
  const { startFriendDiscovery } = useVSFriendsStore();
  const [showInstructions, setShowInstructions] = useState(false);

  const handleStartDiscovery = async () => {
    try {
      await connectionService.startDiscovery();
      startFriendDiscovery();
    } catch (error) {
      console.error('Failed to start discovery:', error);
    }
  };

  const supportsProximity = VSFriendsConnectionService.supportsProximityDetection();

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">VS Friends</h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-md">
            Tap phones to start instant translated conversations
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl">
          <div className="text-center">
            <div className="bg-white/10 rounded-full p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
              <Smartphone className="w-8 h-8" />
            </div>
            <p className="text-sm text-white/80">Tap to Connect</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-full p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
              <Headphones className="w-8 h-8" />
            </div>
            <p className="text-sm text-white/80">Earbuds First</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-full p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
              <Globe className="w-8 h-8" />
            </div>
            <p className="text-sm text-white/80">50+ Languages</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-full p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-sm text-white/80">2-4 People</p>
          </div>
        </div>

        {/* Main Action Button */}
        <button
          onClick={handleStartDiscovery}
          className="group relative"
          aria-label="Start VS Friends conversation"
        >
          <div className="bg-white/20 rounded-full p-8 mb-6 transition-all duration-300 group-hover:bg-white/30 group-hover:scale-105">
            <div className="bg-white rounded-full p-12 shadow-2xl">
              <Users className="w-16 h-16 text-blue-600" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Add Friends</h2>
            <p className="text-white/70">
              {supportsProximity ? 'Tap phones together' : 'Share connection link'}
            </p>
          </div>
        </button>

        {/* Instructions Link */}
        <button
          onClick={() => setShowInstructions(true)}
          className="text-white/60 hover:text-white/80 transition-colors duration-200 underline"
        >
          How it works
        </button>

        {/* Device Compatibility Notice */}
        {!supportsProximity && (
          <div className="mt-8 p-4 bg-orange-500/20 rounded-lg border border-orange-400/30 max-w-md">
            <p className="text-sm text-orange-100">
              <strong>Note:</strong> Your device doesn&apos;t support tap-to-connect. 
              You&apos;ll share a connection link instead.
            </p>
          </div>
        )}
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <InstructionsModal onClose={() => setShowInstructions(false)} />
      )}
    </>
  );
}