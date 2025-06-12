# VidLiSync Teams & Zoom Integration

This implementation adds Microsoft Teams and Zoom platform support to VidLiSync's real-time translation capabilities.

## Overview

The integration provides a foundation for Teams and Zoom marketplace apps while maintaining full compatibility with the existing web application. Users can activate VidLiSync translation directly within Teams meetings or Zoom calls.

## Key Features

### ✅ Platform Detection
- Automatic detection of Teams/Zoom environment
- Platform capability assessment
- Graceful fallback to web mode

### ✅ Integration Bridges
- Teams integration with AudioWorklet processing
- Zoom integration with virtual device interfaces
- Unified API across all platforms

### ✅ Translation Controls
- Platform-aware UI indicators
- Integration-specific modes
- Seamless mode switching

### ✅ Marketplace Ready
- Teams app manifest for store submission
- Zoom app configuration for directory listing
- OAuth and webhook endpoints

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Platform      │    │   Integration    │    │   Translation   │
│   Detection     │───▶│   Bridge         │───▶│   Pipeline      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Teams/Zoom SDK  │    │ Audio/Video      │    │ Whisper + NLLB  │
│ Web MediaAPI    │    │ Processing       │    │ + Wunjo CE      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## File Structure

```
├── teams-app/                      # Teams marketplace app
│   ├── manifest.json               # Teams app manifest
│   └── scenes/translation.json     # Meeting extension scene
├── zoom-app/                       # Zoom marketplace app
│   └── app-config.json            # Zoom app configuration
├── src/
│   ├── lib/
│   │   ├── platform-detection.ts   # Platform detection utilities
│   │   └── integration-bridge.ts   # Platform-specific bridges
│   ├── hooks/
│   │   └── useIntegrationTranslation.ts  # Integration hook
│   ├── app/
│   │   ├── teams/                  # Teams-specific pages
│   │   │   ├── config/page.tsx     # App configuration
│   │   │   └── dashboard/page.tsx  # Translation interface
│   │   └── zoom/                   # Zoom-specific endpoints
│   │       ├── callback/page.tsx   # OAuth callback
│   │       └── webhooks/route.ts   # Meeting webhooks
│   └── components/
│       └── TranslationControls.tsx # Enhanced with integration support
├── public/
│   └── audio-worklet/
│       └── translation-processor.js # Audio processing worklet
└── tests/
    └── integration.test.js         # Integration tests
```

## Quick Start

### 1. Teams Integration

1. **Configure the Teams app:**
   ```bash
   cd teams-app
   # Update manifest.json with your domain
   zip -r vidlisync-teams.zip .
   ```

2. **Upload to Teams:**
   - Access Teams Admin Center
   - Upload the zip file
   - Configure app permissions

3. **Test in Teams:**
   - Add VidLiSync to a meeting
   - Configure languages
   - Start translation

### 2. Zoom Integration

1. **Create Zoom app:**
   - Register at Zoom Marketplace
   - Configure OAuth with your callback URL
   - Set webhook endpoint

2. **Deploy endpoints:**
   ```bash
   # Zoom callback: /zoom/callback
   # Zoom webhooks: /zoom/webhooks
   ```

3. **Test with Zoom:**
   - Install from Zoom App Directory
   - Authorize during meeting
   - Activate translation

### 3. Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test integration endpoints
# Teams config: http://localhost:3000/teams/config
# Zoom callback: http://localhost:3000/zoom/callback
```

## Platform Detection

The integration automatically detects the platform:

```typescript
import { getPlatformInfo } from '@/lib/platform-detection';

const platform = getPlatformInfo();
// Returns: { platform: 'teams' | 'zoom' | 'web', capabilities: {...} }
```

## Integration Usage

Use the integration hook for platform-aware translation:

```typescript
import { useIntegrationTranslation } from '@/hooks/useIntegrationTranslation';

function MyComponent() {
  const {
    isIntegrationMode,      // true for Teams/Zoom
    platform,               // 'teams', 'zoom', or 'web'
    bridgeReady,           // integration bridge initialized
    startIntegrationTranslation,
    stopIntegrationTranslation,
  } = useIntegrationTranslation();

  // Component logic...
}
```

## Audio Processing

### Teams: AudioWorklet
Teams integration uses AudioWorklet for real-time processing:

```javascript
// Handles audio in separate thread
class TranslationProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    // Process audio for translation
    // Output translated audio
  }
}
```

### Zoom: Virtual Devices
Zoom integration uses virtual camera/microphone:

```typescript
// Creates virtual devices for stream replacement
await bridge.startAudioCapture(config);
await bridge.replaceAudio(translatedAudio);
```

## Configuration

### Environment Variables

```bash
# Teams configuration
NEXT_PUBLIC_TEAMS_APP_ID=your-teams-app-id

# Zoom configuration  
NEXT_PUBLIC_ZOOM_CLIENT_ID=your-zoom-client-id
NEXT_PUBLIC_ZOOM_CLIENT_SECRET=your-zoom-client-secret

# API endpoints
NEXT_PUBLIC_API_URL=https://your-api.com
```

### Teams Manifest

Key permissions in `teams-app/manifest.json`:

```json
{
  "permissions": ["identity", "messageTeamMembers"],
  "devicePermissions": ["media"],
  "validDomains": ["your-domain.com"]
}
```

### Zoom App Config

Key features in `zoom-app/app-config.json`:

```json
{
  "features": {
    "in_meeting": {
      "audio_streaming": true,
      "video_streaming": true
    }
  }
}
```

## Testing

Run integration tests:

```bash
# Run all tests
npm test

# Run integration tests specifically
npm test tests/integration.test.js
```

## Deployment

### Production Checklist

- [ ] Configure SSL/HTTPS (required by both platforms)
- [ ] Set production API URLs
- [ ] Configure OAuth endpoints
- [ ] Test webhook security
- [ ] Verify platform detection
- [ ] Test audio/video processing

### Teams Marketplace

1. Package app with all assets
2. Submit to Teams App Store
3. Complete Microsoft certification

### Zoom Marketplace

1. Configure production OAuth
2. Submit to Zoom App Directory  
3. Complete security review

## Troubleshooting

### Common Issues

**Platform not detected:**
- Check Teams/Zoom SDK loading
- Verify URL parameters
- Test user agent detection

**Audio not processing:**
- Check WebSocket connection
- Verify worklet loading
- Test media permissions

**Integration bridge fails:**
- Check platform availability
- Verify SDK initialization
- Test error handling

### Debug Tools

```javascript
// Check platform detection
console.log(getPlatformInfo());

// Test bridge creation
const bridge = createIntegrationBridge();
console.log(bridge.platform);

// Monitor WebSocket
// Check Network tab in browser dev tools
```

## Next Steps

This implementation provides the foundation for Teams/Zoom integration. Future enhancements could include:

- **Native Apps**: iOS, macOS, Windows, Android clients
- **Advanced Virtual Devices**: Enhanced camera/microphone features  
- **Multi-participant Translation**: Simultaneous translation for groups
- **Meeting Analytics**: Usage and quality metrics
- **Offline Mode**: Local processing capabilities

## Support

For integration support:
1. Review the [Teams/Zoom Integration Guide](./TEAMS_ZOOM_INTEGRATION.md)
2. Check platform-specific documentation
3. Test with provided integration tests
4. Verify webhook and OAuth configurations