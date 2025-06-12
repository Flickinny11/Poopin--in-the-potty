/**
 * VS Friends Integration Tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { useVSFriendsStore } from '../src/features/VSFriends/stores/vsFriendsStore';
import { VSFriendsConnectionService } from '../src/features/VSFriends/services/connectionService';
import { VSFriendsAudioService } from '../src/features/VSFriends/services/audioService';

// Mock browser APIs
const mockWindow = {
  navigator: {
    mediaDevices: {
      getUserMedia: jest.fn(),
    },
    bluetooth: {},
  },
  NDEFReader: class MockNDEFReader {
    constructor() {}
    scan() { return Promise.resolve(); }
  },
  AudioContext: class MockAudioContext {
    constructor() {
      this.state = 'running';
      this.destination = {};
    }
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        start() {},
      };
    }
    createAnalyser() {
      return {
        frequencyBinCount: 1024,
        getByteFrequencyData() {},
      };
    }
    createMediaStreamSource() {
      return { connect() {} };
    }
    decodeAudioData() {
      return Promise.resolve({});
    }
    close() {
      return Promise.resolve();
    }
  },
  MediaRecorder: class MockMediaRecorder {
    constructor() {
      this.state = 'inactive';
      this.ondataavailable = null;
      this.onstart = null;
      this.onstop = null;
    }
    start() {
      this.state = 'recording';
      if (this.onstart) this.onstart();
    }
    stop() {
      this.state = 'inactive';
      if (this.onstop) this.onstop();
    }
  },
};

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: mockWindow.navigator,
  writable: true,
});

describe('VS Friends Store', () => {
  let store: ReturnType<typeof useVSFriendsStore>;

  beforeEach(() => {
    // Reset store state
    store = useVSFriendsStore.getState();
    store.resetState();
  });

  test('initializes with correct default state', () => {
    expect(store.conversationState).toBe('idle');
    expect(store.participants).toHaveLength(0);
    expect(store.isInitiator).toBe(false);
    expect(store.showMinimalUI).toBe(true);
    expect(store.currentCost).toBe(0);
  });

  test('starts friend discovery correctly', () => {
    store.startFriendDiscovery();

    expect(store.conversationState).toBe('discovering');
    expect(store.isDiscovering).toBe(true);
    expect(store.isInitiator).toBe(true);
    expect(store.connectionAttempts).toBe(0);
  });

  test('adds participants correctly', () => {
    const mockFriend = {
      id: 'friend1',
      name: 'Test Friend',
      deviceName: 'iPhone 15',
      language: 'es',
      selectedLanguage: 'es',
      isSpeaking: false,
      isConnected: false,
      joinedAt: new Date(),
      peerID: 'peer1',
      initials: 'TF'
    };

    store.addParticipant(mockFriend);

    expect(store.participants).toHaveLength(1);
    expect(store.participants[0]).toEqual(expect.objectContaining({
      id: 'friend1',
      name: 'Test Friend',
      isConnected: true
    }));
  });

  test('prevents adding duplicate participants', () => {
    const mockFriend = {
      id: 'friend1',
      name: 'Test Friend',
      deviceName: 'iPhone 15',
      language: 'es',
      selectedLanguage: 'es',
      isSpeaking: false,
      isConnected: false,
      joinedAt: new Date(),
      peerID: 'peer1',
      initials: 'TF'
    };

    store.addParticipant(mockFriend);
    store.addParticipant(mockFriend); // Try to add again

    expect(store.participants).toHaveLength(1);
  });

  test('respects maximum participant limit', () => {
    const createMockFriend = (id: string) => ({
      id,
      name: `Friend ${id}`,
      deviceName: 'Test Device',
      language: 'en',
      selectedLanguage: 'en',
      isSpeaking: false,
      isConnected: false,
      joinedAt: new Date(),
      peerID: `peer${id}`,
      initials: 'F'
    });

    // Add maximum participants (4)
    for (let i = 1; i <= 5; i++) {
      store.addParticipant(createMockFriend(i.toString()));
    }

    expect(store.participants).toHaveLength(4); // Should not exceed max
  });

  test('starts conversation correctly', () => {
    store.startConversation();

    expect(store.conversationState).toBe('active');
    expect(store.isCapturingAudio).toBe(true);
    expect(store.billingStartTime).toBeDefined();
    expect(store.currentSession).toBeDefined();
  });

  test('ends conversation and calculates cost', () => {
    // Start conversation first
    store.startConversation();
    
    // Simulate some time passing
    const originalStartTime = store.billingStartTime!;
    const newStartTime = new Date(originalStartTime.getTime() - 60000); // 1 minute ago
    store.billingStartTime = newStartTime;

    store.endConversation();

    expect(store.conversationState).toBe('ended');
    expect(store.isCapturingAudio).toBe(false);
    expect(store.currentCost).toBeGreaterThan(0);
    expect(store.currentSession?.endTime).toBeDefined();
  });

  test('calculates cost correctly', () => {
    // Mock billing start time (2 minutes ago)
    store.billingStartTime = new Date(Date.now() - 120000);
    store.participants = [
      {
        id: 'friend1',
        name: 'Friend 1',
        deviceName: 'Device 1',
        language: 'en',
        selectedLanguage: 'es',
        isSpeaking: false,
        isConnected: true,
        joinedAt: new Date(),
        peerID: 'peer1',
        initials: 'F1'
      }
    ];

    const cost = store.calculateCost();

    // Expected: 2 minutes * $0.02 per minute * 1 participant = $0.04
    expect(cost).toBeCloseTo(0.04, 2);
  });

  test('toggles minimal UI correctly', () => {
    expect(store.showMinimalUI).toBe(true);
    
    store.toggleMinimalUI();
    expect(store.showMinimalUI).toBe(false);
    
    store.toggleMinimalUI();
    expect(store.showMinimalUI).toBe(true);
  });

  test('processes audio stream correctly', () => {
    const mockAudioStream = {
      participantId: 'friend1',
      audioData: new Uint8Array([1, 2, 3, 4]),
      timestamp: Date.now(),
      language: 'es'
    };

    // Add participant first
    store.addParticipant({
      id: 'friend1',
      name: 'Friend 1',
      deviceName: 'Device 1',
      language: 'es',
      selectedLanguage: 'es',
      isSpeaking: false,
      isConnected: true,
      joinedAt: new Date(),
      peerID: 'peer1',
      initials: 'F1'
    });

    store.processAudioStream(mockAudioStream);

    expect(store.audioStreams.has('friend1')).toBe(true);
    expect(store.activeStreams.has('friend1')).toBe(true);
    
    // Check that participant is marked as speaking
    const participant = store.participants.find(p => p.id === 'friend1');
    expect(participant?.isSpeaking).toBe(true);
  });
});

describe('VS Friends Connection Service', () => {
  let connectionService: VSFriendsConnectionService;

  beforeEach(() => {
    connectionService = new VSFriendsConnectionService();
  });

  test('detects proximity support correctly', () => {
    // Mock NFC support
    (global as any).window.NDEFReader = class {};
    expect(VSFriendsConnectionService.supportsProximityDetection()).toBe(true);

    // Remove NFC, add Bluetooth
    delete (global as any).window.NDEFReader;
    expect(VSFriendsConnectionService.supportsProximityDetection()).toBe(true);

    // Remove both
    delete (global.navigator as any).bluetooth;
    expect(VSFriendsConnectionService.supportsProximityDetection()).toBe(false);
  });

  test('starts discovery without errors', async () => {
    await expect(connectionService.startDiscovery()).resolves.toBeUndefined();
  });

  test('stops discovery correctly', () => {
    connectionService.stopDiscovery();
    // Should not throw any errors
  });

  test('gets connection info correctly', () => {
    const connectionInfo = connectionService.getConnectionInfo();

    expect(connectionInfo).toHaveProperty('deviceName');
    expect(connectionInfo).toHaveProperty('language');
    expect(connectionInfo).toHaveProperty('userId');
    expect(connectionInfo).toHaveProperty('sessionId');
  });

  test('handles event listeners correctly', () => {
    const mockCallback = jest.fn();

    connectionService.on('device_discovered', mockCallback);
    connectionService.emit('device_discovered', { test: 'data' });

    expect(mockCallback).toHaveBeenCalledWith({ test: 'data' });
  });

  test('removes event listeners correctly', () => {
    const mockCallback = jest.fn();

    connectionService.on('device_discovered', mockCallback);
    connectionService.off('device_discovered', mockCallback);
    connectionService.emit('device_discovered', { test: 'data' });

    expect(mockCallback).not.toHaveBeenCalled();
  });
});

describe('VS Friends Audio Service', () => {
  let audioService: VSFriendsAudioService;

  beforeEach(() => {
    audioService = new VSFriendsAudioService();
  });

  test('initializes without errors', async () => {
    // Mock getUserMedia
    (global.navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    });

    await expect(audioService.initialize()).resolves.toBeUndefined();
  });

  test('translates audio with mock data', async () => {
    const mockRequest = {
      audioData: new Uint8Array([1, 2, 3, 4]),
      sourceLanguage: 'en',
      targetLanguage: 'es',
      participantId: 'friend1',
      useVoiceCloning: true
    };

    const result = await audioService.translateAudio(mockRequest);

    expect(result).toHaveProperty('originalText');
    expect(result).toHaveProperty('translatedText');
    expect(result).toHaveProperty('synthesizedAudio');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('processingTime');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  test('cleans up resources correctly', () => {
    audioService.cleanup();
    // Should not throw any errors
  });

  test('checks earbuds connection', () => {
    const hasEarbuds = audioService.hasEarbudsConnected();
    expect(typeof hasEarbuds).toBe('boolean');
  });
});

describe('VS Friends Integration', () => {
  test('complete conversation flow', async () => {
    const store = useVSFriendsStore.getState();
    store.resetState();

    // 1. Start discovery
    store.startFriendDiscovery();
    expect(store.conversationState).toBe('discovering');

    // 2. Add a friend
    const friend = {
      id: 'friend1',
      name: 'Maria',
      deviceName: 'iPhone 15 Pro',
      language: 'es',
      selectedLanguage: 'es',
      isSpeaking: false,
      isConnected: false,
      joinedAt: new Date(),
      peerID: 'peer1',
      initials: 'M'
    };

    store.addParticipant(friend);
    expect(store.participants).toHaveLength(1);

    // 3. Start conversation
    store.startConversation();
    expect(store.conversationState).toBe('active');
    expect(store.currentSession).toBeDefined();

    // 4. Process some audio
    const audioStream = {
      participantId: 'friend1',
      audioData: new Uint8Array([1, 2, 3, 4]),
      timestamp: Date.now(),
      language: 'es'
    };

    store.processAudioStream(audioStream);
    expect(store.activeStreams.has('friend1')).toBe(true);

    // 5. End conversation
    store.endConversation();
    expect(store.conversationState).toBe('ended');
    expect(store.currentSession?.endTime).toBeDefined();
  });

  test('billing integration works correctly', () => {
    const store = useVSFriendsStore.getState();
    store.resetState();

    // Start conversation with multiple participants
    store.startConversation();
    store.addParticipant({
      id: 'friend1',
      name: 'Friend 1',
      deviceName: 'Device 1',
      language: 'es',
      selectedLanguage: 'es',
      isSpeaking: false,
      isConnected: true,
      joinedAt: new Date(),
      peerID: 'peer1',
      initials: 'F1'
    });
    store.addParticipant({
      id: 'friend2',
      name: 'Friend 2',
      deviceName: 'Device 2',
      language: 'fr',
      selectedLanguage: 'fr',
      isSpeaking: false,
      isConnected: true,
      joinedAt: new Date(),
      peerID: 'peer2',
      initials: 'F2'
    });

    // Mock 3 minutes of conversation
    const threeMinutesAgo = new Date(Date.now() - 180000);
    store.billingStartTime = threeMinutesAgo;

    const cost = store.calculateCost();
    
    // Expected: 3 minutes * $0.02 per minute * 2 participants = $0.12
    expect(cost).toBeCloseTo(0.12, 2);
  });
});

describe('VS Friends Limits', () => {
  test('free tier limits are enforced', () => {
    // This would be tested with actual billing integration
    // For now, just verify the limits are defined correctly
    expect(typeof useVSFriendsStore.getState().config.maxParticipants).toBe('number');
    expect(useVSFriendsStore.getState().config.maxParticipants).toBeLessThanOrEqual(4);
  });
});