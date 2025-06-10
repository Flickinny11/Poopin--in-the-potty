"""
Call management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from uuid import UUID, uuid4
import logging
from datetime import datetime, timedelta

from ..schemas import (
    CallResponse, CallCreate, CallUpdate, APIResponse, 
    PaginatedResponse, CallStatus
)
from ..middleware.auth import get_current_active_user
from ..database import db_manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=CallResponse)
async def create_call(
    call_data: CallCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Create a new call
    """
    caller_id = current_user["id"]
    room_id = str(uuid4())  # Generate unique room ID
    
    # Verify callee exists and is active
    callee_query = """
    SELECT id FROM users 
    WHERE id = :callee_id AND is_active = true
    """
    
    callee = await db_manager.fetch_one(callee_query, {"callee_id": str(call_data.callee_id)})
    if not callee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Callee not found or inactive"
        )
    
    # Don't allow calling yourself
    if str(caller_id) == str(call_data.callee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot call yourself"
        )
    
    # Create the call
    query = """
    INSERT INTO calls (caller_id, callee_id, room_id, translation_enabled, recording_enabled)
    VALUES (:caller_id, :callee_id, :room_id, :translation_enabled, :recording_enabled)
    RETURNING id, caller_id, callee_id, room_id, status, started_at, ended_at,
              duration, quality_rating, translation_enabled, recording_enabled,
              participants_data, created_at, updated_at
    """
    
    values = {
        "caller_id": str(caller_id),
        "callee_id": str(call_data.callee_id),
        "room_id": room_id,
        "translation_enabled": call_data.translation_enabled,
        "recording_enabled": call_data.recording_enabled
    }
    
    try:
        new_call = await db_manager.fetch_one(query, values)
        return CallResponse(**dict(new_call))
        
    except Exception as e:
        logger.error(f"Error creating call: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create call"
        )

@router.get("/", response_model=List[CallResponse])
async def get_user_calls(
    status_filter: Optional[CallStatus] = Query(None, description="Filter calls by status"),
    limit: int = Query(50, ge=1, le=100, description="Number of calls to return"),
    offset: int = Query(0, ge=0, description="Number of calls to skip"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get user's calls (as caller or callee)
    """
    user_id = current_user["id"]
    
    # Build query with optional status filter
    base_query = """
    SELECT id, caller_id, callee_id, room_id, status, started_at, ended_at,
           duration, quality_rating, translation_enabled, recording_enabled,
           participants_data, created_at, updated_at
    FROM calls
    WHERE (caller_id = :user_id OR callee_id = :user_id)
    """
    
    values = {"user_id": str(user_id), "limit": limit, "offset": offset}
    
    if status_filter:
        base_query += " AND status = :status"
        values["status"] = status_filter.value
    
    base_query += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
    
    try:
        calls = await db_manager.fetch_all(base_query, values)
        return [CallResponse(**dict(call)) for call in calls]
        
    except Exception as e:
        logger.error(f"Error fetching calls: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch calls"
        )

@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get specific call details
    """
    user_id = current_user["id"]
    
    query = """
    SELECT id, caller_id, callee_id, room_id, status, started_at, ended_at,
           duration, quality_rating, translation_enabled, recording_enabled,
           participants_data, created_at, updated_at
    FROM calls
    WHERE id = :call_id AND (caller_id = :user_id OR callee_id = :user_id)
    """
    
    call = await db_manager.fetch_one(
        query,
        {"call_id": str(call_id), "user_id": str(user_id)}
    )
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    return CallResponse(**dict(call))

@router.put("/{call_id}", response_model=CallResponse)
async def update_call(
    call_id: UUID,
    call_update: CallUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Update call details
    """
    user_id = current_user["id"]
    
    # First verify the user has access to this call
    verify_query = """
    SELECT id, caller_id, callee_id, status
    FROM calls
    WHERE id = :call_id AND (caller_id = :user_id OR callee_id = :user_id)
    """
    
    existing_call = await db_manager.fetch_one(
        verify_query,
        {"call_id": str(call_id), "user_id": str(user_id)}
    )
    
    if not existing_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    # Build update query
    update_fields = []
    values = {"call_id": str(call_id)}
    
    if call_update.status is not None:
        update_fields.append("status = :status")
        values["status"] = call_update.status.value
        
        # Handle status-specific updates
        if call_update.status == CallStatus.ACTIVE and not existing_call["started_at"]:
            update_fields.append("started_at = timezone('utc'::text, now())")
        elif call_update.status == CallStatus.ENDED:
            update_fields.append("ended_at = timezone('utc'::text, now())")
            # Calculate duration if call was active
            if existing_call["started_at"]:
                update_fields.append("""
                duration = EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - started_at))::INTEGER
                """)
    
    if call_update.quality_rating is not None:
        update_fields.append("quality_rating = :quality_rating")
        values["quality_rating"] = call_update.quality_rating
    
    if call_update.participants_data is not None:
        update_fields.append("participants_data = :participants_data")
        values["participants_data"] = call_update.participants_data
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_fields.append("updated_at = timezone('utc'::text, now())")
    
    query = f"""
    UPDATE calls 
    SET {', '.join(update_fields)}
    WHERE id = :call_id
    RETURNING id, caller_id, callee_id, room_id, status, started_at, ended_at,
              duration, quality_rating, translation_enabled, recording_enabled,
              participants_data, created_at, updated_at
    """
    
    try:
        updated_call = await db_manager.fetch_one(query, values)
        return CallResponse(**dict(updated_call))
        
    except Exception as e:
        logger.error(f"Error updating call: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update call"
        )

@router.post("/{call_id}/join", response_model=CallResponse)
async def join_call(
    call_id: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Join a call (for the callee)
    """
    user_id = current_user["id"]
    
    # Verify user is the callee and call is in correct state
    query = """
    SELECT id, caller_id, callee_id, status
    FROM calls
    WHERE id = :call_id AND callee_id = :user_id AND status IN ('scheduled', 'active')
    """
    
    call = await db_manager.fetch_one(
        query,
        {"call_id": str(call_id), "user_id": str(user_id)}
    )
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found or you're not authorized to join"
        )
    
    # Update call to active status
    update_query = """
    UPDATE calls 
    SET status = 'active', 
        started_at = COALESCE(started_at, timezone('utc'::text, now())),
        updated_at = timezone('utc'::text, now())
    WHERE id = :call_id
    RETURNING id, caller_id, callee_id, room_id, status, started_at, ended_at,
              duration, quality_rating, translation_enabled, recording_enabled,
              participants_data, created_at, updated_at
    """
    
    try:
        updated_call = await db_manager.fetch_one(update_query, {"call_id": str(call_id)})
        return CallResponse(**dict(updated_call))
        
    except Exception as e:
        logger.error(f"Error joining call: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join call"
        )

