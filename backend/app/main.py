"""
VidLiSync FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import logging
import os
from typing import Dict, Any

from .routers import auth, users, calls, settings, contacts, health, billing, webhooks
from .database import database
from .middleware.auth import get_current_user

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

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

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        await database.connect()
        logger.info("Database connected successfully")
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
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )