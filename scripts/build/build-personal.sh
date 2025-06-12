#!/bin/bash

# VidLiSync Personal Build Script
# Builds for personal use without requiring developer accounts
# Supports macOS Sequoia 15.3.2 with Xcode 16.4

set -e

echo "🚀 VidLiSync Personal Build Script"
echo "=====================================+"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Build configuration
BUILD_DIR="./dist"
APP_NAME="VidLiSync"
BUNDLE_ID="com.local.vidlisync"
VERSION="1.0.0"
BUILD_NUMBER="1"

# Platform detection
PLATFORM=$(uname -s)
ARCH=$(uname -m)

log "Platform: $PLATFORM ($ARCH)"
log "Build Directory: $BUILD_DIR"

# Create build directory
mkdir -p "$BUILD_DIR"

# Function: Build Web App
build_web() {
    log "Building web application..."
    
    # Build Next.js app
    npm run build
    
    if [ $? -eq 0 ]; then
        success "Web application built successfully"
        
        # Copy build output
        cp -r .next/static "$BUILD_DIR/web/"
        cp -r public "$BUILD_DIR/web/"
        
        log "Web build available at: $BUILD_DIR/web/"
    else
        error "Web build failed"
        exit 1
    fi
}

# Function: Build iOS (Personal Team)
build_ios() {
    log "Building iOS application for personal use..."
    
    if [ "$PLATFORM" != "Darwin" ]; then
        warning "iOS builds require macOS. Skipping iOS build."
        return
    fi
    
    # Check for Xcode
    if ! command -v xcodebuild &> /dev/null; then
        error "Xcode is required for iOS builds"
        return 1
    fi
    
    # Check Xcode version
    XCODE_VERSION=$(xcodebuild -version | head -n 1 | cut -d ' ' -f 2)
    log "Xcode Version: $XCODE_VERSION"
    
    if [ ! -d "mobile-apps/ios/VidLiSync" ]; then
        error "iOS project not found at mobile-apps/ios/VidLiSync"
        return 1
    fi
    
    cd mobile-apps/ios/VidLiSync
    
    # Personal team signing configuration
    log "Configuring personal team signing..."
    
    # Build for iOS Simulator (no signing required)
    log "Building for iOS Simulator..."
    xcodebuild \
        -project VidLiSync.xcodeproj \
        -scheme VidLiSync \
        -sdk iphonesimulator \
        -configuration Debug \
        -derivedDataPath "$BUILD_DIR/ios-simulator" \
        build
    
    if [ $? -eq 0 ]; then
        success "iOS Simulator build completed"
        log "iOS Simulator app: $BUILD_DIR/ios-simulator/Build/Products/Debug-iphonesimulator/VidLiSync.app"
    else
        error "iOS Simulator build failed"
    fi
    
    # Build for iOS Device (personal signing)
    log "Building for iOS Device with personal signing..."
    xcodebuild \
        -project VidLiSync.xcodeproj \
        -scheme VidLiSync \
        -sdk iphoneos \
        -configuration Debug \
        -derivedDataPath "$BUILD_DIR/ios-device" \
        -allowProvisioningUpdates \
        CODE_SIGN_STYLE=Automatic \
        DEVELOPMENT_TEAM="" \
        CODE_SIGN_IDENTITY="Apple Development" \
        build
    
    if [ $? -eq 0 ]; then
        success "iOS Device build completed"
        log "iOS Device app: $BUILD_DIR/ios-device/Build/Products/Debug-iphoneos/VidLiSync.app"
        
        # Create IPA for installation
        mkdir -p "$BUILD_DIR/ios-device/Payload"
        cp -r "$BUILD_DIR/ios-device/Build/Products/Debug-iphoneos/VidLiSync.app" "$BUILD_DIR/ios-device/Payload/"
        cd "$BUILD_DIR/ios-device"
        zip -r "VidLiSync-Personal.ipa" Payload/
        log "IPA created: $BUILD_DIR/ios-device/VidLiSync-Personal.ipa"
    else
        warning "iOS Device build failed (this is normal without Apple Developer account)"
        log "Use iOS Simulator build for testing"
    fi
    
    cd ../../../
}

