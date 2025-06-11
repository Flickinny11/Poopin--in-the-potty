"""
AI Configuration for VidLiSync Translation Pipeline
Model versions, settings, and environment configuration
"""
import os
import logging
from typing import Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

# Wunjo CE Model Versions (locked for consistency)
WUNJO_MODELS = {
    "voice_clone": "wunjo-voice-v2.1",
    "lip_sync": "wunjo-lips-v1.8", 
    "face_detect": "retinaface-resnet50",
    "whisper": "whisper-large-v3",
    "vocoder": "hifigan-universal-v1"
}

# Model Configuration
MODEL_CACHE_DIR = os.getenv("WUNJO_MODEL_PATH", "/tmp/models")
AUTO_DOWNLOAD = True
VERIFY_CHECKSUMS = True
MAX_CONCURRENT_STREAMS = int(os.getenv("MAX_CONCURRENT_STREAMS", "100"))
AUDIO_CHUNK_SIZE_MS = int(os.getenv("AUDIO_CHUNK_SIZE_MS", "100"))

# Performance Configuration
LATENCY_TARGET_MS = 400
GPU_MEMORY_LIMIT = os.getenv("PYTORCH_CUDA_ALLOC_CONF", "max_split_size_mb:512")
CUDA_DEVICE = os.getenv("CUDA_VISIBLE_DEVICES", "0")

# API Keys and Service Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_TRANSLATE_API_KEY = os.getenv("GOOGLE_TRANSLATE_API_KEY")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# Wunjo CE Configuration
WUNJO_REPO_URL = "https://github.com/wladradchenko/wunjo.wladradchenko.ru"
WUNJO_INSTALL_PATH = os.getenv("WUNJO_INSTALL_PATH", "/tmp/wunjo")

# Audio Processing Settings
SAMPLE_RATE = 16000
AUDIO_CHANNELS = 1
CHUNK_DURATION_MS = 100
BUFFER_SIZE = 1024

# Translation Quality Settings
TRANSLATION_ACCURACY_THRESHOLD = 0.95
VOICE_QUALITY_THRESHOLD = 0.8
LIP_SYNC_QUALITY_THRESHOLD = 0.8

# Supported Languages
SUPPORTED_LANGUAGES = [
    "en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", 
    "ar", "hi", "nl", "sv", "da", "no", "fi", "pl", "cs", "sk",
    "hu", "ro", "bg", "hr", "sl", "et", "lv", "lt", "mt", "tr"
]

def get_model_config() -> Dict[str, Any]:
    """Get complete model configuration"""
    return {
        "models": WUNJO_MODELS,
        "cache_dir": MODEL_CACHE_DIR,
        "auto_download": AUTO_DOWNLOAD,
        "verify_checksums": VERIFY_CHECKSUMS,
        "gpu_device": CUDA_DEVICE,
        "memory_limit": GPU_MEMORY_LIMIT
    }

def get_performance_config() -> Dict[str, Any]:
    """Get performance configuration"""
    return {
        "latency_target_ms": LATENCY_TARGET_MS,
        "max_concurrent_streams": MAX_CONCURRENT_STREAMS,
        "audio_chunk_size_ms": AUDIO_CHUNK_SIZE_MS,
        "sample_rate": SAMPLE_RATE,
        "audio_channels": AUDIO_CHANNELS,
        "chunk_duration_ms": CHUNK_DURATION_MS,
        "buffer_size": BUFFER_SIZE
    }

def get_api_config() -> Dict[str, Any]:
    """Get API configuration"""
    return {
        "openai_api_key": OPENAI_API_KEY,
        "google_translate_api_key": GOOGLE_TRANSLATE_API_KEY,
        "google_credentials": GOOGLE_APPLICATION_CREDENTIALS
    }

def validate_configuration() -> bool:
    """Validate that all required configuration is present"""
    # For development/testing, we'll allow missing API keys and use mock services
    missing_keys = []
    
    if not os.getenv("OPENAI_API_KEY"):
        logger.warning("OPENAI_API_KEY not set - Whisper service will use mock mode")
    
    if not os.getenv("GOOGLE_TRANSLATE_API_KEY") and not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        logger.warning("Google Translate credentials not set - Translation service will use mock mode")
    
    # Create model cache directory if it doesn't exist
    Path(MODEL_CACHE_DIR).mkdir(parents=True, exist_ok=True)
    
    # Return True to allow startup with mock services
    return True