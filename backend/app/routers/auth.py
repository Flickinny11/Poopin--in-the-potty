"""
Authentication endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import logging
from uuid import UUID
from datetime import datetime

from ..schemas import Token, UserResponse, APIResponse
from ..middleware.auth import verify_supabase_jwt, get_current_user_from_token, update_last_login
from ..database import db_manager

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.post("/verify", response_model=Token)
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token and return user information
    """
    token = credentials.credentials
    
    # Verify the JWT token
    token_data = await verify_supabase_jwt(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user data from database
    user_data = await get_current_user_from_token(token_data)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    await update_last_login(UUID(user_data["id"]))
    
    # Create user response
    user_response = UserResponse(**user_data)
    
    return Token(
        access_token=token,
        token_type="bearer",
        user=user_response
    )

@router.post("/refresh", response_model=Token)
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Refresh JWT token (placeholder for future implementation)
    Currently just verifies and returns the same token
    """
    # For now, just verify the current token
    return await verify_token(credentials)

@router.post("/logout", response_model=APIResponse)
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Logout user (placeholder for future implementation)
    In a real implementation, you might invalidate the token server-side
    """
    token = credentials.credentials
    
    # Verify the token is valid
    token_data = await verify_supabase_jwt(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    # In a real implementation, you'd add the token to a blacklist
    # or notify Supabase to invalidate the session
    
    return APIResponse(
        message="Successfully logged out"
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current user information
    """
    token = credentials.credentials
    
    # Verify token and get user data
    token_data = await verify_supabase_jwt(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    user_data = await get_current_user_from_token(token_data)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return UserResponse(**user_data)

@router.post("/validate", response_model=APIResponse)
async def validate_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate token without returning user data
    Useful for quick token validation
    """
    token = credentials.credentials
    
    token_data = await verify_supabase_jwt(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    return APIResponse(
        message="Token is valid",
        data={"expires_at": token_data.get("exp")}
    )