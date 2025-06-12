#!/bin/bash

# VidLiSync Production Build Script
# Builds for production deployment with proper signing and optimization
# Requires developer accounts and certificates

set -e

echo "🏭 VidLiSync Production Build Script"
echo "====================================="

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
BUILD_DIR="./dist-production"
APP_NAME="VidLiSync"
BUNDLE_ID="com.vidlisync.translator"
VERSION="1.0.0"
BUILD_NUMBER="1"

# Environment variables validation
check_environment() {
    log "Checking environment variables..."
    
    # iOS/macOS signing
    if [ -z "$APPLE_TEAM_ID" ]; then
        warning "APPLE_TEAM_ID not set - iOS/macOS production builds will fail"
    fi
    
    if [ -z "$APPLE_DISTRIBUTION_CERT" ]; then
        warning "APPLE_DISTRIBUTION_CERT not set - production signing disabled"
    fi
    
    # Android signing
    if [ -z "$KEYSTORE_PASSWORD" ]; then
        warning "KEYSTORE_PASSWORD not set - Android release builds will fail"
    fi
    
    if [ -z "$KEY_ALIAS" ]; then
        warning "KEY_ALIAS not set - Android release builds will fail"
    fi
    
    # API Keys
    if [ -z "$OPENAI_API_KEY" ]; then
        warning "OPENAI_API_KEY not set"
    fi
    
    success "Environment check completed"
}

# Function: Build Production Web App
build_web_production() {
    log "Building production web application..."
    
    # Set production environment
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    
    # Build optimized Next.js app
    npm run build
    
    if [ $? -eq 0 ]; then
        success "Production web application built successfully"
        
        # Copy build output
        mkdir -p "$BUILD_DIR/web"
        cp -r .next/static "$BUILD_DIR/web/"
        cp -r .next/standalone "$BUILD_DIR/web/"
        cp -r public "$BUILD_DIR/web/"
        
        # Create deployment package
        cd "$BUILD_DIR/web"
        tar -czf "../vidlisync-web-production.tar.gz" .
        cd ../../
        
        success "Web deployment package: $BUILD_DIR/vidlisync-web-production.tar.gz"
    else
        error "Production web build failed"
        exit 1
    fi
}

# Function: Build iOS for App Store
build_ios_production() {
    log "Building iOS application for App Store..."
    
    if [ "$PLATFORM" != "Darwin" ]; then
        warning "iOS builds require macOS. Skipping iOS build."
        return
    fi
    
    if [ -z "$APPLE_TEAM_ID" ]; then
        error "APPLE_TEAM_ID required for production iOS builds"
        return 1
    fi
    
    cd mobile-apps/ios/VidLiSync
    
    # Production signing configuration
    log "Configuring production signing..."
    
    # Build for App Store
    xcodebuild \
        -project VidLiSync.xcodeproj \
        -scheme VidLiSync \
        -sdk iphoneos \
        -configuration Release \
        -derivedDataPath "$BUILD_DIR/ios-appstore" \
        -allowProvisioningUpdates \
        CODE_SIGN_STYLE=Manual \
        DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
        CODE_SIGN_IDENTITY="Apple Distribution" \
        PROVISIONING_PROFILE_SPECIFIER="VidLiSync Distribution" \
        archive \
        -archivePath "$BUILD_DIR/ios-appstore/VidLiSync.xcarchive"
    
    if [ $? -eq 0 ]; then
        success "iOS App Store archive created"
        
        # Export IPA
        xcodebuild \
            -exportArchive \
            -archivePath "$BUILD_DIR/ios-appstore/VidLiSync.xcarchive" \
            -exportPath "$BUILD_DIR/ios-appstore" \
            -exportOptionsPlist ExportOptions.plist
        
        success "iOS production IPA: $BUILD_DIR/ios-appstore/VidLiSync.ipa"
    else
        error "iOS production build failed"
    fi
    
    cd ../../../
}