# Function: Build macOS (Universal Binary)
build_macos() {
    log "Building macOS application..."
    
    if [ "$PLATFORM" != "Darwin" ]; then
        warning "macOS builds require macOS. Skipping macOS build."
        return
    fi
    
    if ! command -v xcodebuild &> /dev/null; then
        error "Xcode is required for macOS builds"
        return 1
    fi
    
    if [ ! -d "mobile-apps/ios/VidLiSync" ]; then
        error "macOS project not found"
        return 1
    fi
    
    cd mobile-apps/ios/VidLiSync
    
    # Build universal binary for macOS
    log "Building universal macOS application..."
    xcodebuild \
        -project VidLiSync.xcodeproj \
        -scheme VidLiSync \
        -destination "platform=macOS,arch=arm64" \
        -configuration Debug \
        -derivedDataPath "$BUILD_DIR/macos-arm64" \
        -allowProvisioningUpdates \
        CODE_SIGN_STYLE=Automatic \
        DEVELOPMENT_TEAM="" \
        build
    
    if [ $? -eq 0 ]; then
        success "macOS ARM64 build completed"
    fi
    
    # Build for Intel
    xcodebuild \
        -project VidLiSync.xcodeproj \
        -scheme VidLiSync \
        -destination "platform=macOS,arch=x86_64" \
        -configuration Debug \
        -derivedDataPath "$BUILD_DIR/macos-x86_64" \
        -allowProvisioningUpdates \
        CODE_SIGN_STYLE=Automatic \
        DEVELOPMENT_TEAM="" \
        build
    
    if [ $? -eq 0 ]; then
        success "macOS Intel build completed"
        
        # Create universal binary
        log "Creating universal binary..."
        mkdir -p "$BUILD_DIR/macos-universal"
        cp -r "$BUILD_DIR/macos-arm64/Build/Products/Debug/VidLiSync.app" "$BUILD_DIR/macos-universal/"
        
        # Use lipo to create universal binary
        lipo -create \
            "$BUILD_DIR/macos-arm64/Build/Products/Debug/VidLiSync.app/Contents/MacOS/VidLiSync" \
            "$BUILD_DIR/macos-x86_64/Build/Products/Debug/VidLiSync.app/Contents/MacOS/VidLiSync" \
            -output "$BUILD_DIR/macos-universal/VidLiSync.app/Contents/MacOS/VidLiSync"
        
        success "Universal macOS app created: $BUILD_DIR/macos-universal/VidLiSync.app"
    else
        warning "macOS Intel build failed"
    fi
    
    cd ../../../
}

# Function: Build Android (Debug APK)
build_android() {
    log "Building Android application..."
    
    if [ ! -d "mobile-apps/android" ]; then
        error "Android project not found at mobile-apps/android"
        return 1
    fi
    
    cd mobile-apps/android
    
    # Check for Android SDK
    if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        error "Android SDK not found. Please set ANDROID_HOME or ANDROID_SDK_ROOT"
        return 1
    fi
    
    # Build debug APK (no signing required)
    log "Building debug APK..."
    if [ -f "gradlew" ]; then
        ./gradlew assembleDebug
    elif command -v gradle &> /dev/null; then
        gradle assembleDebug
    else
        error "Gradle not found"
        return 1
    fi
    
    if [ $? -eq 0 ]; then
        success "Android debug APK built successfully"
        
        # Copy APK to build directory
        mkdir -p "$BUILD_DIR/android"
        find . -name "*.apk" -path "*/debug/*" -exec cp {} "$BUILD_DIR/android/VidLiSync-debug.apk" \;
        
        log "Debug APK: $BUILD_DIR/android/VidLiSync-debug.apk"
        
        # Also build AAB for Play Store (if needed later)
        log "Building Android App Bundle (AAB)..."
        if [ -f "gradlew" ]; then
            ./gradlew bundleDebug
        else
            gradle bundleDebug
        fi
        
        if [ $? -eq 0 ]; then
            find . -name "*.aab" -path "*/debug/*" -exec cp {} "$BUILD_DIR/android/VidLiSync-debug.aab" \;
            log "Debug AAB: $BUILD_DIR/android/VidLiSync-debug.aab"
        fi
    else
        error "Android build failed"
    fi
    
    cd ../../
}

