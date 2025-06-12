/**
 * Discovering View - Shows while scanning for nearby devices
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Smartphone, Wifi, Users } from 'lucide-react';
import { useVSFriendsStore } from '../stores/vsFriendsStore';
import { connectionService } from '../services/connectionService';
import { VSFriend } from '../types';

export function DiscoveringView() {
  const { 
    conversationState, 
    isDiscovering, 
    connectToFriend,
    participants 
  } = useVSFriendsStore();
  
  const [nearbyDevices, setNearbyDevices] = useState<VSFriend[]>([]);
  const [connectionStep, setConnectionStep] = useState<string>('Scanning for nearby devices...');

  useEffect(() => {
    const handleDeviceDiscovered = (device: VSFriend) => {
      setNearbyDevices(prev => {
        if (prev.find(d => d.id === device.id)) return prev;
        return [...prev, device];
      });
      setConnectionStep('Devices found! Tap to connect');
    };

    const handleConnectionEstablished = () => {
      setConnectionStep('Connected! Starting conversation...');
    };

    connectionService.on('device_discovered', handleDeviceDiscovered);
    connectionService.on('connection_established', handleConnectionEstablished);

    return () => {
      connectionService.off('device_discovered', handleDeviceDiscovered);
      connectionService.off('connection_established', handleConnectionEstablished);
    };
  }, []);

  const handleConnectToDevice = async (device: VSFriend) => {
    setConnectionStep(`Connecting to ${device.name}...`);
    await connectToFriend(device);
  };

  const renderScanningAnimation = () => (
    <div className="relative">
      <div className="w-32 h-32 border-4 border-white/20 rounded-full flex items-center justify-center">
        <Smartphone className="w-16 h-16 text-white" />
      </div>
      
      {/* Animated rings */}
      <div className="absolute inset-0">
        <div className="w-32 h-32 border-2 border-white/40 rounded-full animate-ping" />
      </div>
      <div className="absolute inset-0 animation-delay-1000">
        <div className="w-32 h-32 border-2 border-white/30 rounded-full animate-ping" />
      </div>
      <div className="absolute inset-0 animation-delay-2000">
        <div className="w-32 h-32 border-2 border-white/20 rounded-full animate-ping" />
      </div>
    </div>
  );

  if (conversationState === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-white" />
          <h2 className="text-2xl font-semibold mb-4">Connecting...</h2>
          <p className="text-white/80">{connectionStep}</p>
          
          {participants.length > 0 && (
            <div className="mt-8 p-4 bg-white/10 rounded-lg">
              <p className="text-sm text-white/80 mb-2">Connected participants:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {participants.map(participant => (
                  <span 
                    key={participant.id}
                    className="bg-white/20 px-3 py-1 rounded-full text-sm"
                  >
                    {participant.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Looking for Friends</h2>
        <p className="text-xl text-white/80 mb-6">{connectionStep}</p>
        
        {/* Scanning Animation */}
        <div className="mb-8">
          {renderScanningAnimation()}
        </div>

        {/* Instructions */}
        <div className="bg-white/10 rounded-lg p-6 max-w-md mb-8">
          <h3 className="font-semibold mb-3 flex items-center justify-center gap-2">
            <Wifi className="w-5 h-5" />
            How to Connect
          </h3>
          <div className="space-y-2 text-sm text-white/80">
            <p>• Make sure your friend opens VS Friends too</p>
            <p>• Hold phones close together (within 6 inches)</p>
            <p>• Tap when you see their device appear</p>
            <p>• Put on earbuds for the best experience</p>
          </div>
        </div>
      </div>

      {/* Nearby Devices */}
      {nearbyDevices.length > 0 && (
        <div className="w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Nearby Devices ({nearbyDevices.length})
          </h3>
          
          <div className="space-y-3">
            {nearbyDevices.map(device => (
              <button
                key={device.id}
                onClick={() => handleConnectToDevice(device)}
                className="w-full bg-white/10 hover:bg-white/20 transition-colors duration-200 rounded-lg p-4 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-white/60">{device.deviceName}</p>
                    <p className="text-xs text-white/50">Language: {device.language.toUpperCase()}</p>
                  </div>
                  <div className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-colors">
                    <Smartphone className="w-5 h-5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Button */}
      <button
        onClick={() => {
          connectionService.stopDiscovery();
          useVSFriendsStore.getState().resetState();
        }}
        className="mt-8 text-white/60 hover:text-white/80 transition-colors duration-200 underline"
      >
        Cancel
      </button>
    </div>
  );
}