"""
Health check endpoint
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
import asyncio
import sys
import os

from ..database import check_database_connection
from ..schemas import HealthResponse

router = APIRouter()

@router.get("/", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    Returns system health status
    """
    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }
    
    # Check database connection
    try:
        db_healthy = await check_database_connection()
        health_data["database"] = "connected" if db_healthy else "disconnected"
        
        if not db_healthy:
            health_data["status"] = "unhealthy"
            
    except Exception as e:
        health_data["database"] = f"error: {str(e)}"
        health_data["status"] = "unhealthy"
    
    # If system is unhealthy, return 503
    if health_data["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_data)
    
    return health_data

@router.get("/detailed")
async def detailed_health_check():
    """
    Detailed health check with system information
    """
    try:
        db_healthy = await check_database_connection()
        
        health_info = {
            "status": "healthy" if db_healthy else "unhealthy",
            "timestamp": datetime.utcnow(),
            "version": "1.0.0",
            "database": {
                "status": "connected" if db_healthy else "disconnected",
                "url": os.getenv("DATABASE_URL", "").split("@")[-1] if os.getenv("DATABASE_URL") else "not configured"
            },
            "system": {
                "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
                "platform": sys.platform,
            },
            "environment": {
                "supabase_configured": bool(os.getenv("SUPABASE_URL")),
                "jwt_configured": bool(os.getenv("JWT_SECRET_KEY")),
            }
        }
        
        return health_info
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "Health check failed", "details": str(e)}
        )