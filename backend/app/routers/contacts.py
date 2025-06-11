"""
Contacts management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from uuid import UUID
import logging

from ..schemas import (
    ContactResponse, ContactCreate, ContactUpdate, 
    APIResponse, UserResponse
)
from ..middleware.auth import get_current_active_user
from ..database import db_manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[ContactResponse])
async def get_contacts(
    favorites_only: bool = Query(False, description="Return only favorite contacts"),
    blocked_only: bool = Query(False, description="Return only blocked contacts"),
    search: Optional[str] = Query(None, description="Search contacts by name or email"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of contacts to return"),
    offset: int = Query(0, ge=0, description="Number of contacts to skip"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get user's contacts
    """
    user_id = current_user["id"]
    
    base_query = """
    SELECT c.id, c.user_id, c.contact_user_id, c.nickname, c.is_favorite, 
           c.is_blocked, c.last_contact, c.contact_frequency, c.notes,
           c.created_at, c.updated_at
    FROM contacts c
    JOIN users u ON c.contact_user_id = u.id
    WHERE c.user_id = :user_id AND u.is_active = true
    """
    
    values = {"user_id": str(user_id), "limit": limit, "offset": offset}
    
    if favorites_only:
        base_query += " AND c.is_favorite = true"
    
    if blocked_only:
        base_query += " AND c.is_blocked = true"
    
    if search:
        base_query += " AND (c.nickname ILIKE :search OR u.full_name ILIKE :search OR u.email ILIKE :search)"
        values["search"] = f"%{search}%"
    
    base_query += " ORDER BY c.is_favorite DESC, c.contact_frequency DESC, c.created_at DESC"
    base_query += " LIMIT :limit OFFSET :offset"
    
    try:
        contacts = await db_manager.fetch_all(base_query, values)
        return [ContactResponse(**dict(contact)) for contact in contacts]
        
    except Exception as e:
        logger.error(f"Error fetching contacts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch contacts"
        )

