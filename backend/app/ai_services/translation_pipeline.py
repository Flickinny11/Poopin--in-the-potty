"""
Translation Pipeline Coordinator
Orchestrates the complete speech-to-speech translation process
"""
import asyncio
import time
import logging
from typing import Dict, Any, Optional, List, Tuple
import json
from datetime import datetime

from .wunjo_service import WunjoCEService
from .whisper_service import WhisperService
from .translate_service import GoogleTranslateService
from .config import (
    LATENCY_TARGET_MS, MAX_CONCURRENT_STREAMS, TRANSLATION_ACCURACY_THRESHOLD,
    VOICE_QUALITY_THRESHOLD, LIP_SYNC_QUALITY_THRESHOLD
)

logger = logging.getLogger(__name__)

class TranslationPipeline:
    """Main coordinator for the AI translation pipeline"""
    
    def __init__(self):
        self.wunjo_service = WunjoCEService()
        self.whisper_service = WhisperService()
        self.translate_service = GoogleTranslateService()
        
        self.is_initialized = False
        self.active_streams = {}
        self.performance_metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "average_latency_ms": 0,
            "active_streams": 0
        }
        
    async def initialize(self) -> bool:
        """Initialize all AI services"""
        try:
            logger.info("Initializing AI translation pipeline...")
            
            # Initialize services in parallel
            init_tasks = [
                self.wunjo_service.initialize(),
                self.whisper_service.initialize(),
                self.translate_service.initialize()
            ]
            
            results = await asyncio.gather(*init_tasks, return_exceptions=True)
            
            # Check results
            services = ["Wunjo CE", "Whisper", "Google Translate"]
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Failed to initialize {services[i]}: {result}")
                    return False
                elif not result:
                    logger.error(f"Failed to initialize {services[i]}")
                    return False
            
            # Verify model versions
            if not await self.wunjo_service.verify_model_versions():
                logger.error("Model version verification failed")
                return False
            
            self.is_initialized = True
            logger.info("AI translation pipeline initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Pipeline initialization failed: {e}")
            return False
    
    async def process_speech_to_speech(
        self,
        audio_data: bytes,
        target_language: str,
        voice_profile_data: Dict[str, Any],
        source_language: Optional[str] = None,
        include_lip_sync: bool = False,
        face_image: Optional[bytes] = None
    ) -> Dict[str, Any]:
        """
        Complete speech-to-speech translation pipeline
        
        Args:
            audio_data: Input audio data
            target_language: Target language for translation
            voice_profile_data: User's voice profile for cloning
            source_language: Source language (auto-detect if None)
            include_lip_sync: Whether to generate lip sync video
            face_image: Face image for lip sync (required if include_lip_sync=True)
            
        Returns:
            Complete translation result with audio, text, and optional video
        """
        if not self.is_initialized:
            raise RuntimeError("Translation pipeline not initialized")
        
        start_time = time.time()
        
        try:
            # Update metrics
            self.performance_metrics["total_requests"] += 1
            
            # Step 1: Speech-to-Text
            logger.debug("Starting speech-to-text conversion...")
            stt_start = time.time()
            
            transcription_result = await self.whisper_service.transcribe_audio(
                audio_data,
                language=source_language,
                response_format="verbose_json"
            )
            
            stt_time = (time.time() - stt_start) * 1000
            logger.debug(f"Speech-to-text completed in {stt_time:.1f}ms")
            
            # Extract text and detected language
            source_text = transcription_result["text"]
            detected_language = transcription_result["language"]
            stt_confidence = transcription_result["confidence"]
            
            if not source_text.strip():
                return self._create_error_result("No speech detected in audio", start_time)
            
            # Step 2: Text Translation
            logger.debug("Starting text translation...")
            translate_start = time.time()
            
            translation_result = await self.translate_service.translate_text(
                source_text,
                target_language,
                source_language=detected_language
            )
            
            translate_time = (time.time() - translate_start) * 1000
            logger.debug(f"Text translation completed in {translate_time:.1f}ms")
            
            translated_text = translation_result["translatedText"]
            translation_confidence = translation_result["confidence"]
            
            # Optimize text for speech synthesis
            optimized_text = await self.translate_service.optimize_for_speech(
                translated_text, target_language
            )
            
            # Step 3: Voice Cloning and Speech Synthesis
            logger.debug("Starting voice cloning...")
            tts_start = time.time()
            
            synthesized_audio = await self.wunjo_service.clone_voice(
                optimized_text,
                voice_profile_data,
                target_language=target_language
            )
            
            tts_time = (time.time() - tts_start) * 1000
            logger.debug(f"Voice cloning completed in {tts_time:.1f}ms")
            
            # Step 4: Lip Synchronization (optional)
            lip_sync_data = None
            lip_sync_time = 0
            
            if include_lip_sync and face_image:
                logger.debug("Starting lip synchronization...")
                lip_sync_start = time.time()
                
                lip_sync_data = await self.wunjo_service.generate_lip_sync(
                    synthesized_audio,
                    face_image,
                    output_format="mp4"
                )
                
                lip_sync_time = (time.time() - lip_sync_start) * 1000
                logger.debug(f"Lip synchronization completed in {lip_sync_time:.1f}ms")
            
            # Calculate total processing time
            total_time = (time.time() - start_time) * 1000
            
            # Check latency requirement
            meets_latency = total_time <= LATENCY_TARGET_MS
            
            # Calculate overall quality score
            quality_score = self._calculate_quality_score(
                stt_confidence, translation_confidence, 
                voice_profile_data.get("quality_score", 0.8)
            )
            
            # Create result
            result = {
                "success": True,
                "source_text": source_text,
                "translated_text": translated_text,
                "optimized_text": optimized_text,
                "synthesized_audio": synthesized_audio,
                "lip_sync_video": lip_sync_data,
                "detected_language": detected_language,
                "target_language": target_language,
                "quality_metrics": {
                    "overall_quality": quality_score,
                    "stt_confidence": stt_confidence,
                    "translation_confidence": translation_confidence,
                    "voice_quality": voice_profile_data.get("quality_score", 0.8),
                    "meets_accuracy_threshold": (
                        stt_confidence >= TRANSLATION_ACCURACY_THRESHOLD and
                        translation_confidence >= TRANSLATION_ACCURACY_THRESHOLD
                    ),
                    "meets_voice_threshold": voice_profile_data.get("quality_score", 0.8) >= VOICE_QUALITY_THRESHOLD
                },
                "performance_metrics": {
                    "total_time_ms": total_time,
                    "stt_time_ms": stt_time,
                    "translation_time_ms": translate_time,
                    "tts_time_ms": tts_time,
                    "lip_sync_time_ms": lip_sync_time,
                    "meets_latency_target": meets_latency,
                    "latency_target_ms": LATENCY_TARGET_MS
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Update success metrics
            self.performance_metrics["successful_requests"] += 1
            self._update_average_latency(total_time)
            
            logger.info(f"Translation pipeline completed successfully in {total_time:.1f}ms")
            return result
            
        except Exception as e:
            logger.error(f"Translation pipeline failed: {e}")
            return self._create_error_result(str(e), start_time)
    
    def _calculate_quality_score(
        self, 
        stt_confidence: float, 
        translation_confidence: float, 
        voice_quality: float
    ) -> float:
        """Calculate overall quality score"""
        weights = {
            "stt": 0.3,
            "translation": 0.4,
            "voice": 0.3
        }
        
        score = (
            stt_confidence * weights["stt"] +
            translation_confidence * weights["translation"] +
            voice_quality * weights["voice"]
        )
        
        return min(1.0, max(0.0, score))
    
    def _create_error_result(self, error_message: str, start_time: float) -> Dict[str, Any]:
        """Create error result with timing information"""
        total_time = (time.time() - start_time) * 1000
        
        return {
            "success": False,
            "error": error_message,
            "performance_metrics": {
                "total_time_ms": total_time,
                "meets_latency_target": False
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _update_average_latency(self, new_latency: float) -> None:
        """Update rolling average latency"""
        current_avg = self.performance_metrics["average_latency_ms"]
        total_requests = self.performance_metrics["successful_requests"]
        
        if total_requests == 1:
            self.performance_metrics["average_latency_ms"] = new_latency
        else:
            # Exponential moving average with alpha=0.1
            alpha = 0.1
            self.performance_metrics["average_latency_ms"] = (
                alpha * new_latency + (1 - alpha) * current_avg
            )
    
    async def create_stream_session(
        self, 
        user_id: str, 
        voice_profile_data: Dict[str, Any],
        target_language: str,
        source_language: Optional[str] = None
    ) -> str:
        """
        Create a streaming translation session
        
        Args:
            user_id: User identifier
            voice_profile_data: User's voice profile
            target_language: Target language
            source_language: Source language
            
        Returns:
            Session ID for streaming
        """
        if not self.is_initialized:
            raise RuntimeError("Translation pipeline not initialized")
        
        if len(self.active_streams) >= MAX_CONCURRENT_STREAMS:
            raise RuntimeError("Maximum concurrent streams reached")
        
        session_id = f"stream_{user_id}_{int(time.time())}"
        
        self.active_streams[session_id] = {
            "user_id": user_id,
            "voice_profile": voice_profile_data,
            "target_language": target_language,
            "source_language": source_language,
            "created_at": datetime.utcnow(),
            "chunk_count": 0,
            "buffer": []
        }
        
        self.performance_metrics["active_streams"] = len(self.active_streams)
        
        logger.info(f"Created streaming session: {session_id}")
        return session_id
    
    async def process_stream_chunk(
        self, 
        session_id: str, 
        audio_chunk: bytes
    ) -> Dict[str, Any]:
        """
        Process audio chunk in streaming session
        
        Args:
            session_id: Session identifier
            audio_chunk: Audio chunk data
            
        Returns:
            Partial translation result
        """
        if session_id not in self.active_streams:
            raise ValueError(f"Invalid session ID: {session_id}")
        
        session = self.active_streams[session_id]
        session["chunk_count"] += 1
        session["buffer"].append(audio_chunk)
        
        # Process chunk if buffer is large enough
        if len(session["buffer"]) >= 5:  # Process every 5 chunks
            combined_audio = b"".join(session["buffer"])
            session["buffer"] = []
            
            result = await self.process_speech_to_speech(
                combined_audio,
                session["target_language"],
                session["voice_profile"],
                source_language=session["source_language"]
            )
            
            return result
        
        return {"success": True, "buffering": True}
    
    async def close_stream_session(self, session_id: str) -> Dict[str, Any]:
        """Close streaming session and return final results"""
        if session_id not in self.active_streams:
            raise ValueError(f"Invalid session ID: {session_id}")
        
        session = self.active_streams.pop(session_id)
        self.performance_metrics["active_streams"] = len(self.active_streams)
        
        # Process any remaining buffer
        final_result = None
        if session["buffer"]:
            combined_audio = b"".join(session["buffer"])
            final_result = await self.process_speech_to_speech(
                combined_audio,
                session["target_language"],
                session["voice_profile"],
                source_language=session["source_language"]
            )
        
        logger.info(f"Closed streaming session: {session_id}")
        return {
            "session_closed": True,
            "chunks_processed": session["chunk_count"],
            "final_result": final_result
        }
    
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics"""
        return {
            **self.performance_metrics,
            "services_status": {
                "wunjo_ce": "healthy" if self.wunjo_service.is_initialized else "unhealthy",
                "whisper": "healthy" if self.whisper_service.is_initialized else "unhealthy",
                "google_translate": "healthy" if self.translate_service.is_initialized else "unhealthy"
            },
            "thresholds": {
                "latency_target_ms": LATENCY_TARGET_MS,
                "translation_accuracy": TRANSLATION_ACCURACY_THRESHOLD,
                "voice_quality": VOICE_QUALITY_THRESHOLD,
                "lip_sync_quality": LIP_SYNC_QUALITY_THRESHOLD
            }
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check of all services"""
        if not self.is_initialized:
            return {"status": "unhealthy", "error": "Pipeline not initialized"}
        
        try:
            # Run health checks in parallel
            health_tasks = [
                self.whisper_service.health_check(),
                self.translate_service.health_check()
            ]
            
            # Wunjo CE doesn't have health check method, so we'll check initialization
            wunjo_health = {"status": "healthy" if self.wunjo_service.is_initialized else "unhealthy"}
            
            results = await asyncio.gather(*health_tasks, return_exceptions=True)
            
            service_health = {
                "wunjo_ce": wunjo_health,
                "whisper": results[0] if not isinstance(results[0], Exception) else {"status": "unhealthy", "error": str(results[0])},
                "google_translate": results[1] if not isinstance(results[1], Exception) else {"status": "unhealthy", "error": str(results[1])}
            }
            
            # Overall health
            all_healthy = all(
                service.get("status") == "healthy" 
                for service in service_health.values()
            )
            
            return {
                "status": "healthy" if all_healthy else "degraded",
                "services": service_health,
                "metrics": await self.get_performance_metrics()
            }
            
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}