"""
VS Environment API Router
Extends the existing VidLiSync backend to support VS Environment features
Created for issue #40 - VidLiSync VS Environment: Real-time Environmental Translation for Mobile
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.security import HTTPBearer
from typing import Dict, List, Optional, Any
import json
import asyncio
import logging
from datetime import datetime
import uuid

from ..ai_services.translation_pipeline import TranslationPipeline
from ..middleware.auth import get_current_user
from ..models import User
from ..schemas import VSEnvironmentConfig, VSEnvironmentSession, TranslationResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vs-environment", tags=["VS Environment"])
security = HTTPBearer()

# Global instances
translation_pipeline = TranslationPipeline()
active_sessions: Dict[str, VSEnvironmentSession] = {}

class VSEnvironmentManager:
    """Manages VS Environment sessions and WebSocket connections"""
    
    def __init__(self):
        self.sessions: Dict[str, VSEnvironmentSession] = {}
        self.websockets: Dict[str, WebSocket] = {}
    
    async def create_session(self, user_id: str, config: VSEnvironmentConfig) -> str:
        """Create a new VS Environment session"""
        session_id = str(uuid.uuid4())
        
        session = VSEnvironmentSession(
            session_id=session_id,
            user_id=user_id,
            config=config,
            created_at=datetime.utcnow(),
            is_active=True
        )
        
        self.sessions[session_id] = session
        logger.info(f"Created VS Environment session: {session_id} for user: {user_id}")
        
        return session_id
    
    async def close_session(self, session_id: str):
        """Close a VS Environment session"""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            session.is_active = False
            session.ended_at = datetime.utcnow()
            
            # Close WebSocket if connected
            if session_id in self.websockets:
                websocket = self.websockets[session_id]
                await websocket.close()
                del self.websockets[session_id]
            
            logger.info(f"Closed VS Environment session: {session_id}")
    
    async def add_websocket(self, session_id: str, websocket: WebSocket):
        """Add WebSocket connection to session"""
        self.websockets[session_id] = websocket
        if session_id in self.sessions:
            self.sessions[session_id].websocket_connected = True
    
    async def remove_websocket(self, session_id: str):
        """Remove WebSocket connection from session"""
        if session_id in self.websockets:
            del self.websockets[session_id]
        if session_id in self.sessions:
            self.sessions[session_id].websocket_connected = False
    
    def get_session(self, session_id: str) -> Optional[VSEnvironmentSession]:
        """Get session by ID"""
        return self.sessions.get(session_id)

# Global manager instance
vs_environment_manager = VSEnvironmentManager()

@router.post("/sessions")
async def create_vs_environment_session(
    config: VSEnvironmentConfig,
    current_user: User = Depends(get_current_user)
):
    """Create a new VS Environment session"""
    try:
        # Validate user subscription limits
        if not await check_vs_environment_limits(current_user):
            raise HTTPException(
                status_code=403,
                detail="VS Environment usage limit exceeded. Please upgrade your subscription."
            )
        
        session_id = await vs_environment_manager.create_session(
            user_id=str(current_user.id),
            config=config
        )
        
        return {
            "session_id": session_id,
            "websocket_url": f"/vs-environment/ws/{session_id}",
            "status": "created"
        }
        
    except Exception as e:
        logger.error(f"Failed to create VS Environment session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sessions/{session_id}")
async def close_vs_environment_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Close a VS Environment session"""
    try:
        session = vs_environment_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        await vs_environment_manager.close_session(session_id)
        
        return {"status": "closed"}
        
    except Exception as e:
        logger.error(f"Failed to close VS Environment session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}")
async def get_vs_environment_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get VS Environment session details"""
    try:
        session = vs_environment_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "session_id": session.session_id,
            "config": session.config,
            "is_active": session.is_active,
            "websocket_connected": session.websocket_connected,
            "created_at": session.created_at,
            "ended_at": session.ended_at,
            "usage_stats": session.usage_stats
        }
        
    except Exception as e:
        logger.error(f"Failed to get VS Environment session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/{session_id}")
async def vs_environment_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for VS Environment real-time translation"""
    await websocket.accept()
    
    try:
        # Validate session
        session = vs_environment_manager.get_session(session_id)
        if not session or not session.is_active:
            await websocket.close(code=4004, reason="Invalid or inactive session")
            return
        
        # Add WebSocket to session
        await vs_environment_manager.add_websocket(session_id, websocket)
        
        logger.info(f"WebSocket connected for VS Environment session: {session_id}")
        
        # Initialize translation pipeline for this session
        if not translation_pipeline.is_initialized:
            await translation_pipeline.initialize()
        
        # Start streaming session
        stream_session_id = await translation_pipeline.start_stream_session(
            target_language=session.config.target_language,
            voice_profile=session.config.voice_profile or {},
            source_language=session.config.source_language
        )
        
        # Main WebSocket loop
        while True:
            try:
                # Receive audio data or control messages
                data = await websocket.receive()
                
                if data["type"] == "websocket.receive":
                    if "bytes" in data:
                        # Process audio data
                        audio_chunk = data["bytes"]
                        await process_audio_chunk(
                            websocket, 
                            stream_session_id, 
                            audio_chunk, 
                            session
                        )
                    elif "text" in data:
                        # Handle control messages
                        await handle_control_message(
                            websocket, 
                            json.loads(data["text"]), 
                            session
                        )
                        
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for session: {session_id}")
                break
            except Exception as e:
                logger.error(f"WebSocket error for session {session_id}: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": str(e)
                }))
    
    finally:
        # Cleanup
        await vs_environment_manager.remove_websocket(session_id)
        if 'stream_session_id' in locals():
            await translation_pipeline.close_stream_session(stream_session_id)

