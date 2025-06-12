#!/bin/bash

# VidLiSync Model Download Script
# Downloads and manages AI models for offline translation

set -e

echo "🤖 VidLiSync Model Manager"
echo "=========================="

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

# Model configuration
MODELS_DIR="./public/models"
MODELS_CONFIG="./src/config/models.json"

# Model definitions
declare -A MODELS
MODELS[whisper_large_v3]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin|1610000000|Speech recognition"
MODELS[nllb_200_distilled]="https://huggingface.co/facebook/nllb-200-distilled-600M/resolve/main/pytorch_model.bin|2400000000|Translation"
MODELS[wunjo_voice_v2_1]="https://github.com/wladradchenko/wunjo.wladradchenko.ru/releases/download/v2.1/voice-model.bin|500000000|Voice cloning"
MODELS[wunjo_lips_v1_8]="https://github.com/wladradchenko/wunjo.wladradchenko.ru/releases/download/v1.8/lips-model.bin|800000000|Lip sync"

# Create models directory
mkdir -p "$MODELS_DIR"
mkdir -p "$(dirname "$MODELS_CONFIG")"

# Function: Format bytes
format_bytes() {
    local bytes=$1
    if [ $bytes -gt 1073741824 ]; then
        echo "$(($bytes / 1073741824))GB"
    elif [ $bytes -gt 1048576 ]; then
        echo "$(($bytes / 1048576))MB"
    else
        echo "$(($bytes / 1024))KB"
    fi
}

# Function: Check if model exists
model_exists() {
    local model_id=$1
    local model_info="${MODELS[$model_id]}"
    local url=$(echo "$model_info" | cut -d'|' -f1)
    local filename=$(basename "$url")
    local filepath="$MODELS_DIR/$model_id/$filename"
    
    [ -f "$filepath" ]
}

# Function: Get model size
get_model_size() {
    local model_id=$1
    local model_info="${MODELS[$model_id]}"
    echo $(echo "$model_info" | cut -d'|' -f2)
}

# Function: Get model description
get_model_description() {
    local model_id=$1
    local model_info="${MODELS[$model_id]}"
    echo $(echo "$model_info" | cut -d'|' -f3)
}

# Function: Download model with progress
download_model() {
    local model_id=$1
    
    if [ -z "${MODELS[$model_id]}" ]; then
        error "Unknown model: $model_id"
        return 1
    fi
    
    local model_info="${MODELS[$model_id]}"
    local url=$(echo "$model_info" | cut -d'|' -f1)
    local size=$(echo "$model_info" | cut -d'|' -f2)
    local description=$(echo "$model_info" | cut -d'|' -f3)
    local filename=$(basename "$url")
    local model_dir="$MODELS_DIR/$model_id"
    local filepath="$model_dir/$filename"
    
    log "Downloading $model_id ($description)"
    log "Size: $(format_bytes $size)"
    log "URL: $url"
    
    # Check if already exists
    if model_exists "$model_id"; then
        warning "Model $model_id already exists at $filepath"
        read -p "Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Download cancelled"
            return 0
        fi
    fi
    
    # Create model directory
    mkdir -p "$model_dir"
    
    # Check available space
    local available_space=$(df "$MODELS_DIR" | tail -1 | awk '{print $4}')
    local required_space=$((size / 1024))
    
    if [ $available_space -lt $required_space ]; then
        error "Not enough disk space. Required: $(format_bytes $size), Available: $(format_bytes $((available_space * 1024)))"
        return 1
    fi
    
    # Download with progress
    log "Starting download..."
    
    if command -v curl &> /dev/null; then
        curl -L --progress-bar -o "$filepath.tmp" "$url"
    elif command -v wget &> /dev/null; then
        wget --progress=bar -O "$filepath.tmp" "$url"
    else
        error "Neither curl nor wget found. Please install one of them."
        return 1
    fi
    
    if [ $? -eq 0 ]; then
        # Verify file size
        local actual_size=$(stat -f%z "$filepath.tmp" 2>/dev/null || stat -c%s "$filepath.tmp" 2>/dev/null)
        
        if [ "$actual_size" -eq "$size" ]; then
            mv "$filepath.tmp" "$filepath"
            success "Model $model_id downloaded successfully"
            
            # Create metadata file
            cat > "$model_dir/metadata.json" << EOF
{
  "id": "$model_id",
  "filename": "$filename",
  "size": $size,
  "description": "$description",
  "url": "$url",
  "downloaded_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "checksum": "$(shasum -a 256 "$filepath" | cut -d' ' -f1)"
}
EOF
            
            log "Metadata saved to $model_dir/metadata.json"
        else
            rm -f "$filepath.tmp"
            error "Download verification failed. Expected size: $size, Actual size: $actual_size"
            return 1
        fi
    else
        rm -f "$filepath.tmp"
        error "Download failed"
        return 1
    fi
}

