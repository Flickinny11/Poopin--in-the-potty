/**
 * Simple integration test for Teams/Zoom platform detection
 */

import { getPlatformInfo, detectTeams, detectZoom } from '../src/lib/platform-detection';
import { createIntegrationBridge, supportsIntegration } from '../src/lib/integration-bridge';

// Mock window object for testing
const mockWindow = {
  location: { origin: 'http://localhost:3000' },
  navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  URL: global.URL,
  performance: global.performance,
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

describe('Platform Detection', () => {
  beforeEach(() => {
    // Reset window mock
    delete mockWindow.microsoftTeams;
    delete mockWindow.ZoomMtg;
    delete mockWindow.ZoomMtgEmbedded;
  });

  test('detects web platform by default', () => {
    const platformInfo = getPlatformInfo();
    expect(platformInfo.platform).toBe('web');
    expect(platformInfo.capabilities.hasAudioAccess).toBe(false); // No mediaDevices in test
  });

  test('detects Teams when SDK is present', () => {
    mockWindow.microsoftTeams = {
      version: '1.0.0',
      initialize: jest.fn(),
      getContext: jest.fn(),
    };

    expect(detectTeams()).toBe(true);
    
    const platformInfo = getPlatformInfo();
    expect(platformInfo.platform).toBe('teams');
    expect(platformInfo.capabilities.hasAudioAccess).toBe(true);
    expect(platformInfo.capabilities.hasVideoAccess).toBe(true);
  });

  test('detects Zoom when SDK is present', () => {
    mockWindow.ZoomMtg = {
      version: '2.0.0',
      init: jest.fn(),
    };

    expect(detectZoom()).toBe(true);
    
    const platformInfo = getPlatformInfo();
    expect(platformInfo.platform).toBe('zoom');
    expect(platformInfo.capabilities.hasVirtualDevice).toBe(true);
  });

  test('detects Teams from URL parameters', () => {
    Object.defineProperty(mockWindow, 'location', {
      value: { 
        origin: 'http://localhost:3000',
        search: '?teams=true'
      },
      writable: true,
    });

    expect(detectTeams()).toBe(true);
  });

  test('detects Zoom from user agent', () => {
    Object.defineProperty(mockWindow, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 Zoom/1.0' },
      writable: true,
    });

    expect(detectZoom()).toBe(true);
  });
});

describe('Integration Bridge', () => {
  test('creates web bridge by default', () => {
    const bridge = createIntegrationBridge();
    expect(bridge.platform).toBe('web');
  });

  test('creates Teams bridge when Teams is detected', () => {
    mockWindow.microsoftTeams = {
      initialize: jest.fn(),
      getContext: jest.fn(),
    };

    const bridge = createIntegrationBridge();
    expect(bridge.platform).toBe('teams');
  });

  test('creates Zoom bridge when Zoom is detected', () => {
    mockWindow.ZoomMtg = {
      init: jest.fn(),
    };

    const bridge = createIntegrationBridge();
    expect(bridge.platform).toBe('zoom');
  });

  test('supports integration for Teams and Zoom', () => {
    // Web platform doesn't support integration
    expect(supportsIntegration()).toBe(false);

    // Teams supports integration
    mockWindow.microsoftTeams = { initialize: jest.fn() };
    expect(supportsIntegration()).toBe(true);

    // Reset and test Zoom
    delete mockWindow.microsoftTeams;
    mockWindow.ZoomMtg = { init: jest.fn() };
    expect(supportsIntegration()).toBe(true);
  });
});

describe('Integration Bridge Functionality', () => {
  test('web bridge initializes without errors', async () => {
    const bridge = createIntegrationBridge();
    await expect(bridge.initialize()).resolves.toBeUndefined();
  });

  test('web bridge handles audio replacement', async () => {
    const bridge = createIntegrationBridge();
    await bridge.initialize();
    
    const mockAudioData = new ArrayBuffer(1024);
    await expect(bridge.replaceAudio(mockAudioData)).resolves.toBeUndefined();
  });

  test('web bridge cleans up properly', async () => {
    const bridge = createIntegrationBridge();
    await bridge.initialize();
    await expect(bridge.cleanup()).resolves.toBeUndefined();
  });
});

// Export for Jest
module.exports = {
  getPlatformInfo,
  detectTeams,
  detectZoom,
  createIntegrationBridge,
  supportsIntegration,
};