async def process_audio_chunk(
    websocket: WebSocket, 
    stream_session_id: str, 
    audio_chunk: bytes, 
    session: VSEnvironmentSession
):
    """Process incoming audio chunk through translation pipeline"""
    try:
        start_time = datetime.utcnow()
        
        # Process through translation pipeline
        result = await translation_pipeline.process_stream_chunk(
            stream_session_id, 
            audio_chunk
        )
        
        if result.get("success") and not result.get("buffering"):
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            # Update session usage stats
            session.usage_stats["chunks_processed"] += 1
            session.usage_stats["total_processing_time_ms"] += processing_time
            
            # Send translation result back to client
            response = {
                "type": "translation",
                "original_text": result.get("original_text", ""),
                "translated_text": result.get("translated_text", ""),
                "detected_language": result.get("detected_language", ""),
                "confidence": result.get("confidence", 0.0),
                "processing_time_ms": processing_time
            }
            
            await websocket.send_text(json.dumps(response))
            
            # Send translated audio if available and requested
            if (result.get("translated_audio") and 
                session.config.output_mode in ["audio", "both"]):
                await websocket.send_bytes(result["translated_audio"])
        
    except Exception as e:
        logger.error(f"Failed to process audio chunk: {e}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Audio processing failed: {str(e)}"
        }))

async def handle_control_message(
    websocket: WebSocket, 
    message: Dict[str, Any], 
    session: VSEnvironmentSession
):
    """Handle control messages from client"""
    try:
        message_type = message.get("type")
        
        if message_type == "config_update":
            # Update session configuration
            new_config = message.get("config", {})
            for key, value in new_config.items():
                if hasattr(session.config, key):
                    setattr(session.config, key, value)
            
            await websocket.send_text(json.dumps({
                "type": "config_updated",
                "status": "success"
            }))
            
        elif message_type == "language_swap":
            # Swap source and target languages
            old_target = session.config.target_language
            old_source = session.config.source_language
            
            session.config.target_language = old_source or "auto"
            session.config.source_language = old_target
            
            await websocket.send_text(json.dumps({
                "type": "languages_swapped",
                "target_language": session.config.target_language,
                "source_language": session.config.source_language
            }))
            
        elif message_type == "ping":
            # Health check
            await websocket.send_text(json.dumps({
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat()
            }))
            
    except Exception as e:
        logger.error(f"Failed to handle control message: {e}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Control message failed: {str(e)}"
        }))

async def check_vs_environment_limits(user: User) -> bool:
    """Check if user can use VS Environment based on subscription"""
    try:
        # Get user's subscription tier
        subscription = await get_user_subscription(user.id)
        
        if not subscription:
            # Free tier limits
            monthly_usage = await get_monthly_vs_environment_usage(user.id)
            return monthly_usage < 5  # 5 minutes for free tier
        
        # Check subscription-specific limits
        tier_limits = {
            "basic": 60,      # 60 minutes
            "pro": 300,       # 300 minutes  
            "business": -1    # Unlimited
        }
        
        if subscription.tier == "business":
            return True
        
        monthly_usage = await get_monthly_vs_environment_usage(user.id)
        limit = tier_limits.get(subscription.tier, 5)
        
        return monthly_usage < limit
        
    except Exception as e:
        logger.error(f"Failed to check VS Environment limits: {e}")
        return False

async def get_user_subscription(user_id: str):
    """Get user's current subscription (placeholder)"""
    # This would integrate with the existing billing system
    return None

async def get_monthly_vs_environment_usage(user_id: str) -> int:
    """Get user's monthly VS Environment usage in minutes"""
    # This would query the database for usage statistics
    return 0

@router.get("/usage/{user_id}")
async def get_vs_environment_usage(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get VS Environment usage statistics"""
    try:
        if str(current_user.id) != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        monthly_usage = await get_monthly_vs_environment_usage(user_id)
        subscription = await get_user_subscription(user_id)
        
        # Determine limits based on subscription
        if not subscription:
            limit = 5  # Free tier
            tier = "free"
        else:
            tier_limits = {"basic": 60, "pro": 300, "business": -1}
            limit = tier_limits.get(subscription.tier, 5)
            tier = subscription.tier
        
        return {
            "user_id": user_id,
            "monthly_usage_minutes": monthly_usage,
            "monthly_limit_minutes": limit,
            "subscription_tier": tier,
            "usage_percentage": (monthly_usage / limit * 100) if limit > 0 else 0,
            "can_use_vs_environment": monthly_usage < limit if limit > 0 else True
        }
        
    except Exception as e:
        logger.error(f"Failed to get VS Environment usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def vs_environment_health_check():
    """Health check for VS Environment service"""
    try:
        # Check translation pipeline health
        pipeline_health = await translation_pipeline.health_check()
        
        return {
            "status": "healthy" if pipeline_health.get("status") == "healthy" else "degraded",
            "active_sessions": len(vs_environment_manager.sessions),
            "websocket_connections": len(vs_environment_manager.websockets),
            "translation_pipeline": pipeline_health,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"VS Environment health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