# Function: Build macOS for Mac App Store
build_macos_production() {
    log "Building macOS application for Mac App Store..."
    
    if [ "$PLATFORM" != "Darwin" ]; then
        warning "macOS builds require macOS. Skipping macOS build."
        return
    fi
    
    if [ -z "$APPLE_TEAM_ID" ]; then
        error "APPLE_TEAM_ID required for production macOS builds"
        return 1
    fi
    
    cd mobile-apps/ios/VidLiSync
    
    # Build for Mac App Store
    xcodebuild \
        -project VidLiSync.xcodeproj \
        -scheme VidLiSync \
        -destination "platform=macOS" \
        -configuration Release \
        -derivedDataPath "$BUILD_DIR/macos-appstore" \
        -allowProvisioningUpdates \
        CODE_SIGN_STYLE=Manual \
        DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
        CODE_SIGN_IDENTITY="3rd Party Mac Developer Application" \
        PROVISIONING_PROFILE_SPECIFIER="VidLiSync macOS Distribution" \
        archive \
        -archivePath "$BUILD_DIR/macos-appstore/VidLiSync.xcarchive"
    
    if [ $? -eq 0 ]; then
        success "macOS App Store archive created"
        
        # Export package
        xcodebuild \
            -exportArchive \
            -archivePath "$BUILD_DIR/macos-appstore/VidLiSync.xcarchive" \
            -exportPath "$BUILD_DIR/macos-appstore" \
            -exportOptionsPlist ExportOptions-macOS.plist
        
        success "macOS production package: $BUILD_DIR/macos-appstore/VidLiSync.pkg"
    else
        error "macOS production build failed"
    fi
    
    cd ../../../
}

# Function: Build Android for Play Store
build_android_production() {
    log "Building Android application for Play Store..."
    
    if [ ! -d "mobile-apps/android" ]; then
        error "Android project not found"
        return 1
    fi
    
    if [ -z "$KEYSTORE_PASSWORD" ] || [ -z "$KEY_ALIAS" ]; then
        error "Keystore credentials required for production Android builds"
        return 1
    fi
    
    cd mobile-apps/android
    
    # Build release APK
    log "Building release APK..."
    if [ -f "gradlew" ]; then
        ./gradlew assembleRelease
    else
        gradle assembleRelease
    fi
    
    if [ $? -eq 0 ]; then
        success "Android release APK built successfully"
        
        # Copy APK to build directory
        mkdir -p "$BUILD_DIR/android"
        find . -name "*.apk" -path "*/release/*" -exec cp {} "$BUILD_DIR/android/VidLiSync-release.apk" \;
        
        # Build AAB for Play Store
        log "Building Android App Bundle for Play Store..."
        if [ -f "gradlew" ]; then
            ./gradlew bundleRelease
        else
            gradle bundleRelease
        fi
        
        if [ $? -eq 0 ]; then
            find . -name "*.aab" -path "*/release/*" -exec cp {} "$BUILD_DIR/android/VidLiSync-release.aab" \;
            success "Android production AAB: $BUILD_DIR/android/VidLiSync-release.aab"
        fi
    else
        error "Android production build failed"
    fi
    
    cd ../../
}

