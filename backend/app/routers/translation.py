"""
Translation API Routes
REST API endpoints for the AI translation pipeline
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.responses import Response
from pydantic import BaseModel, Field
import base64

from ..middleware.auth import get_current_user
from ..ai_services.translation_pipeline import TranslationPipeline
from ..ai_services.config import validate_configuration

logger = logging.getLogger(__name__)

# Global translation pipeline instance
translation_pipeline = None

# Pydantic models for request/response
class TranslationRequest(BaseModel):
    audio_data: str = Field(..., description="Base64 encoded audio data")
    target_language: str = Field(..., description="Target language code")
    source_language: Optional[str] = Field(None, description="Source language code (auto-detect if None)")
    voice_profile_id: Optional[str] = Field(None, description="Voice profile ID to use")
    include_lip_sync: bool = Field(False, description="Generate lip sync video")

class TranslationResponse(BaseModel):
    success: bool
    source_text: Optional[str] = None
    translated_text: Optional[str] = None
    synthesized_audio: Optional[str] = None  # Base64 encoded
    lip_sync_video: Optional[str] = None     # Base64 encoded
    detected_language: Optional[str] = None
    target_language: Optional[str] = None
    quality_metrics: Optional[Dict[str, Any]] = None
    performance_metrics: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class VoiceProfileTrainingRequest(BaseModel):
    name: str = Field(..., description="Profile name")
    language: str = Field(..., description="Training language")
    audio_samples: List[str] = Field(..., description="List of base64 encoded audio samples")

class StreamSessionRequest(BaseModel):
    target_language: str = Field(..., description="Target language code")
    source_language: Optional[str] = Field(None, description="Source language code")
    voice_profile_id: Optional[str] = Field(None, description="Voice profile ID")

class StreamSessionResponse(BaseModel):
    session_id: str
    websocket_url: str
    expires_at: str

# Create router
router = APIRouter()

@router.on_event("startup")
async def startup_translation_pipeline():
    """Initialize translation pipeline on startup"""
    global translation_pipeline
    
    try:
        # Validate configuration first
        validate_configuration()
        
        # Initialize pipeline
        translation_pipeline = TranslationPipeline()
        
        # Initialize in background task to avoid blocking startup
        asyncio.create_task(initialize_pipeline())
        
        logger.info("Translation pipeline startup initiated")
        
    except Exception as e:
        logger.error(f"Failed to start translation pipeline: {e}")
        # Don't raise here to avoid blocking entire app startup

async def initialize_pipeline():
    """Background task to initialize the pipeline"""
    global translation_pipeline
    
    try:
        if translation_pipeline:
            success = await translation_pipeline.initialize()
            if success:
                logger.info("Translation pipeline initialized successfully")
            else:
                logger.error("Translation pipeline initialization failed")
    except Exception as e:
        logger.error(f"Pipeline initialization error: {e}")

@router.get("/health")
async def health_check():
    """Health check endpoint for translation services"""
    global translation_pipeline
    
    if not translation_pipeline:
        raise HTTPException(status_code=503, detail="Translation pipeline not available")
    
    try:
        health_status = await translation_pipeline.health_check()
        
        if health_status["status"] == "healthy":
            return health_status
        else:
            raise HTTPException(status_code=503, detail=health_status)
            
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")

@router.get("/metrics")
async def get_metrics(current_user: dict = Depends(get_current_user)):
    """Get translation pipeline performance metrics"""
    global translation_pipeline
    
    if not translation_pipeline:
        raise HTTPException(status_code=503, detail="Translation pipeline not available")
    
    try:
        metrics = await translation_pipeline.get_performance_metrics()
        return metrics
        
    except Exception as e:
        logger.error(f"Metrics retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")

@router.post("/translate", response_model=TranslationResponse)
async def translate_speech(
    request: TranslationRequest,
    face_image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Translate speech from one language to another with voice cloning
    """
    global translation_pipeline
    
    if not translation_pipeline or not translation_pipeline.is_initialized:
        raise HTTPException(status_code=503, detail="Translation pipeline not available")
    
    try:
        # Decode audio data
        try:
            audio_data = base64.b64decode(request.audio_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 audio data")
        
        # Get user's voice profile data
        voice_profile_data = await get_voice_profile_data(
            current_user["id"], 
            request.voice_profile_id
        )
        
        # Handle face image for lip sync
        face_image_data = None
        if request.include_lip_sync and face_image:
            face_image_data = await face_image.read()
        elif request.include_lip_sync:
            raise HTTPException(status_code=400, detail="Face image required for lip sync")
        
        # Process translation
        result = await translation_pipeline.process_speech_to_speech(
            audio_data=audio_data,
            target_language=request.target_language,
            voice_profile_data=voice_profile_data,
            source_language=request.source_language,
            include_lip_sync=request.include_lip_sync,
            face_image=face_image_data
        )
        
        # Encode binary data for response
        response_data = TranslationResponse(
            success=result["success"],
            source_text=result.get("source_text"),
            translated_text=result.get("translated_text"),
            detected_language=result.get("detected_language"),
            target_language=result.get("target_language"),
            quality_metrics=result.get("quality_metrics"),
            performance_metrics=result.get("performance_metrics")
        )
        
        if result.get("synthesized_audio"):
            response_data.synthesized_audio = base64.b64encode(result["synthesized_audio"]).decode()
        
        if result.get("lip_sync_video"):
            response_data.lip_sync_video = base64.b64encode(result["lip_sync_video"]).decode()
        
        if not result["success"]:
            response_data.error = result.get("error")
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@router.post("/stream/create", response_model=StreamSessionResponse)
async def create_stream_session(
    request: StreamSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a streaming translation session
    """
    global translation_pipeline
    
    if not translation_pipeline or not translation_pipeline.is_initialized:
        raise HTTPException(status_code=503, detail="Translation pipeline not available")
    
    try:
        # Get voice profile data
        voice_profile_data = await get_voice_profile_data(
            current_user["id"], 
            request.voice_profile_id
        )
        
        # Create session
        session_id = await translation_pipeline.create_stream_session(
            user_id=str(current_user["id"]),
            voice_profile_data=voice_profile_data,
            target_language=request.target_language,
            source_language=request.source_language
        )
        
        # Generate WebSocket URL
        websocket_url = f"ws://localhost:8000/ws/translation/{session_id}"
        
        # Calculate expiration (1 hour from now)
        import datetime
        expires_at = (datetime.datetime.utcnow() + datetime.timedelta(hours=1)).isoformat()
        
        return StreamSessionResponse(
            session_id=session_id,
            websocket_url=websocket_url,
            expires_at=expires_at
        )
        
    except Exception as e:
        logger.error(f"Stream session creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create stream session: {str(e)}")

@router.delete("/stream/{session_id}")
async def close_stream_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Close a streaming translation session
    """
    global translation_pipeline
    
    if not translation_pipeline:
        raise HTTPException(status_code=503, detail="Translation pipeline not available")
    
    try:
        result = await translation_pipeline.close_stream_session(session_id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Stream session closure failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to close stream session: {str(e)}")

@router.post("/voice-profile/train")
async def train_voice_profile(
    request: VoiceProfileTrainingRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Train a new voice profile for the user
    """
    # This would integrate with the existing voice profile system
    # For now, return a placeholder response
    
    try:
        # Decode audio samples
        audio_samples = []
        for audio_b64 in request.audio_samples:
            try:
                audio_data = base64.b64decode(audio_b64)
                audio_samples.append(audio_data)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid base64 audio data in samples")
        
        # TODO: Implement actual voice profile training with Wunjo CE
        # This would involve:
        # 1. Processing audio samples
        # 2. Extracting voice features
        # 3. Training voice model
        # 4. Saving profile to database
        
        # For now, return success with placeholder data
        profile_data = {
            "id": f"profile_{int(asyncio.get_event_loop().time())}",
            "name": request.name,
            "language": request.language,
            "quality_score": 0.85,
            "training_duration": len(audio_samples) * 10,  # Assume 10 seconds per sample
            "features": {
                "fundamental_frequency": 150.0,
                "formants": [800, 1200, 2500],
                "voice_characteristics": "placeholder_features"
            }
        }
        
        return {
            "success": True,
            "profile_id": profile_data["id"],
            "quality_score": profile_data["quality_score"],
            "training_duration": profile_data["training_duration"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice profile training failed: {e}")
        raise HTTPException(status_code=500, detail=f"Voice profile training failed: {str(e)}")

@router.get("/languages")
async def get_supported_languages():
    """
    Get list of supported languages
    """
    global translation_pipeline
    
    if not translation_pipeline:
        raise HTTPException(status_code=503, detail="Translation pipeline not available")
    
    try:
        # Get languages from translation service
        languages = await translation_pipeline.translate_service.get_supported_languages()
        return {"languages": languages}
        
    except Exception as e:
        logger.error(f"Failed to get supported languages: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get supported languages: {str(e)}")

@router.post("/detect-language")
async def detect_language(
    audio_data: str = Form(..., description="Base64 encoded audio data"),
    current_user: dict = Depends(get_current_user)
):
    """
    Detect language from audio
    """
    global translation_pipeline
    
    if not translation_pipeline or not translation_pipeline.is_initialized:
        raise HTTPException(status_code=503, detail="Translation pipeline not available")
    
    try:
        # Decode audio data
        try:
            audio_bytes = base64.b64decode(audio_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 audio data")
        
        # Detect language using Whisper
        result = await translation_pipeline.whisper_service.detect_language(audio_bytes)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Language detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Language detection failed: {str(e)}")

# Helper function to get voice profile data
async def get_voice_profile_data(user_id: str, profile_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get voice profile data for user
    """
    # This would integrate with the existing database
    # For now, return placeholder data
    
    return {
        "id": profile_id or "default",
        "user_id": user_id,
        "quality_score": 0.85,
        "features": {
            "fundamental_frequency": 150.0,
            "formants": [800, 1200, 2500],
            "voice_characteristics": "placeholder_features"
        },
        "language": "en",
        "training_duration": 300  # 5 minutes
    }