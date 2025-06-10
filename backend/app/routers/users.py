"""
User management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from uuid import UUID
import logging
from datetime import datetime

from ..schemas import (
    UserResponse, UserCreate, UserUpdate, VoiceProfileResponse, 
    VoiceProfileCreate, VoiceProfileUpdate, APIResponse, PaginatedResponse
)
from ..middleware.auth import get_current_active_user, verify_user_access
from ..database import db_manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_active_user)):
    """
    Get current user's profile
    """
    return UserResponse(**current_user)

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Update current user's profile
    """
    user_id = current_user["id"]
    
    # Build update query dynamically
    update_fields = []
    values = {"user_id": str(user_id)}
    
    if user_update.email is not None:
        update_fields.append("email = :email")
        values["email"] = user_update.email
    
    if user_update.full_name is not None:
        update_fields.append("full_name = :full_name")
        values["full_name"] = user_update.full_name
    
    if user_update.avatar_url is not None:
        update_fields.append("avatar_url = :avatar_url")
        values["avatar_url"] = user_update.avatar_url
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_fields.append("updated_at = timezone('utc'::text, now())")
    
    query = f"""
    UPDATE users 
    SET {', '.join(update_fields)}
    WHERE id = :user_id
    RETURNING id, email, full_name, avatar_url, subscription_tier, 
              is_active, last_login, created_at, updated_at
    """
    
    try:
        updated_user = await db_manager.fetch_one(query, values)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(**dict(updated_user))
        
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get user by ID (only own profile for now)
    """
    await verify_user_access(user_id, current_user)
    
    query = """
    SELECT id, email, full_name, avatar_url, subscription_tier,
           is_active, last_login, created_at, updated_at
    FROM users
    WHERE id = :user_id AND is_active = true
    """
    
    user = await db_manager.fetch_one(query, {"user_id": str(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(**dict(user))

@router.delete("/me", response_model=APIResponse)
async def deactivate_current_user(current_user: dict = Depends(get_current_active_user)):
    """
    Deactivate current user account
    """
    user_id = current_user["id"]
    
    query = """
    UPDATE users 
    SET is_active = false, updated_at = timezone('utc'::text, now())
    WHERE id = :user_id
    """
    
    try:
        await db_manager.execute_query(query, {"user_id": str(user_id)})
        return APIResponse(message="User account deactivated successfully")
        
    except Exception as e:
        logger.error(f"Error deactivating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate user account"
        )

# Voice Profiles endpoints
@router.get("/me/voice-profiles", response_model=List[VoiceProfileResponse])
async def get_user_voice_profiles(current_user: dict = Depends(get_current_active_user)):
    """
    Get current user's voice profiles
    """
    user_id = current_user["id"]
    
    query = """
    SELECT id, user_id, name, language, voice_data, is_default,
           quality_score, training_duration, created_at, updated_at
    FROM voice_profiles
    WHERE user_id = :user_id
    ORDER BY is_default DESC, created_at DESC
    """
    
    profiles = await db_manager.fetch_all(query, {"user_id": str(user_id)})
    return [VoiceProfileResponse(**dict(profile)) for profile in profiles]

@router.post("/me/voice-profiles", response_model=VoiceProfileResponse)
async def create_voice_profile(
    profile_data: VoiceProfileCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Create new voice profile for current user
    """
    user_id = current_user["id"]
    
    # If this is set as default, unset other defaults first
    if profile_data.is_default:
        await db_manager.execute_query(
            "UPDATE voice_profiles SET is_default = false WHERE user_id = :user_id",
            {"user_id": str(user_id)}
        )
    
    query = """
    INSERT INTO voice_profiles (user_id, name, language, voice_data, is_default)
    VALUES (:user_id, :name, :language, :voice_data, :is_default)
    RETURNING id, user_id, name, language, voice_data, is_default,
              quality_score, training_duration, created_at, updated_at
    """
    
    values = {
        "user_id": str(user_id),
        "name": profile_data.name,
        "language": profile_data.language,
        "voice_data": profile_data.voice_data,
        "is_default": profile_data.is_default
    }
    
    try:
        new_profile = await db_manager.fetch_one(query, values)
        return VoiceProfileResponse(**dict(new_profile))
        
    except Exception as e:
        logger.error(f"Error creating voice profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create voice profile"
        )

@router.get("/me/voice-profiles/{profile_id}", response_model=VoiceProfileResponse)
async def get_voice_profile(
    profile_id: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get specific voice profile
    """
    user_id = current_user["id"]
    
    query = """
    SELECT id, user_id, name, language, voice_data, is_default,
           quality_score, training_duration, created_at, updated_at
    FROM voice_profiles
    WHERE id = :profile_id AND user_id = :user_id
    """
    
    profile = await db_manager.fetch_one(
        query, 
        {"profile_id": str(profile_id), "user_id": str(user_id)}
    )
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice profile not found"
        )
    
    return VoiceProfileResponse(**dict(profile))

@router.put("/me/voice-profiles/{profile_id}", response_model=VoiceProfileResponse)
async def update_voice_profile(
    profile_id: UUID,
    profile_update: VoiceProfileUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Update voice profile
    """
    user_id = current_user["id"]
    
    # If setting as default, unset other defaults first
    if profile_update.is_default:
        await db_manager.execute_query(
            "UPDATE voice_profiles SET is_default = false WHERE user_id = :user_id",
            {"user_id": str(user_id)}
        )
    
    # Build update query
    update_fields = []
    values = {"profile_id": str(profile_id), "user_id": str(user_id)}
    
    if profile_update.name is not None:
        update_fields.append("name = :name")
        values["name"] = profile_update.name
    
    if profile_update.language is not None:
        update_fields.append("language = :language")
        values["language"] = profile_update.language
    
    if profile_update.voice_data is not None:
        update_fields.append("voice_data = :voice_data")
        values["voice_data"] = profile_update.voice_data
    
    if profile_update.is_default is not None:
        update_fields.append("is_default = :is_default")
        values["is_default"] = profile_update.is_default
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_fields.append("updated_at = timezone('utc'::text, now())")
    
    query = f"""
    UPDATE voice_profiles 
    SET {', '.join(update_fields)}
    WHERE id = :profile_id AND user_id = :user_id
    RETURNING id, user_id, name, language, voice_data, is_default,
              quality_score, training_duration, created_at, updated_at
    """
    
    try:
        updated_profile = await db_manager.fetch_one(query, values)
        if not updated_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Voice profile not found"
            )
        
        return VoiceProfileResponse(**dict(updated_profile))
        
    except Exception as e:
        logger.error(f"Error updating voice profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update voice profile"
        )

@router.delete("/me/voice-profiles/{profile_id}", response_model=APIResponse)
async def delete_voice_profile(
    profile_id: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Delete voice profile
    """
    user_id = current_user["id"]
    
    query = """
    DELETE FROM voice_profiles
    WHERE id = :profile_id AND user_id = :user_id
    RETURNING id
    """
    
    try:
        deleted = await db_manager.fetch_one(
            query,
            {"profile_id": str(profile_id), "user_id": str(user_id)}
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Voice profile not found"
            )
        
        return APIResponse(message="Voice profile deleted successfully")
        
    except Exception as e:
        logger.error(f"Error deleting voice profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete voice profile"
        )