"""
User settings management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any, Union
from uuid import UUID
import logging
import json

from ..schemas import (
    UserSettingResponse, UserSettingCreate, UserSettingUpdate, 
    APIResponse, PaginatedResponse
)
from ..middleware.auth import get_current_active_user
from ..database import db_manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[UserSettingResponse])
async def get_user_settings(
    setting_key: Optional[str] = Query(None, description="Filter by specific setting key"),
    public_only: bool = Query(False, description="Return only public settings"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get user settings
    """
    user_id = current_user["id"]
    
    base_query = """
    SELECT id, user_id, setting_key, setting_value, setting_type, 
           is_public, created_at, updated_at
    FROM user_settings
    WHERE user_id = :user_id
    """
    
    values = {"user_id": str(user_id)}
    
    if setting_key:
        base_query += " AND setting_key = :setting_key"
        values["setting_key"] = setting_key
    
    if public_only:
        base_query += " AND is_public = true"
    
    base_query += " ORDER BY setting_key ASC"
    
    try:
        settings = await db_manager.fetch_all(base_query, values)
        return [UserSettingResponse(**dict(setting)) for setting in settings]
        
    except Exception as e:
        logger.error(f"Error fetching user settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user settings"
        )

@router.get("/{setting_key}", response_model=UserSettingResponse)
async def get_setting(
    setting_key: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get specific setting by key
    """
    user_id = current_user["id"]
    
    query = """
    SELECT id, user_id, setting_key, setting_value, setting_type,
           is_public, created_at, updated_at
    FROM user_settings
    WHERE user_id = :user_id AND setting_key = :setting_key
    """
    
    setting = await db_manager.fetch_one(
        query,
        {"user_id": str(user_id), "setting_key": setting_key}
    )
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setting not found"
        )
    
    return UserSettingResponse(**dict(setting))

@router.post("/", response_model=UserSettingResponse)
async def create_or_update_setting(
    setting_data: UserSettingCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Create or update a user setting
    """
    user_id = current_user["id"]
    
    # Check if setting already exists
    existing_query = """
    SELECT id FROM user_settings
    WHERE user_id = :user_id AND setting_key = :setting_key
    """
    
    existing = await db_manager.fetch_one(
        existing_query,
        {"user_id": str(user_id), "setting_key": setting_data.setting_key}
    )
    
    if existing:
        # Update existing setting
        query = """
        UPDATE user_settings
        SET setting_value = :setting_value,
            setting_type = :setting_type,
            is_public = :is_public,
            updated_at = timezone('utc'::text, now())
        WHERE user_id = :user_id AND setting_key = :setting_key
        RETURNING id, user_id, setting_key, setting_value, setting_type,
                  is_public, created_at, updated_at
        """
    else:
        # Create new setting
        query = """
        INSERT INTO user_settings (user_id, setting_key, setting_value, setting_type, is_public)
        VALUES (:user_id, :setting_key, :setting_value, :setting_type, :is_public)
        RETURNING id, user_id, setting_key, setting_value, setting_type,
                  is_public, created_at, updated_at
        """
    
    values = {
        "user_id": str(user_id),
        "setting_key": setting_data.setting_key,
        "setting_value": setting_data.setting_value,
        "setting_type": setting_data.setting_type,
        "is_public": setting_data.is_public
    }
    
    try:
        result = await db_manager.fetch_one(query, values)
        return UserSettingResponse(**dict(result))
        
    except Exception as e:
        logger.error(f"Error creating/updating setting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save setting"
        )

@router.put("/{setting_key}", response_model=UserSettingResponse)
async def update_setting(
    setting_key: str,
    setting_update: UserSettingUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Update specific setting
    """
    user_id = current_user["id"]
    
    # Check if setting exists
    check_query = """
    SELECT id FROM user_settings
    WHERE user_id = :user_id AND setting_key = :setting_key
    """
    
    existing = await db_manager.fetch_one(
        check_query,
        {"user_id": str(user_id), "setting_key": setting_key}
    )
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setting not found"
        )
    
    # Build update query
    update_fields = []
    values = {"user_id": str(user_id), "setting_key": setting_key}
    
    if setting_update.setting_value is not None:
        update_fields.append("setting_value = :setting_value")
        values["setting_value"] = setting_update.setting_value
    
    if setting_update.setting_type is not None:
        update_fields.append("setting_type = :setting_type")
        values["setting_type"] = setting_update.setting_type
    
    if setting_update.is_public is not None:
        update_fields.append("is_public = :is_public")
        values["is_public"] = setting_update.is_public
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_fields.append("updated_at = timezone('utc'::text, now())")
    
    query = f"""
    UPDATE user_settings
    SET {', '.join(update_fields)}
    WHERE user_id = :user_id AND setting_key = :setting_key
    RETURNING id, user_id, setting_key, setting_value, setting_type,
              is_public, created_at, updated_at
    """
    
    try:
        result = await db_manager.fetch_one(query, values)
        return UserSettingResponse(**dict(result))
        
    except Exception as e:
        logger.error(f"Error updating setting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update setting"
        )

@router.delete("/{setting_key}", response_model=APIResponse)
async def delete_setting(
    setting_key: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Delete a user setting
    """
    user_id = current_user["id"]
    
    query = """
    DELETE FROM user_settings
    WHERE user_id = :user_id AND setting_key = :setting_key
    RETURNING id
    """
    
    try:
        deleted = await db_manager.fetch_one(
            query,
            {"user_id": str(user_id), "setting_key": setting_key}
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found"
            )
        
        return APIResponse(message="Setting deleted successfully")
        
    except Exception as e:
        logger.error(f"Error deleting setting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete setting"
        )

@router.post("/bulk", response_model=List[UserSettingResponse])
async def bulk_update_settings(
    settings: List[UserSettingCreate],
    current_user: dict = Depends(get_current_active_user)
):
    """
    Bulk create/update multiple settings
    """
    user_id = current_user["id"]
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No settings provided"
        )
    
    if len(settings) > 50:  # Limit bulk operations
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many settings (max 50 per request)"
        )
    
    results = []
    
    # Process each setting individually for now
    # In production, you might want to use a transaction
    for setting_data in settings:
        try:
            # Check if exists
            existing_query = """
            SELECT id FROM user_settings
            WHERE user_id = :user_id AND setting_key = :setting_key
            """
            
            existing = await db_manager.fetch_one(
                existing_query,
                {"user_id": str(user_id), "setting_key": setting_data.setting_key}
            )
            
            if existing:
                # Update
                query = """
                UPDATE user_settings
                SET setting_value = :setting_value,
                    setting_type = :setting_type,
                    is_public = :is_public,
                    updated_at = timezone('utc'::text, now())
                WHERE user_id = :user_id AND setting_key = :setting_key
                RETURNING id, user_id, setting_key, setting_value, setting_type,
                          is_public, created_at, updated_at
                """
            else:
                # Create
                query = """
                INSERT INTO user_settings (user_id, setting_key, setting_value, setting_type, is_public)
                VALUES (:user_id, :setting_key, :setting_value, :setting_type, :is_public)
                RETURNING id, user_id, setting_key, setting_value, setting_type,
                          is_public, created_at, updated_at
                """
            
            values = {
                "user_id": str(user_id),
                "setting_key": setting_data.setting_key,
                "setting_value": setting_data.setting_value,
                "setting_type": setting_data.setting_type,
                "is_public": setting_data.is_public
            }
            
            result = await db_manager.fetch_one(query, values)
            results.append(UserSettingResponse(**dict(result)))
            
        except Exception as e:
            logger.error(f"Error processing setting {setting_data.setting_key}: {e}")
            # Continue with other settings
    
    return results

@router.get("/export/all", response_model=Dict[str, Any])
async def export_all_settings(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Export all user settings as a dictionary
    """
    user_id = current_user["id"]
    
    query = """
    SELECT setting_key, setting_value, setting_type
    FROM user_settings
    WHERE user_id = :user_id
    ORDER BY setting_key ASC
    """
    
    try:
        settings = await db_manager.fetch_all(query, {"user_id": str(user_id)})
        
        result = {}
        for setting in settings:
            result[setting["setting_key"]] = {
                "value": setting["setting_value"],
                "type": setting["setting_type"]
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Error exporting settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export settings"
        )