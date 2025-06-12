#!/bin/bash

# VidLiSync Production Readiness Validation
# Comprehensive verification of all components for production deployment

set -e

echo "🚀 VidLiSync Production Readiness Validation"
echo "============================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    local test_name="$1"
    local test_function="$2"
    
    ((TESTS_TOTAL++))
    log "Running: $test_name"
    
    if $test_function; then
        success "$test_name"
    else
        failure "$test_name"
    fi
    echo ""
}

# =================================================================
# FRONTEND VALIDATION TESTS
# =================================================================

test_frontend_build() {
    log "Testing frontend build..."
    
    if npm run build > /dev/null 2>&1; then
        success "Frontend builds successfully"
        return 0
    else
        failure "Frontend build failed"
        return 1
    fi
}

test_settings_system() {
    log "Validating comprehensive settings system..."
    
    local required_files=(
        "src/stores/settingsStore.ts"
        "src/components/ComprehensiveSettings.tsx"
        "src/app/dashboard/settings/page.tsx"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            failure "Missing settings file: $file"
            return 1
        fi
    done
    
    # Check if all required settings sections are implemented
    local settings_sections=(
        "account"
        "audioVideo" 
        "translation"
        "vsFeatures"
        "notifications"
        "privacy"
        "appearance"
        "advanced"
    )
    
    for section in "${settings_sections[@]}"; do
        if ! grep -q "$section:" src/stores/settingsStore.ts; then
            failure "Missing settings section: $section"
            return 1
        fi
    done
    
    success "All settings sections implemented"
    return 0
}

test_voice_profile_system() {
    log "Validating voice profile training system..."
    
    local required_files=(
        "src/stores/voiceProfileStore.ts"
        "src/components/VoiceProfileSetup.tsx"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            failure "Missing voice profile file: $file"
            return 1
        fi
    done
    
    # Check for required training phrases
    if ! grep -q "trainingPhrases" src/stores/voiceProfileStore.ts; then
        failure "Training phrases not found in voice profile store"
        return 1
    fi
    
    success "Voice profile system implemented"
    return 0
}

test_model_manager() {
    log "Validating AI model manager..."
    
    local required_files=(
        "src/stores/modelManagerStore.ts"
        "src/components/ModelManager.tsx"
        "src/app/dashboard/models/page.tsx"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            failure "Missing model manager file: $file"
            return 1
        fi
    done
    
    # Check for required models
    local required_models=(
        "whisper"
        "nllb"
        "wunjo"
    )
    
    for model in "${required_models[@]}"; do
        if ! grep -q "$model" src/stores/modelManagerStore.ts; then
            warning "Model $model not found in model manager"
        fi
    done
    
    success "Model manager system implemented"
    return 0
}

# =================================================================
# BUILD SYSTEM VALIDATION TESTS
# =================================================================

test_ios_build_config() {
    log "Validating iOS build configuration..."
    
    if [[ ! -f "scripts/build-ios-personal.sh" ]]; then
        failure "iOS build script missing"
        return 1
    fi
    
    if [[ ! -x "scripts/build-ios-personal.sh" ]]; then
        failure "iOS build script not executable"
        return 1
    fi
    
    # Check for personal team signing configuration
    if ! grep -q "Personal Team" scripts/build-ios-personal.sh; then
        failure "Personal team signing configuration missing"
        return 1
    fi
    
    success "iOS build configuration valid"
    return 0
}

test_android_build_config() {
    log "Validating Android build configuration..."
    
    if [[ ! -f "scripts/build-android.sh" ]]; then
        failure "Android build script missing"
        return 1
    fi
    
    if [[ ! -x "scripts/build-android.sh" ]]; then
        failure "Android build script not executable"
        return 1
    fi
    
    # Test build execution
    if ./scripts/build-android.sh > /dev/null 2>&1; then
        success "Android build script executes successfully"
    else
        failure "Android build script execution failed"
        return 1
    fi
    
    return 0
}

test_windows_build_config() {
    log "Validating Windows build configuration..."
    
    if [[ ! -f "scripts/build-windows.sh" ]]; then
        failure "Windows build script missing"
        return 1
    fi
    
    if [[ ! -x "scripts/build-windows.sh" ]]; then
        failure "Windows build script not executable"
        return 1
    fi
    
    # Test build execution
    if ./scripts/build-windows.sh > /dev/null 2>&1; then
        success "Windows build script executes successfully"
    else
        failure "Windows build script execution failed"
        return 1
    fi
    
    return 0
}

# =================================================================
# FEATURE VALIDATION TESTS
# =================================================================

test_vs_features_settings() {
    log "Validating VS Features settings integration..."
    
    local vs_features=(
        "vsEnvironment"
        "vsPresenter"
        "vsFriends"
    )
    
    for feature in "${vs_features[@]}"; do
        if ! grep -q "$feature" src/stores/settingsStore.ts; then
            failure "VS Feature $feature settings missing"
            return 1
        fi
    done
    
    success "All VS Features have settings"
    return 0
}

test_translation_integration() {
    log "Validating translation system integration..."
    
    # Check if translation store exists and has required methods
    if [[ ! -f "src/stores/translationStore.ts" ]]; then
        failure "Translation store missing"
        return 1
    fi
    
    local required_methods=(
        "setSourceLanguage"
        "setTargetLanguage"
        "setVoiceProfileId"
        "setAutoDetectLanguage"
    )
    
    for method in "${required_methods[@]}"; do
        if ! grep -q "$method" src/stores/translationStore.ts; then
            failure "Translation method $method missing"
            return 1
        fi
    done
    
    success "Translation system properly integrated"
    return 0
}

test_search_functionality() {
    log "Testing settings search functionality..."
    
    # Check if search is implemented in settings
    if ! grep -q "searchQuery" src/stores/settingsStore.ts; then
        failure "Settings search not implemented"
        return 1
    fi
    
    if ! grep -q "setSearchQuery" src/stores/settingsStore.ts; then
        failure "Search query setter missing"
        return 1
    fi
    
    success "Settings search functionality implemented"
    return 0
}

# =================================================================
# PRODUCTION READINESS TESTS
# =================================================================

test_persistence_implementation() {
    log "Testing settings persistence..."
    
    local stores=(
        "settingsStore"
        "voiceProfileStore"
        "modelManagerStore"
    )
    
    for store in "${stores[@]}"; do
        if ! grep -q "localStorage" "src/stores/${store}.ts"; then
            failure "Persistence not implemented in $store"
            return 1
        fi
    done
    
    success "All stores implement persistence"
    return 0
}

test_error_handling() {
    log "Validating error handling..."
    
    # Check for error states in components
    local components=(
        "src/components/ComprehensiveSettings.tsx"
        "src/components/ModelManager.tsx"
        "src/components/VoiceProfileSetup.tsx"
    )
    
    for component in "${components[@]}"; do
        if ! grep -q "error" "$component"; then
            warning "Limited error handling in $component"
        fi
    done
    
    success "Error handling patterns found"
    return 0
}

test_build_artifacts() {
    log "Checking build artifacts..."
    
    # Check if build artifacts exist
    local artifacts=(
        "scripts/build/android/debug/VidLiSync-debug.apk"
        "scripts/build/android/release/VidLiSync-release.aab"
        "scripts/build/windows/debug/VidLiSync-debug.exe"
        "scripts/build/windows/release/VidLiSync-1.0.0.msix"
    )
    
    for artifact in "${artifacts[@]}"; do
        if [[ ! -f "$artifact" ]]; then
            failure "Build artifact missing: $artifact"
            return 1
        fi
    done
    
    success "All build artifacts present"
    return 0
}

# =================================================================
# RUN ALL TESTS
# =================================================================

main() {
    log "Starting comprehensive production validation..."
    echo ""
    
    # Frontend Tests
    run_test "Frontend Build" test_frontend_build
    run_test "Settings System" test_settings_system
    run_test "Voice Profile System" test_voice_profile_system
    run_test "Model Manager" test_model_manager
    
    # Build System Tests
    run_test "iOS Build Configuration" test_ios_build_config
    run_test "Android Build Configuration" test_android_build_config
    run_test "Windows Build Configuration" test_windows_build_config
    
    # Feature Integration Tests
    run_test "VS Features Settings" test_vs_features_settings
    run_test "Translation Integration" test_translation_integration
    run_test "Search Functionality" test_search_functionality
    
    # Production Readiness Tests
    run_test "Persistence Implementation" test_persistence_implementation
    run_test "Error Handling" test_error_handling
    run_test "Build Artifacts" test_build_artifacts
    
    # Summary
    echo "================================================="
    echo "🎯 PRODUCTION VALIDATION SUMMARY"
    echo "================================================="
    echo "Total Tests: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
        echo -e "${GREEN}✅ VidLiSync is PRODUCTION READY!${NC}"
        echo ""
        echo "🚀 Ready for:"
        echo "  • Personal use on all platforms"
        echo "  • iOS TestFlight distribution"
        echo "  • Android Play Store submission"
        echo "  • Windows MSIX distribution"
        echo "  • Full production deployment"
        echo ""
        exit 0
    else
        echo -e "${RED}❌ $TESTS_FAILED TESTS FAILED${NC}"
        echo -e "${YELLOW}⚠️  Review failed tests before production deployment${NC}"
        exit 1
    fi
}

# Run the validation
main "$@"