@router.post("/", response_model=ContactResponse)
async def add_contact(
    contact_data: ContactCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Add a new contact
    """
    user_id = current_user["id"]
    
    # Don't allow adding yourself as a contact
    if str(user_id) == str(contact_data.contact_user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add yourself as a contact"
        )
    
    # Verify the contact user exists and is active
    user_query = """
    SELECT id FROM users 
    WHERE id = :contact_user_id AND is_active = true
    """
    
    contact_user = await db_manager.fetch_one(
        user_query, 
        {"contact_user_id": str(contact_data.contact_user_id)}
    )
    
    if not contact_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact user not found or inactive"
        )
    
    # Check if contact already exists
    existing_query = """
    SELECT id FROM contacts
    WHERE user_id = :user_id AND contact_user_id = :contact_user_id
    """
    
    existing = await db_manager.fetch_one(
        existing_query,
        {"user_id": str(user_id), "contact_user_id": str(contact_data.contact_user_id)}
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact already exists"
        )
    
    # Create the contact
    query = """
    INSERT INTO contacts (user_id, contact_user_id, nickname, is_favorite, is_blocked, notes)
    VALUES (:user_id, :contact_user_id, :nickname, :is_favorite, :is_blocked, :notes)
    RETURNING id, user_id, contact_user_id, nickname, is_favorite, is_blocked,
              last_contact, contact_frequency, notes, created_at, updated_at
    """
    
    values = {
        "user_id": str(user_id),
        "contact_user_id": str(contact_data.contact_user_id),
        "nickname": contact_data.nickname,
        "is_favorite": contact_data.is_favorite,
        "is_blocked": contact_data.is_blocked,
        "notes": contact_data.notes
    }
    
    try:
        new_contact = await db_manager.fetch_one(query, values)
        return ContactResponse(**dict(new_contact))
        
    except Exception as e:
        logger.error(f"Error creating contact: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create contact"
        )

@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get specific contact details
    """
    user_id = current_user["id"]
    
    query = """
    SELECT id, user_id, contact_user_id, nickname, is_favorite, is_blocked,
           last_contact, contact_frequency, notes, created_at, updated_at
    FROM contacts
    WHERE id = :contact_id AND user_id = :user_id
    """
    
    contact = await db_manager.fetch_one(
        query,
        {"contact_id": str(contact_id), "user_id": str(user_id)}
    )
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    return ContactResponse(**dict(contact))

@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: UUID,
    contact_update: ContactUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Update contact details
    """
    user_id = current_user["id"]
    
    # Verify contact exists and belongs to user
    check_query = """
    SELECT id FROM contacts
    WHERE id = :contact_id AND user_id = :user_id
    """
    
    existing = await db_manager.fetch_one(
        check_query,
        {"contact_id": str(contact_id), "user_id": str(user_id)}
    )
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    # Build update query
    update_fields = []
    values = {"contact_id": str(contact_id)}
    
    if contact_update.nickname is not None:
        update_fields.append("nickname = :nickname")
        values["nickname"] = contact_update.nickname
    
    if contact_update.is_favorite is not None:
        update_fields.append("is_favorite = :is_favorite")
        values["is_favorite"] = contact_update.is_favorite
    
    if contact_update.is_blocked is not None:
        update_fields.append("is_blocked = :is_blocked")
        values["is_blocked"] = contact_update.is_blocked
    
    if contact_update.notes is not None:
        update_fields.append("notes = :notes")
        values["notes"] = contact_update.notes
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_fields.append("updated_at = timezone('utc'::text, now())")
    
    query = f"""
    UPDATE contacts
    SET {', '.join(update_fields)}
    WHERE id = :contact_id
    RETURNING id, user_id, contact_user_id, nickname, is_favorite, is_blocked,
              last_contact, contact_frequency, notes, created_at, updated_at
    """
    
    try:
        updated_contact = await db_manager.fetch_one(query, values)
        return ContactResponse(**dict(updated_contact))
        
    except Exception as e:
        logger.error(f"Error updating contact: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update contact"
        )

@router.delete("/{contact_id}", response_model=APIResponse)
async def delete_contact(
    contact_id: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Delete a contact
    """
    user_id = current_user["id"]
    
    query = """
    DELETE FROM contacts
    WHERE id = :contact_id AND user_id = :user_id
    RETURNING id
    """
    
    try:
        deleted = await db_manager.fetch_one(
            query,
            {"contact_id": str(contact_id), "user_id": str(user_id)}
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
        
        return APIResponse(message="Contact deleted successfully")
        
    except Exception as e:
        logger.error(f"Error deleting contact: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete contact"
        )

@router.post("/{contact_id}/favorite", response_model=ContactResponse)
async def toggle_favorite(
    contact_id: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Toggle favorite status of a contact
    """
    user_id = current_user["id"]
    
    query = """
    UPDATE contacts
    SET is_favorite = NOT is_favorite,
        updated_at = timezone('utc'::text, now())
    WHERE id = :contact_id AND user_id = :user_id
    RETURNING id, user_id, contact_user_id, nickname, is_favorite, is_blocked,
              last_contact, contact_frequency, notes, created_at, updated_at
    """
    
    try:
        updated_contact = await db_manager.fetch_one(
            query,
            {"contact_id": str(contact_id), "user_id": str(user_id)}
        )
        
        if not updated_contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
        
        return ContactResponse(**dict(updated_contact))
        
    except Exception as e:
        logger.error(f"Error toggling favorite: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle favorite status"
        )

@router.post("/{contact_id}/block", response_model=ContactResponse)
async def toggle_block(
    contact_id: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Toggle block status of a contact
    """
    user_id = current_user["id"]
    
    query = """
    UPDATE contacts
    SET is_blocked = NOT is_blocked,
        updated_at = timezone('utc'::text, now())
    WHERE id = :contact_id AND user_id = :user_id
    RETURNING id, user_id, contact_user_id, nickname, is_favorite, is_blocked,
              last_contact, contact_frequency, notes, created_at, updated_at
    """
    
    try:
        updated_contact = await db_manager.fetch_one(
            query,
            {"contact_id": str(contact_id), "user_id": str(user_id)}
        )
        
        if not updated_contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
        
        return ContactResponse(**dict(updated_contact))
        
    except Exception as e:
        logger.error(f"Error toggling block status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle block status"
        )

@router.post("/{contact_id}/update-frequency", response_model=ContactResponse)
async def update_contact_frequency(
    contact_id: UUID,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Update contact frequency (called when user interacts with contact)
    """
    user_id = current_user["id"]
    
    query = """
    UPDATE contacts
    SET contact_frequency = contact_frequency + 1,
        last_contact = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = :contact_id AND user_id = :user_id
    RETURNING id, user_id, contact_user_id, nickname, is_favorite, is_blocked,
              last_contact, contact_frequency, notes, created_at, updated_at
    """
    
    try:
        updated_contact = await db_manager.fetch_one(
            query,
            {"contact_id": str(contact_id), "user_id": str(user_id)}
        )
        
        if not updated_contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
        
        return ContactResponse(**dict(updated_contact))
        
    except Exception as e:
        logger.error(f"Error updating contact frequency: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update contact frequency"
        )