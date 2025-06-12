# Teams and Zoom Integration Guide

This guide explains how to set up and use VidLiSync's Microsoft Teams and Zoom integrations for real-time translation.

## Overview

VidLiSync now supports integration with Microsoft Teams and Zoom, allowing users to activate real-time translation directly within their existing video conferencing workflows. The integration maintains all core translation capabilities while adding platform-specific features.

## Architecture

The integration follows a hybrid architecture:

1. **Web App Foundation**: Leverages existing VidLiSync translation pipeline
2. **Platform Detection**: Automatically detects Teams/Zoom context
3. **Integration Bridges**: Platform-specific audio/video handling
4. **Unified Controls**: Consistent UI across all platforms

## Microsoft Teams Integration

### Setup

1. **Teams App Manifest**: Located in `/teams-app/manifest.json`
2. **Configuration Page**: Accessible at `/teams/config`
3. **Dashboard**: Integration interface at `/teams/dashboard`

### Features

- **Meeting Extension**: Adds VidLiSync to Teams meetings
- **Audio Integration**: Captures and processes Teams audio streams
- **Real-time Translation**: Full translation pipeline within Teams
- **Voice Preservation**: Maintains user voice characteristics

### Installation

1. Package the Teams app:
   ```bash
   cd teams-app
   zip -r vidlisync-teams.zip .
   ```

2. Upload to Teams Admin Center or sideload for development

3. Configure default languages in the Teams app settings

### Usage

1. Add VidLiSync to a Teams meeting
2. Configure source and target languages
3. Start translation during the meeting
4. Translated audio plays through Teams automatically

## Zoom Integration

### Setup

1. **Zoom App Config**: Located in `/zoom-app/app-config.json`
2. **OAuth Callback**: Handles authorization at `/zoom/callback`
3. **Webhooks**: Meeting events processed at `/zoom/webhooks`

### Features

- **Virtual Camera/Microphone**: Replaces audio/video streams in Zoom
- **Meeting Integration**: Seamless activation during Zoom calls
- **Webhook Support**: Handles meeting lifecycle events
- **Multi-participant**: Supports group translation scenarios

### Installation

1. Create Zoom App in Zoom Marketplace
2. Configure OAuth and webhook URLs
3. Submit for Zoom App Directory approval

### Usage

1. Install VidLiSync from Zoom App Directory
2. Authorize the app during first use
3. Activate translation in Zoom meetings
4. Translated audio/video appears through virtual devices

## Technical Implementation

### Platform Detection

```typescript
import { getPlatformInfo } from '@/lib/platform-detection';

const platformInfo = getPlatformInfo();
// Returns: { platform: 'teams' | 'zoom' | 'web', capabilities: {...} }
```

### Integration Bridge

```typescript
import { createIntegrationBridge } from '@/lib/integration-bridge';

const bridge = createIntegrationBridge();
await bridge.initialize();
await bridge.startAudioCapture(config);
```

### Translation Hook

```typescript
import { useIntegrationTranslation } from '@/hooks/useIntegrationTranslation';

const {
  isIntegrationMode,
  platform,
  startIntegrationTranslation,
  stopIntegrationTranslation
} = useIntegrationTranslation();
```

## Audio Processing

### Teams Audio Worklet

The Teams integration uses AudioWorklet for real-time audio processing:

```javascript
// Registered at /audio-worklet/translation-processor.js
class TranslationProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    // Process audio for translation
    // Output translated audio
  }
}
```

### Zoom Virtual Devices

Zoom integration uses virtual camera and microphone devices to replace streams:

- **Virtual Microphone**: Outputs translated audio
- **Virtual Camera**: Provides lip-synced video
- **Stream Replacement**: Seamless audio/video substitution

## Configuration

### Environment Variables

```bash
# API URLs for Teams/Zoom
NEXT_PUBLIC_TEAMS_APP_ID=your-teams-app-id
NEXT_PUBLIC_ZOOM_CLIENT_ID=your-zoom-client-id
NEXT_PUBLIC_ZOOM_CLIENT_SECRET=your-zoom-client-secret

# Integration endpoints
NEXT_PUBLIC_TEAMS_CONFIG_URL=https://your-domain.com/teams/config
NEXT_PUBLIC_ZOOM_CALLBACK_URL=https://your-domain.com/zoom/callback
```

### Teams Manifest Configuration

Key sections in `/teams-app/manifest.json`:

```json
{
  "permissions": ["identity", "messageTeamMembers"],
  "devicePermissions": ["media"],
  "meetingExtensionDefinition": {
    "scenes": [{"id": "translation-panel", "name": "Live Translation"}],
    "supportsStreaming": true
  }
}
```

### Zoom App Configuration

Key sections in `/zoom-app/app-config.json`:

```json
{
  "features": {
    "in_meeting": {
      "audio_streaming": true,
      "video_streaming": true
    }
  },
  "scopes": ["meeting:read", "meeting:write", "user:read"]
}
```

## Development

### Testing Teams Integration

1. Use Teams Developer Portal for testing
2. Sideload the app in Teams
3. Test in Teams meetings or use Teams Toolkit

### Testing Zoom Integration

1. Create Zoom OAuth app for development
2. Use ngrok for local webhook testing
3. Test with Zoom SDK in development mode

### Local Development

```bash
# Start development server
npm run dev

# Access integration pages
# Teams: http://localhost:3000/teams/config
# Zoom: http://localhost:3000/zoom/callback
```

## Deployment

### Teams Marketplace

1. Package Teams app with all assets
2. Submit to Teams App Store
3. Complete Microsoft certification process

### Zoom Marketplace

1. Configure production OAuth endpoints
2. Submit to Zoom App Directory
3. Complete Zoom security review

### Production Considerations

- **SSL Required**: Both platforms require HTTPS
- **Webhook Security**: Verify webhook signatures
- **Rate Limiting**: Handle platform API limits
- **Error Handling**: Graceful degradation for integration failures

## Troubleshooting

### Common Issues

1. **Teams SDK not loading**: Check Teams context and manifest
2. **Zoom authorization fails**: Verify OAuth configuration
3. **Audio not processing**: Check WebSocket connection and worklet loading
4. **Integration not detected**: Verify platform detection logic

### Debug Tools

```bash
# Check platform detection
console.log(getPlatformInfo());

# Test integration bridge
const bridge = createIntegrationBridge();
bridge.initialize().then(() => console.log('Bridge ready'));

# Monitor WebSocket connection
# Check browser developer tools Network tab
```

## Support

For integration support:

1. Check Teams/Zoom developer documentation
2. Review VidLiSync integration logs
3. Test platform detection and bridge initialization
4. Verify webhook endpoints and OAuth flows

## Future Enhancements

Planned improvements:

- **Native Apps**: iOS, macOS, Windows, Android clients
- **Advanced Virtual Devices**: Enhanced camera/microphone features
- **Multi-language Support**: Simultaneous translation for multiple participants
- **Meeting Analytics**: Translation usage and quality metrics