@router.post("/{call_id}/end", response_model=CallResponse)
async def end_call(
    call_id: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    End a call
    """
    user_id = current_user["id"]
    
    # Verify user is part of the call
    query = """
    SELECT id, started_at
    FROM calls
    WHERE id = :call_id AND (caller_id = :user_id OR callee_id = :user_id) 
          AND status = 'active'
    """
    
    call = await db_manager.fetch_one(
        query,
        {"call_id": str(call_id), "user_id": str(user_id)}
    )
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active call not found"
        )
    
    # End the call
    update_query = """
    UPDATE calls 
    SET status = 'ended',
        ended_at = timezone('utc'::text, now()),
        duration = CASE 
            WHEN started_at IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - started_at))::INTEGER
            ELSE 0
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = :call_id
    RETURNING id, caller_id, callee_id, room_id, status, started_at, ended_at,
              duration, quality_rating, translation_enabled, recording_enabled,
              participants_data, created_at, updated_at
    """
    
    try:
        ended_call = await db_manager.fetch_one(update_query, {"call_id": str(call_id)})
        return CallResponse(**dict(ended_call))
        
    except Exception as e:
        logger.error(f"Error ending call: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to end call"
        )

@router.get("/history/stats", response_model=dict)
async def get_call_statistics(
    days: int = Query(30, ge=1, le=365, description="Number of days to include in stats"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get call statistics for the user
    """
    user_id = current_user["id"]
    
    query = """
    SELECT 
        COUNT(*) as total_calls,
        COUNT(*) FILTER (WHERE status = 'ended') as completed_calls,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_calls,
        AVG(duration) FILTER (WHERE duration > 0) as avg_duration,
        SUM(duration) FILTER (WHERE duration > 0) as total_duration,
        AVG(quality_rating) FILTER (WHERE quality_rating > 0) as avg_quality
    FROM calls
    WHERE (caller_id = :user_id OR callee_id = :user_id)
      AND created_at >= timezone('utc'::text, now() - INTERVAL '%s days')
    """ % days
    
    try:
        stats = await db_manager.fetch_one(query, {"user_id": str(user_id)})
        
        result = dict(stats) if stats else {}
        
        # Convert None values to 0 for numeric fields
        numeric_fields = ['total_calls', 'completed_calls', 'cancelled_calls', 
                         'avg_duration', 'total_duration', 'avg_quality']
        for field in numeric_fields:
            if result.get(field) is None:
                result[field] = 0
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching call statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch call statistics"
        )