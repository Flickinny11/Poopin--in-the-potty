/**
 * VS Friends Connection Service - Handles NFC/proximity detection and peer connections
 */

import { VSFriend, ConnectionInfo, AudioStream } from '../types';

export interface ConnectionEvent {
  type: 'device_discovered' | 'connection_established' | 'connection_lost' | 'audio_received';
  data: any;
}

export class VSFriendsConnectionService {
  private eventListeners: Map<string, Function[]> = new Map();
  private isScanning = false;
  private connectedPeers: Map<string, VSFriend> = new Map();
  private connectionId: string | null = null;

  // Simulate NFC/proximity detection for web (in real app, this would use WebNFC API)
  startDiscovery(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isScanning) {
        resolve();
        return;
      }

      this.isScanning = true;
      this.connectionId = `conn_${Date.now()}`;

      // Simulate device discovery
      setTimeout(() => {
        this.simulateDeviceDiscovery();
      }, 2000);

      resolve();
    });
  }

  stopDiscovery(): void {
    this.isScanning = false;
    this.connectionId = null;
  }

  // Connect to a discovered device
  async connectToPeer(friend: VSFriend): Promise<void> {
    if (this.connectedPeers.has(friend.id)) {
      return;
    }

    // Simulate connection establishment
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.connectedPeers.set(friend.id, friend);
    
    this.emit('connection_established', {
      friend,
      connectionId: this.connectionId
    });

    // Start listening for audio from this peer
    this.startAudioListener(friend.id);
  }

  // Disconnect from a peer
  disconnectFromPeer(friendId: string): void {
    if (this.connectedPeers.has(friendId)) {
      this.connectedPeers.delete(friendId);
      this.emit('connection_lost', { friendId });
    }
  }

  // Send audio to all connected peers
  broadcastAudio(audioData: Uint8Array, sourceLanguage: string): void {
    const timestamp = Date.now();
    
    this.connectedPeers.forEach((friend, peerId) => {
      if (friend.selectedLanguage !== sourceLanguage) {
        // In real implementation, this would send to peer
        console.log(`Broadcasting audio to ${friend.name} (${friend.selectedLanguage})`);
      }
    });
  }

  // Check if device supports proximity detection
  static supportsProximityDetection(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for Web NFC API (Chrome on Android)
    if ('NDEFReader' in window) {
      return true;
    }
    
    // Check for Web Bluetooth (proximity via BLE beacons)
    if ('bluetooth' in navigator) {
      return true;
    }

    // Fallback to QR codes or manual connection
    return false;
  }

  // Get connection info for sharing
  getConnectionInfo(): ConnectionInfo {
    const userLanguage = localStorage.getItem('userLanguage') || 'en';
    const deviceName = this.getDeviceName();
    
    return {
      deviceName,
      language: userLanguage,
      userId: this.getUserId(),
      sessionId: this.connectionId || ''
    };
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  // Simulate device discovery (in real app, this would use NFC/BLE)
  private simulateDeviceDiscovery(): void {
    if (!this.isScanning) return;

    const mockDevices: VSFriend[] = [
      {
        id: `device_${Date.now()}_1`,
        name: 'Maria\'s Phone',
        deviceName: 'iPhone 15 Pro',
        language: 'es',
        selectedLanguage: 'es',
        isSpeaking: false,
        isConnected: false,
        joinedAt: new Date(),
        peerID: `peer_${Date.now()}_1`,
        initials: 'MP'
      },
      {
        id: `device_${Date.now()}_2`,
        name: 'Hiroshi\'s Phone',
        deviceName: 'Galaxy S24',
        language: 'ja',
        selectedLanguage: 'ja',
        isSpeaking: false,
        isConnected: false,
        joinedAt: new Date(),
        peerID: `peer_${Date.now()}_2`,
        initials: 'HP'
      }
    ];

    // Simulate progressive discovery
    mockDevices.forEach((device, index) => {
      setTimeout(() => {
        if (this.isScanning) {
          this.emit('device_discovered', device);
        }
      }, (index + 1) * 3000);
    });
  }

  // Simulate audio reception from peers
  private startAudioListener(peerId: string): void {
    const interval = setInterval(() => {
      if (!this.connectedPeers.has(peerId)) {
        clearInterval(interval);
        return;
      }

      // Simulate random audio reception
      if (Math.random() > 0.7) {
        const audioStream: AudioStream = {
          participantId: peerId,
          audioData: new Uint8Array(1024), // Mock audio data
          timestamp: Date.now(),
          language: this.connectedPeers.get(peerId)?.language || 'en'
        };

        this.emit('audio_received', audioStream);
      }
    }, 2000);
  }

  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    
    if (/iPhone/.test(userAgent)) {
      return 'iPhone';
    } else if (/Android/.test(userAgent)) {
      return 'Android Device';
    } else if (/iPad/.test(userAgent)) {
      return 'iPad';
    }
    
    return 'Web Browser';
  }

  private getUserId(): string {
    // In real app, this would come from authentication
    return localStorage.getItem('userId') || `user_${Date.now()}`;
  }
}

// Singleton instance
export const connectionService = new VSFriendsConnectionService();