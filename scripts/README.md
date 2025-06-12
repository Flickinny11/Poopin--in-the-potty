# VidLiSync Build & Model Management

This directory contains scripts for building VidLiSync for multiple platforms and managing AI models.

## 🚀 Build Scripts

### Personal Use Builds (No Developer Account Required)

```bash
# Build for all platforms
./scripts/build/build-personal.sh all

# Build specific platforms
./scripts/build/build-personal.sh web
./scripts/build/build-personal.sh ios
./scripts/build/build-personal.sh macos
./scripts/build/build-personal.sh android
./scripts/build/build-personal.sh windows
```

**Requirements:**
- **Web**: Node.js 18+, npm
- **iOS**: macOS + Xcode 16.4 (builds for simulator + personal signing)
- **macOS**: macOS + Xcode 16.4 (universal binary)
- **Android**: Android SDK, Gradle
- **Windows**: Node.js (creates Electron wrapper)

### Production Builds (Requires Developer Accounts)

```bash
# Set environment variables
export APPLE_TEAM_ID="YOUR_TEAM_ID"
export KEYSTORE_PASSWORD="YOUR_KEYSTORE_PASSWORD"
export KEY_ALIAS="YOUR_KEY_ALIAS"
export WINDOWS_CERT_PASSWORD="YOUR_CERT_PASSWORD"

# Build for production
./scripts/build/build-production.sh all
```

## 🤖 AI Model Management

### Download Models

```bash
# Download required models (Whisper + NLLB)
./scripts/download-models.sh required

# Download all models
./scripts/download-models.sh all

# Download specific model
./scripts/download-models.sh download whisper_large_v3
```

### Manage Models

```bash
# List available models
./scripts/download-models.sh list

# Check storage usage
./scripts/download-models.sh storage

# Verify model integrity
./scripts/download-models.sh verify

# Clean up corrupted models
./scripts/download-models.sh cleanup

# Generate models.json config
./scripts/download-models.sh config
```

### Available Models

| Model | Size | Type | Required |
|-------|------|------|----------|
| **Whisper Large v3** | 1.5GB | Speech Recognition | ✅ Yes |
| **NLLB-200 Distilled** | 2.4GB | Translation | ✅ Yes |
| **Wunjo Voice v2.1** | 500MB | Voice Cloning | ❌ Optional |
| **Wunjo Lips v1.8** | 800MB | Lip Sync | ❌ Optional |

**Total Storage:**
- Required models: ~4GB
- All models: ~5.3GB

## 📱 Platform-Specific Notes

### iOS Personal Builds

- Uses personal Apple ID (no developer account needed)
- Builds for iOS Simulator (always works)
- Device builds may fail without proper provisioning
- Install via Xcode or Apple Configurator 2

### Android Personal Builds

- Creates debug APK signed with debug keystore
- Can be installed via ADB or direct transfer
- Enable "Unknown Sources" in device settings

### macOS Personal Builds

- Creates universal binary (Apple Silicon + Intel)
- May show security warnings on first launch
- Right-click → Open to bypass Gatekeeper

### Windows Personal Builds

- Creates Electron wrapper around web app
- Requires Node.js to run: `npm start`
- For installer: `npm run dist`

## 🔧 Development Workflow

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Download required models
./scripts/download-models.sh required

# Generate models config
./scripts/download-models.sh config
```

### 2. Development

```bash
# Start development server
npm run dev

# Build and test
npm run build
npm start
```

### 3. Testing Builds

```bash
# Test personal builds
./scripts/build/build-personal.sh web
./scripts/build/build-personal.sh ios

# Verify production readiness
# Visit: http://localhost:3000/production-checklist
```

### 4. Production Deployment

```bash
# Set up environment variables
# Run production builds
./scripts/build/build-production.sh all

# Deploy to app stores
# Follow platform-specific submission guidelines
```

## 📋 Production Checklist

Use the comprehensive production checklist to verify readiness:

```
http://localhost:3000/production-checklist
```

**Verification Categories:**
- ✅ UI/UX Polish (loading states, error handling, animations)
- ✅ Settings System (completeness, search, persistence)
- ✅ Voice Profile System (training flow, quality)
- ✅ AI Models (download, verification, offline mode)
- ✅ Security & Privacy (encryption, controls)
- ✅ Performance (load times, translation speed)
- ✅ Build System (all platforms)
- ✅ Feature Integration (VS features, billing)

## 🚨 Troubleshooting

### Common Issues

**iOS Build Fails:**
- Ensure Xcode 16.4+ is installed
- Check iOS deployment target (18.5+)
- Verify personal team signing

**Android Build Fails:**
- Set ANDROID_HOME environment variable
- Ensure Android SDK 34+ is installed
- Check Gradle version compatibility

**Model Download Fails:**
- Check internet connection
- Verify available disk space
- Try downloading individual models

**Out of Storage:**
- Run `./scripts/download-models.sh cleanup`
- Delete unused models
- Use required models only for development

### Performance Optimization

**Large Bundle Size:**
- Models are loaded on-demand
- Only required models auto-download
- Enable tree shaking in production

**Slow Translation:**
- Ensure GPU acceleration is enabled
- Use local AI processing when possible
- Optimize model loading

## 📚 Documentation

- **Settings Guide**: Visit `/settings` in the app
- **Voice Training**: Visit `/settings/voice-profile`
- **Production Checklist**: Visit `/production-checklist`
- **API Documentation**: See `backend/README.md`

## 🔐 Security Notes

- Voice recordings are processed locally
- Models stored in secure app directories  
- Settings encrypted in local storage
- No sensitive data in logs

## 📄 License & Credits

- **VidLiSync**: Proprietary
- **Whisper**: MIT License (OpenAI)
- **NLLB**: CC BY-NC License (Meta)
- **Wunjo**: Apache 2.0 License (Wladradchenko)

---

For more information, see the main README.md or visit the production checklist in the app.