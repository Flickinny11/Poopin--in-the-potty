"""
VidLiSync FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import logging
import os
from typing import Dict, Any

from .routers import auth, users, calls, settings, contacts, health, billing, webhooks, translation, vs_environment
from .database import database
from .middleware.auth import get_current_user
from .ai_services.websocket_handler import TranslationWebSocketHandler
from .ai_services.translation_pipeline import TranslationPipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global instances for WebSocket support
websocket_handler = None
translation_pipeline_ws = None

# Create FastAPI app
app = FastAPI(
    title="VidLiSync API",
    description="Real-time video chat with AI translation - Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(calls.router, prefix="/calls", tags=["calls"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])
app.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(translation.router, prefix="/translation", tags=["ai-translation"])
app.include_router(vs_environment.router, prefix="/api", tags=["vs-environment"])

@app.on_event("startup")
async def startup_event():
    """Initialize database connection and AI services on startup"""
    global websocket_handler, translation_pipeline_ws
    
    try:
        await database.connect()
        logger.info("Database connected successfully")
        
        # Initialize AI services for WebSocket support
        translation_pipeline_ws = TranslationPipeline()
        websocket_handler = TranslationWebSocketHandler(translation_pipeline_ws)
        
        logger.info("AI services initialized for WebSocket support")
        
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    try:
        await database.disconnect()
        logger.info("Database disconnected")
    except Exception as e:
        logger.error(f"Error disconnecting from database: {e}")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "VidLiSync API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "features": {
            "ai_translation": True,
            "voice_cloning": True,
            "lip_sync": True,
            "websocket_streaming": True,
            "vs_environment": True
        }
    }

@app.websocket("/ws/translation")
async def websocket_translation_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time translation streaming"""
    global websocket_handler
    
    if not websocket_handler:
        await websocket.close(code=1011, reason="AI services not available")
        return
    
    await websocket.accept()
    
    try:
        await websocket_handler.handle_connection(websocket, "/ws/translation")
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        await websocket.close(code=1011, reason="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
