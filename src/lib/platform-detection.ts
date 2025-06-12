/**
 * Platform detection utilities for Teams/Zoom integration
 */

export interface PlatformInfo {
  platform: 'teams' | 'zoom' | 'web' | 'unknown';
  version?: string;
  capabilities: {
    hasAudioAccess: boolean;
    hasVideoAccess: boolean;
    hasScreenShare: boolean;
    hasVirtualDevice: boolean;
  };
}

/**
 * Detect if running inside Microsoft Teams
 */
export const detectTeams = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for Teams SDK
  if (window.microsoftTeams) return true;
  
  // Check user agent
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('teams')) return true;
  
  // Check for Teams-specific URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('teams') || urlParams.has('teamsSdk')) return true;
  
  // Check for Teams context in parent frame
  try {
    if (window.parent !== window && window.parent.microsoftTeams) {
      return true;
    }
  } catch (e) {
    // Cross-origin restriction, might be in Teams iframe
  }
  
  return false;
};

/**
 * Detect if running inside Zoom
 */
export const detectZoom = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for Zoom SDK
  if (window.ZoomMtg || window.ZoomMtgEmbedded) return true;
  
  // Check user agent
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('zoom')) return true;
  
  // Check for Zoom-specific URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('zoom') || urlParams.has('zoomApp')) return true;
  
  // Check for Zoom context
  try {
    if (window.parent !== window && (window.parent.ZoomMtg || window.parent.ZoomMtgEmbedded)) {
      return true;
    }
  } catch (e) {
    // Cross-origin restriction, might be in Zoom iframe
  }
  
  return false;
};

/**
 * Get comprehensive platform information
 */
export const getPlatformInfo = (): PlatformInfo => {
  const isTeams = detectTeams();
  const isZoom = detectZoom();
  
  let platform: PlatformInfo['platform'] = 'web';
  let capabilities: PlatformInfo['capabilities'] = {
    hasAudioAccess: false,
    hasVideoAccess: false,
    hasScreenShare: false,
    hasVirtualDevice: false,
  };
  
  if (isTeams) {
    platform = 'teams';
    capabilities = {
      hasAudioAccess: true,
      hasVideoAccess: true,
      hasScreenShare: true,
      hasVirtualDevice: false, // Teams uses different approach
    };
  } else if (isZoom) {
    platform = 'zoom';
    capabilities = {
      hasAudioAccess: true,
      hasVideoAccess: true,
      hasScreenShare: true,
      hasVirtualDevice: true, // Zoom supports virtual camera/mic
    };
  } else {
    // Web platform capabilities
    capabilities = {
      hasAudioAccess: 'mediaDevices' in navigator,
      hasVideoAccess: 'mediaDevices' in navigator,
      hasScreenShare: 'getDisplayMedia' in (navigator.mediaDevices || {}),
      hasVirtualDevice: false,
    };
  }
  
  return {
    platform,
    capabilities,
    version: getSDKVersion(platform),
  };
};

/**
 * Get SDK version if available
 */
const getSDKVersion = (platform: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  switch (platform) {
    case 'teams':
      return window.microsoftTeams?.version;
    case 'zoom':
      return window.ZoomMtg?.version || window.ZoomMtgEmbedded?.version;
    default:
      return undefined;
  }
};

/**
 * Check if platform supports virtual devices
 */
export const supportsVirtualDevices = (): boolean => {
  const { capabilities } = getPlatformInfo();
  return capabilities.hasVirtualDevice;
};

/**
 * Check if platform supports audio streaming
 */
export const supportsAudioStreaming = (): boolean => {
  const { capabilities } = getPlatformInfo();
  return capabilities.hasAudioAccess;
};

/**
 * Check if platform supports video streaming
 */
export const supportsVideoStreaming = (): boolean => {
  const { capabilities } = getPlatformInfo();
  return capabilities.hasVideoAccess;
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    microsoftTeams?: {
      version?: string;
      initialize?: (callback?: () => void) => void;
      getContext?: (callback: (context: any) => void) => void;
      settings?: {
        setSettings?: (config: any) => void;
        setValidityState?: (valid: boolean) => void;
      };
    };
    ZoomMtg?: {
      version?: string;
      init?: (options: any) => void;
    };
    ZoomMtgEmbedded?: {
      version?: string;
      createClient?: () => any;
    };
  }
}