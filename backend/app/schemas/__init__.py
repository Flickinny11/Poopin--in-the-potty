"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID
from enum import Enum

# Enums
class SubscriptionTier(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    BUSINESS = "business"

class CallStatus(str, Enum):
    ACTIVE = "active"
    ENDED = "ended"
    SCHEDULED = "scheduled"
    CANCELLED = "cancelled"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseSchema):
    email: EmailStr = Field(..., description="User email address")
    full_name: Optional[str] = Field(None, max_length=255, description="User full name")
    avatar_url: Optional[str] = Field(None, max_length=500, description="User avatar URL")

class UserCreate(UserBase):
    pass

class UserUpdate(BaseSchema):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=255)
    avatar_url: Optional[str] = Field(None, max_length=500)

class UserResponse(UserBase):
    id: UUID
    subscription_tier: SubscriptionTier
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: datetime

class User(UserResponse):
    """Complete user model with relationships"""
    pass

# Voice Profile Schemas
class VoiceProfileBase(BaseSchema):
    name: str = Field(..., max_length=100, description="Voice profile name")
    language: str = Field(..., max_length=10, description="ISO language code")
    voice_data: Optional[Dict[str, Any]] = Field(None, description="Voice training data")
    is_default: bool = Field(False, description="Is this the default voice profile")

class VoiceProfileCreate(VoiceProfileBase):
    pass

class VoiceProfileUpdate(BaseSchema):
    name: Optional[str] = Field(None, max_length=100)
    language: Optional[str] = Field(None, max_length=10)
    voice_data: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None

class VoiceProfileResponse(VoiceProfileBase):
    id: UUID
    user_id: UUID
    quality_score: Optional[float] = Field(None, ge=0, le=1)
    training_duration: Optional[int] = Field(None, ge=0)
    created_at: datetime
    updated_at: datetime

# Call Schemas
class CallBase(BaseSchema):
    callee_id: UUID = Field(..., description="ID of the user being called")
    translation_enabled: bool = Field(True, description="Enable translation for this call")
    recording_enabled: bool = Field(False, description="Enable recording for this call")

class CallCreate(CallBase):
    pass

class CallUpdate(BaseSchema):
    status: Optional[CallStatus] = None
    quality_rating: Optional[int] = Field(None, ge=1, le=5)
    participants_data: Optional[Dict[str, Any]] = None

class CallResponse(CallBase):
    id: UUID
    caller_id: UUID
    room_id: str
    status: CallStatus
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    duration: Optional[int]
    quality_rating: Optional[int]
    participants_data: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

# Subscription Schemas
class SubscriptionBase(BaseSchema):
    tier: SubscriptionTier = Field(..., description="Subscription tier")

class SubscriptionCreate(SubscriptionBase):
    stripe_subscription_id: Optional[str] = Field(None, max_length=255)

class SubscriptionUpdate(BaseSchema):
    status: Optional[SubscriptionStatus] = None
    cancel_at_period_end: Optional[bool] = None

class SubscriptionResponse(SubscriptionBase):
    id: UUID
    user_id: UUID
    stripe_subscription_id: Optional[str]
    status: SubscriptionStatus
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    cancelled_at: Optional[datetime]
    trial_end: Optional[datetime]
    created_at: datetime
    updated_at: datetime

# Usage Log Schemas
class UsageLogBase(BaseSchema):
    feature_used: str = Field(..., max_length=100, description="Feature that was used")
    usage_data: Optional[Dict[str, Any]] = Field(None, description="Detailed usage data")
    session_id: Optional[str] = Field(None, max_length=255)

class UsageLogCreate(UsageLogBase):
    pass

class UsageLogResponse(UsageLogBase):
    id: UUID
    user_id: UUID
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

# Contact Schemas
class ContactBase(BaseSchema):
    contact_user_id: UUID = Field(..., description="ID of the contact user")
    nickname: Optional[str] = Field(None, max_length=100, description="Nickname for the contact")
    is_favorite: bool = Field(False, description="Is this contact marked as favorite")
    is_blocked: bool = Field(False, description="Is this contact blocked")
    notes: Optional[str] = Field(None, description="Notes about the contact")

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseSchema):
    nickname: Optional[str] = Field(None, max_length=100)
    is_favorite: Optional[bool] = None
    is_blocked: Optional[bool] = None
    notes: Optional[str] = None

class ContactResponse(ContactBase):
    id: UUID
    user_id: UUID
    last_contact: Optional[datetime]
    contact_frequency: int
    created_at: datetime
    updated_at: datetime

# User Settings Schemas
class UserSettingBase(BaseSchema):
    setting_key: str = Field(..., max_length=100, description="Setting key")
    setting_value: Union[str, int, float, bool, Dict[str, Any], List[Any]] = Field(..., description="Setting value")
    setting_type: str = Field("json", max_length=50, description="Type of setting")
    is_public: bool = Field(False, description="Is this setting public")

class UserSettingCreate(UserSettingBase):
    pass

class UserSettingUpdate(BaseSchema):
    setting_value: Optional[Union[str, int, float, bool, Dict[str, Any], List[Any]]] = None
    setting_type: Optional[str] = Field(None, max_length=50)
    is_public: Optional[bool] = None

class UserSettingResponse(UserSettingBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

# Authentication Schemas
class Token(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseSchema):
    user_id: Optional[UUID] = None
    email: Optional[str] = None

# API Response Schemas
class APIResponse(BaseSchema):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[Any] = None

class ErrorResponse(BaseSchema):
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None

class PaginatedResponse(BaseSchema):
    items: List[Any]
    total: int
    page: int = 1
    size: int = 10
    pages: int = 1

# Health Check Schema
class HealthResponse(BaseSchema):
    status: str = "healthy"
    timestamp: datetime
    database: str = "connected"
    version: str = "1.0.0"

# Billing and Stripe Schemas
class CheckoutSessionCreate(BaseSchema):
    price_id: str = Field(..., description="Stripe price ID")
    success_url: str = Field(..., description="URL to redirect on success")
    cancel_url: str = Field(..., description="URL to redirect on cancel")

class CheckoutSessionResponse(BaseSchema):
    session_id: str
    url: str

class WebhookEventResponse(BaseSchema):
    id: str
    event_type: str
    status: str
    processed_at: Optional[datetime]
    retry_count: int
    error_message: Optional[str]
    created_at: datetime

class SubscriptionPlanResponse(BaseSchema):
    tier: SubscriptionTier
    name: str
    price: float
    currency: str = "usd"
    interval: str = "month"
    features: List[str]
    limits: Dict[str, Any]

class UsageStatsResponse(BaseSchema):
    current_period_start: datetime
    current_period_end: datetime
    total_minutes_used: int
    minutes_limit: int
    overage_minutes: int = 0
    calls_count: int
    features_used: Dict[str, int]

class CustomerPortalResponse(BaseSchema):
    url: str