# Function: Verify model integrity
verify_model() {
    local model_id=$1
    
    if ! model_exists "$model_id"; then
        error "Model $model_id not found"
        return 1
    fi
    
    local model_info="${MODELS[$model_id]}"
    local url=$(echo "$model_info" | cut -d'|' -f1)
    local expected_size=$(echo "$model_info" | cut -d'|' -f2)
    local filename=$(basename "$url")
    local filepath="$MODELS_DIR/$model_id/$filename"
    
    log "Verifying $model_id..."
    
    # Check file size
    local actual_size=$(stat -f%z "$filepath" 2>/dev/null || stat -c%s "$filepath" 2>/dev/null)
    
    if [ "$actual_size" -eq "$expected_size" ]; then
        success "Model $model_id verification passed"
        return 0
    else
        error "Model $model_id verification failed. Expected: $expected_size, Actual: $actual_size"
        return 1
    fi
}

# Function: Delete model
delete_model() {
    local model_id=$1
    
    if ! model_exists "$model_id"; then
        warning "Model $model_id not found"
        return 0
    fi
    
    local model_dir="$MODELS_DIR/$model_id"
    
    warning "This will permanently delete model $model_id"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$model_dir"
        success "Model $model_id deleted"
    else
        log "Deletion cancelled"
    fi
}

# Function: List models
list_models() {
    echo ""
    echo "📋 Available Models"
    echo "==================="
    
    for model_id in "${!MODELS[@]}"; do
        local model_info="${MODELS[$model_id]}"
        local size=$(echo "$model_info" | cut -d'|' -f2)
        local description=$(echo "$model_info" | cut -d'|' -f3)
        local status="❌ Not downloaded"
        
        if model_exists "$model_id"; then
            status="✅ Downloaded"
        fi
        
        echo ""
        echo "🔹 $model_id"
        echo "   Description: $description"
        echo "   Size: $(format_bytes $size)"
        echo "   Status: $status"
    done
    
    echo ""
}

# Function: Show storage usage
show_storage() {
    echo ""
    echo "💾 Storage Usage"
    echo "================"
    
    if [ ! -d "$MODELS_DIR" ]; then
        echo "Models directory not found"
        return
    fi
    
    local total_size=0
    
    for model_id in "${!MODELS[@]}"; do
        if model_exists "$model_id"; then
            local model_info="${MODELS[$model_id]}"
            local size=$(echo "$model_info" | cut -d'|' -f2)
            total_size=$((total_size + size))
            echo "✅ $model_id: $(format_bytes $size)"
        fi
    done
    
    echo ""
    echo "Total downloaded: $(format_bytes $total_size)"
    
    # Show disk usage
    local disk_usage=$(du -sh "$MODELS_DIR" 2>/dev/null | cut -f1)
    echo "Disk usage: $disk_usage"
    
    # Show available space
    local available=$(df -h "$MODELS_DIR" | tail -1 | awk '{print $4}')
    echo "Available space: $available"
    
    echo ""
}

# Function: Download required models
download_required() {
    log "Downloading required models for basic functionality..."
    
    # Download core models
    download_model "whisper_large_v3"
    download_model "nllb_200_distilled"
    
    success "Required models downloaded"
}

# Function: Download all models
download_all() {
    log "Downloading all available models..."
    
    for model_id in "${!MODELS[@]}"; do
        download_model "$model_id"
    done
    
    success "All models downloaded"
}

# Function: Verify all models
verify_all() {
    log "Verifying all downloaded models..."
    
    local failed=0
    
    for model_id in "${!MODELS[@]}"; do
        if model_exists "$model_id"; then
            if ! verify_model "$model_id"; then
                failed=$((failed + 1))
            fi
        fi
    done
    
    if [ $failed -eq 0 ]; then
        success "All models verified successfully"
    else
        error "$failed model(s) failed verification"
        return 1
    fi
}