# Function: Build Windows for Microsoft Store
build_windows_production() {
    log "Building Windows application for Microsoft Store..."
    
    # Create production Electron app
    mkdir -p "$BUILD_DIR/windows"
    
    # Copy package.json with production settings
    cat > "$BUILD_DIR/windows/package.json" << EOF
{
  "name": "vidlisync",
  "version": "$VERSION",
  "description": "VidLiSync - Real-time video chat with AI translation",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dist": "electron-builder --publish=never"
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
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "arm64"]
        },
        {
          "target": "appx",
          "arch": ["x64", "arm64"]
        }
      ],
      "icon": "assets/icon.ico",
      "publisherName": "VidLiSync",
      "certificateFile": "certificates/windows-cert.p12",
      "certificatePassword": "\${env.WINDOWS_CERT_PASSWORD}"
    },
    "appx": {
      "applicationId": "VidLiSync",
      "backgroundColor": "#463714",
      "showNameOnTiles": true,
      "languages": ["en-US", "es-ES", "fr-FR", "de-DE", "ja-JP", "ko-KR", "zh-CN"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
EOF

    # Copy production main.js
    cat > "$BUILD_DIR/windows/main.js" << 'EOF'
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ navigationAction, url }) => {
    if (navigationAction === 'deny') {
      return { action: 'deny' };
    }
    
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('web/index.html');
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
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

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3000' && !isDev) {
      navigationEvent.preventDefault();
    }
  });
});
EOF

    # Copy web build
    cp -r .next/static "$BUILD_DIR/windows/web/"
    cp -r public/* "$BUILD_DIR/windows/web/"
    
    # Install and build
    cd "$BUILD_DIR/windows"
    npm install
    npm run dist
    
    if [ $? -eq 0 ]; then
        success "Windows production builds completed"
        log "Windows installer: $BUILD_DIR/windows/dist/"
        log "MSIX package: $BUILD_DIR/windows/dist/*.appx"
    else
        error "Windows production build failed"
    fi
    
    cd ../../
}

# Function: Create deployment artifacts
create_deployment_artifacts() {
    log "Creating deployment artifacts..."
    
    # Create version info
    cat > "$BUILD_DIR/version.json" << EOF
{
  "version": "$VERSION",
  "build": "$BUILD_NUMBER",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "platforms": {
    "web": $([ -d "$BUILD_DIR/web" ] && echo "true" || echo "false"),
    "ios": $([ -d "$BUILD_DIR/ios-appstore" ] && echo "true" || echo "false"),
    "macos": $([ -d "$BUILD_DIR/macos-appstore" ] && echo "true" || echo "false"),
    "android": $([ -d "$BUILD_DIR/android" ] && echo "true" || echo "false"),
    "windows": $([ -d "$BUILD_DIR/windows" ] && echo "true" || echo "false")
  }
}
EOF

    # Create checksums
    log "Generating checksums..."
    find "$BUILD_DIR" -type f \( -name "*.ipa" -o -name "*.apk" -o -name "*.aab" -o -name "*.pkg" -o -name "*.appx" -o -name "*.tar.gz" \) -exec shasum -a 256 {} \; > "$BUILD_DIR/checksums.txt"
    
    success "Deployment artifacts created"
}

# Function: Build All Platforms for Production
build_all_production() {
    log "Building for all platforms (production)..."
    
    check_environment
    
    build_web_production
    build_ios_production
    build_macos_production
    build_android_production
    build_windows_production
    
    create_deployment_artifacts
    
    success "Production build completed!"
    log "Production builds in: $BUILD_DIR"
}

# Main execution
case "${1:-all}" in
    "web")
        check_environment
        build_web_production
        ;;
    "ios")
        check_environment
        build_ios_production
        ;;
    "macos")
        check_environment
        build_macos_production
        ;;
    "android")
        check_environment
        build_android_production
        ;;
    "windows")
        check_environment
        build_windows_production
        ;;
    "all")
        build_all_production
        ;;
    *)
        echo "Usage: $0 {web|ios|macos|android|windows|all}"
        echo ""
        echo "Production builds for app stores:"
        echo "  web      - Build production web app"
        echo "  ios      - Build for iOS App Store"
        echo "  macos    - Build for Mac App Store"
        echo "  android  - Build for Google Play Store"
        echo "  windows  - Build for Microsoft Store"
        echo "  all      - Build for all platforms"
        echo ""
        echo "Required environment variables:"
        echo "  APPLE_TEAM_ID         - Apple Developer Team ID"
        echo "  KEYSTORE_PASSWORD     - Android keystore password"
        echo "  KEY_ALIAS            - Android key alias"
        echo "  WINDOWS_CERT_PASSWORD - Windows certificate password"
        exit 1
        ;;
esac

log "Production build script completed"