# Function: Build Windows (MSIX Package)
build_windows() {
    log "Building Windows application..."
    
    # For now, create Electron wrapper for web app
    if ! command -v npm &> /dev/null; then
        error "npm is required for Windows builds"
        return 1
    fi
    
    # Create Electron wrapper
    mkdir -p "$BUILD_DIR/windows"
    
    # Create package.json for Electron app
    cat > "$BUILD_DIR/windows/package.json" << EOF
{
  "name": "vidlisync-windows",
  "version": "$VERSION",
  "description": "VidLiSync for Windows",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "devDependencies": {
    "electron": "^latest",
    "electron-builder": "^latest"
  },
  "build": {
    "appId": "$BUNDLE_ID",
    "productName": "$APP_NAME",
    "directories": {
      "output": "dist"
    },
    "files": [
      "**/*",
      "!node_modules",
      "!dist"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
EOF

    # Create main.js for Electron
    cat > "$BUILD_DIR/windows/main.js" << 'EOF'
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // In development, load from localhost
  // In production, load from file
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile('web/index.html');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
EOF

    # Copy web build to Windows app
    cp -r .next/static "$BUILD_DIR/windows/web/"
    cp -r public/* "$BUILD_DIR/windows/web/"
    
    # Install dependencies and build
    cd "$BUILD_DIR/windows"
    npm install
    
    if [ $? -eq 0 ]; then
        success "Windows Electron app prepared"
        log "Windows app directory: $BUILD_DIR/windows"
        log "To build installer: cd $BUILD_DIR/windows && npm run build"
    else
        error "Windows app preparation failed"
    fi
    
    cd ../../
}

# Function: Build All Platforms
build_all() {
    log "Building for all platforms..."
    
    build_web
    build_ios
    build_macos
    build_android
    build_windows
    
    success "Multi-platform build completed!"
    log "Build outputs in: $BUILD_DIR"
}

# Function: Show build summary
show_summary() {
    echo ""
    echo "📱 Build Summary"
    echo "================"
    
    if [ -d "$BUILD_DIR/web" ]; then
        echo "✅ Web: $BUILD_DIR/web/"
    fi
    
    if [ -d "$BUILD_DIR/ios-simulator" ]; then
        echo "✅ iOS Simulator: $BUILD_DIR/ios-simulator/"
    fi
    
    if [ -d "$BUILD_DIR/ios-device" ]; then
        echo "✅ iOS Device: $BUILD_DIR/ios-device/"
    fi
    
    if [ -d "$BUILD_DIR/macos-universal" ]; then
        echo "✅ macOS Universal: $BUILD_DIR/macos-universal/"
    fi
    
    if [ -d "$BUILD_DIR/android" ]; then
        echo "✅ Android: $BUILD_DIR/android/"
    fi
    
    if [ -d "$BUILD_DIR/windows" ]; then
        echo "✅ Windows: $BUILD_DIR/windows/"
    fi
    
    echo ""
    echo "🎉 Personal builds ready for testing!"
    echo "📖 See README.md for installation instructions"
}

# Main execution
case "${1:-all}" in
    "web")
        build_web
        ;;
    "ios")
        build_ios
        ;;
    "macos")
        build_macos
        ;;
    "android")
        build_android
        ;;
    "windows")
        build_windows
        ;;
    "all")
        build_all
        ;;
    *)
        echo "Usage: $0 {web|ios|macos|android|windows|all}"
        echo ""
        echo "Platform-specific builds:"
        echo "  web      - Build web application"
        echo "  ios      - Build iOS app (requires macOS + Xcode)"
        echo "  macos    - Build macOS app (requires macOS + Xcode)"
        echo "  android  - Build Android APK (requires Android SDK)"
        echo "  windows  - Build Windows app (Electron wrapper)"
        echo "  all      - Build for all platforms"
        exit 1
        ;;
esac

show_summary