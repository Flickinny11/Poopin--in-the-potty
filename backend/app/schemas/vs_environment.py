"""
VS Environment Schemas
Pydantic models for VS Environment API requests and responses
Created for issue #40 - VidLiSync VS Environment: Real-time Environmental Translation for Mobile
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class OutputMode(str, Enum):
    """Output mode for VS Environment translation"""
    AUDIO_ONLY = "audio"
    TEXT_ONLY = "text"
    BOTH = "both"

class AudioDevice(str, Enum):
    """Audio device types for VS Environment"""
    DEVICE_MICROPHONE = "device_mic"
    DEVICE_SPEAKER = "device_speaker"
    BLUETOOTH = "bluetooth"

class VSEnvironmentConfig(BaseModel):
    """Configuration for VS Environment session"""
    target_language: str = Field(..., description="Target language code (e.g., 'en', 'es')")
    source_language: Optional[str] = Field(None, description="Source language code (auto-detect if None)")
    use_voice_cloning: bool = Field(True, description="Enable voice cloning for translated audio")
    output_mode: OutputMode = Field(OutputMode.AUDIO_ONLY, description="Translation output mode")
    input_device: AudioDevice = Field(AudioDevice.DEVICE_MICROPHONE, description="Audio input device")
    output_device: AudioDevice = Field(AudioDevice.DEVICE_SPEAKER, description="Audio output device")
    recording_enabled: bool = Field(False, description="Enable session recording")
    noise_reduction: bool = Field(True, description="Enable noise reduction")
    auto_language_detection: bool = Field(True, description="Enable automatic language detection")
    voice_profile: Optional[Dict[str, Any]] = Field(None, description="User's voice profile for cloning")
    
    class Config:
        schema_extra = {
            "example": {
                "target_language": "es",
                "source_language": "en",
                "use_voice_cloning": True,
                "output_mode": "both",
                "input_device": "bluetooth",
                "output_device": "bluetooth",
                "recording_enabled": True,
                "noise_reduction": True,
                "auto_language_detection": True,
                "voice_profile": {
                    "profile_id": "user_voice_profile_123",
                    "training_samples": 10,
                    "quality_score": 0.95
                }
            }
        }

class VSEnvironmentSession(BaseModel):
    """VS Environment session model"""
    session_id: str = Field(..., description="Unique session identifier")
    user_id: str = Field(..., description="User ID who owns the session")
    config: VSEnvironmentConfig = Field(..., description="Session configuration")
    created_at: datetime = Field(..., description="Session creation timestamp")
    ended_at: Optional[datetime] = Field(None, description="Session end timestamp")
    is_active: bool = Field(True, description="Whether session is currently active")
    websocket_connected: bool = Field(False, description="Whether WebSocket is connected")
    usage_stats: Dict[str, Any] = Field(default_factory=lambda: {
        "chunks_processed": 0,
        "total_processing_time_ms": 0,
        "audio_minutes": 0,
        "translations_count": 0
    }, description="Session usage statistics")
    
    class Config:
        schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "user_123",
                "config": {
                    "target_language": "es",
                    "use_voice_cloning": True,
                    "output_mode": "both"
                },
                "created_at": "2024-01-15T10:30:00Z",
                "ended_at": None,
                "is_active": True,
                "websocket_connected": True,
                "usage_stats": {
                    "chunks_processed": 150,
                    "total_processing_time_ms": 45000,
                    "audio_minutes": 5.2,
                    "translations_count": 23
                }
            }
        }

class TranslationResult(BaseModel):
    """Translation result from VS Environment processing"""
    original_text: str = Field(..., description="Original transcribed text")
    translated_text: str = Field(..., description="Translated text")
    detected_language: str = Field(..., description="Detected source language")
    target_language: str = Field(..., description="Target language")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Translation confidence score")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    has_audio: bool = Field(False, description="Whether translated audio is available")
    audio_duration_ms: Optional[float] = Field(None, description="Audio duration in milliseconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Result timestamp")
    
    class Config:
        schema_extra = {
            "example": {
                "original_text": "Hello, how are you today?",
                "translated_text": "Hola, ¿cómo estás hoy?",
                "detected_language": "en",
                "target_language": "es",
                "confidence": 0.95,
                "processing_time_ms": 285.5,
                "has_audio": True,
                "audio_duration_ms": 2100,
                "timestamp": "2024-01-15T10:30:15Z"
            }
        }

class VSEnvironmentUsage(BaseModel):
    """VS Environment usage statistics"""
    user_id: str = Field(..., description="User ID")
    monthly_usage_minutes: float = Field(..., description="Monthly usage in minutes")
    monthly_limit_minutes: int = Field(..., description="Monthly limit in minutes (-1 for unlimited)")
    subscription_tier: str = Field(..., description="User's subscription tier")
    usage_percentage: float = Field(..., ge=0.0, le=100.0, description="Usage percentage of limit")
    can_use_vs_environment: bool = Field(..., description="Whether user can use VS Environment")
    sessions_this_month: int = Field(0, description="Number of sessions this month")
    total_translations: int = Field(0, description="Total translations this month")
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "user_123",
                "monthly_usage_minutes": 45.5,
                "monthly_limit_minutes": 300,
                "subscription_tier": "pro",
                "usage_percentage": 15.17,
                "can_use_vs_environment": True,
                "sessions_this_month": 8,
                "total_translations": 156
            }
        }

class VSEnvironmentSessionCreate(BaseModel):
    """Request model for creating VS Environment session"""
    config: VSEnvironmentConfig = Field(..., description="Session configuration")
    
    class Config:
        schema_extra = {
            "example": {
                "config": {
                    "target_language": "fr",
                    "source_language": "en",
                    "use_voice_cloning": True,
                    "output_mode": "both",
                    "recording_enabled": False
                }
            }
        }

class VSEnvironmentSessionResponse(BaseModel):
    """Response model for VS Environment session creation"""
    session_id: str = Field(..., description="Created session ID")
    websocket_url: str = Field(..., description="WebSocket URL for real-time communication")
    status: str = Field(..., description="Session creation status")
    expires_at: Optional[datetime] = Field(None, description="Session expiration time")
    
    class Config:
        schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "websocket_url": "/vs-environment/ws/550e8400-e29b-41d4-a716-446655440000",
                "status": "created",
                "expires_at": "2024-01-15T18:30:00Z"
            }
        }

class VSEnvironmentHealthCheck(BaseModel):
    """Health check response for VS Environment service"""
    status: str = Field(..., description="Service health status")
    active_sessions: int = Field(..., description="Number of active sessions")
    websocket_connections: int = Field(..., description="Number of active WebSocket connections")
    translation_pipeline: Dict[str, Any] = Field(..., description="Translation pipeline health")
    timestamp: datetime = Field(..., description="Health check timestamp")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "active_sessions": 12,
                "websocket_connections": 8,
                "translation_pipeline": {
                    "status": "healthy",
                    "services": {
                        "whisper": {"status": "healthy"},
                        "google_translate": {"status": "healthy"},
                        "wunjo_ce": {"status": "healthy"}
                    }
                },
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }

class WebSocketMessage(BaseModel):
    """Base WebSocket message model"""
    type: str = Field(..., description="Message type")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")

class ConfigUpdateMessage(WebSocketMessage):
    """WebSocket message for configuration updates"""
    type: str = Field("config_update", const=True)
    config: Dict[str, Any] = Field(..., description="Configuration updates")

class LanguageSwapMessage(WebSocketMessage):
    """WebSocket message for language swapping"""
    type: str = Field("language_swap", const=True)

class PingMessage(WebSocketMessage):
    """WebSocket ping message"""
    type: str = Field("ping", const=True)

class TranslationMessage(WebSocketMessage):
    """WebSocket message for translation results"""
    type: str = Field("translation", const=True)
    original_text: str = Field(..., description="Original text")
    translated_text: str = Field(..., description="Translated text")
    detected_language: str = Field(..., description="Detected language")
    confidence: float = Field(..., description="Translation confidence")
    processing_time_ms: float = Field(..., description="Processing time")

class ErrorMessage(WebSocketMessage):
    """WebSocket error message"""
    type: str = Field("error", const=True)
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")

class LanguagesSwappedMessage(WebSocketMessage):
    """WebSocket message confirming language swap"""
    type: str = Field("languages_swapped", const=True)
    target_language: str = Field(..., description="New target language")
    source_language: str = Field(..., description="New source language")

class PongMessage(WebSocketMessage):
    """WebSocket pong response"""
    type: str = Field("pong", const=True)

# Export all schemas
__all__ = [
    "OutputMode",
    "AudioDevice", 
    "VSEnvironmentConfig",
    "VSEnvironmentSession",
    "TranslationResult",
    "VSEnvironmentUsage",
    "VSEnvironmentSessionCreate",
    "VSEnvironmentSessionResponse",
    "VSEnvironmentHealthCheck",
    "WebSocketMessage",
    "ConfigUpdateMessage",
    "LanguageSwapMessage",
    "PingMessage",
    "TranslationMessage",
    "ErrorMessage",
    "LanguagesSwappedMessage",
    "PongMessage"
]