# Function: Clean up corrupted models
cleanup() {
    log "Cleaning up corrupted models..."
    
    for model_id in "${!MODELS[@]}"; do
        if model_exists "$model_id"; then
            if ! verify_model "$model_id" 2>/dev/null; then
                warning "Removing corrupted model: $model_id"
                rm -rf "$MODELS_DIR/$model_id"
            fi
        fi
    done
    
    success "Cleanup completed"
}

# Function: Generate models config for app
generate_config() {
    log "Generating models configuration..."
    
    cat > "$MODELS_CONFIG" << 'EOF'
{
  "models": {
    "whisper": {
      "id": "whisper_large_v3",
      "name": "Whisper Large v3",
      "type": "speech_recognition",
      "required": true,
      "path": "/models/whisper_large_v3/ggml-large-v3.bin",
      "size": 1610000000,
      "description": "Advanced speech recognition model supporting 99+ languages"
    },
    "translation": {
      "id": "nllb_200_distilled",
      "name": "NLLB-200 Distilled",
      "type": "translation",
      "required": true,
      "path": "/models/nllb_200_distilled/pytorch_model.bin",
      "size": 2400000000,
      "description": "High-quality translation model supporting 200+ languages"
    },
    "voice_cloning": {
      "id": "wunjo_voice_v2_1",
      "name": "Wunjo Voice v2.1",
      "type": "voice_synthesis",
      "required": false,
      "path": "/models/wunjo_voice_v2_1/voice-model.bin",
      "size": 500000000,
      "description": "Voice cloning model for preserving speaker characteristics"
    },
    "lip_sync": {
      "id": "wunjo_lips_v1_8",
      "name": "Wunjo Lips v1.8",
      "type": "lip_sync",
      "required": false,
      "path": "/models/wunjo_lips_v1_8/lips-model.bin",
      "size": 800000000,
      "description": "Lip synchronization model for realistic video translation"
    }
  },
  "download_urls": {
    "whisper_large_v3": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin",
    "nllb_200_distilled": "https://huggingface.co/facebook/nllb-200-distilled-600M/resolve/main/pytorch_model.bin",
    "wunjo_voice_v2_1": "https://github.com/wladradchenko/wunjo.wladradchenko.ru/releases/download/v2.1/voice-model.bin",
    "wunjo_lips_v1_8": "https://github.com/wladradchenko/wunjo.wladradchenko.ru/releases/download/v1.8/lips-model.bin"
  },
  "total_size": {
    "required": 4010000000,
    "optional": 1300000000,
    "all": 5310000000
  }
}
EOF

    success "Models configuration generated: $MODELS_CONFIG"
}

# Main execution
case "${1:-list}" in
    "download")
        if [ -n "$2" ]; then
            download_model "$2"
        else
            echo "Usage: $0 download <model_id>"
            echo "Available models: ${!MODELS[@]}"
        fi
        ;;
    "verify")
        if [ -n "$2" ]; then
            verify_model "$2"
        else
            verify_all
        fi
        ;;
    "delete")
        if [ -n "$2" ]; then
            delete_model "$2"
        else
            echo "Usage: $0 delete <model_id>"
        fi
        ;;
    "list")
        list_models
        ;;
    "storage")
        show_storage
        ;;
    "required")
        download_required
        ;;
    "all")
        download_all
        ;;
    "cleanup")
        cleanup
        ;;
    "config")
        generate_config
        ;;
    *)
        echo "Usage: $0 {list|download|verify|delete|storage|required|all|cleanup|config}"
        echo ""
        echo "Commands:"
        echo "  list            - List all available models"
        echo "  download <id>   - Download specific model"
        echo "  verify [id]     - Verify model integrity (all if no id)"
        echo "  delete <id>     - Delete specific model"
        echo "  storage         - Show storage usage"
        echo "  required        - Download required models only"
        echo "  all             - Download all models"
        echo "  cleanup         - Remove corrupted models"
        echo "  config          - Generate models.json config"
        echo ""
        echo "Available models: ${!MODELS[@]}"
        exit 1
        ;;
esac