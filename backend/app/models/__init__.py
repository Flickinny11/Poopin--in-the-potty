"""
Database models for VidLiSync
All models with proper relationships and constraints
"""
from sqlalchemy import (
    Column, String, Integer, DateTime, Boolean, Text, JSON, 
    ForeignKey, Index, Numeric, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from uuid import uuid4

Base = declarative_base()

class SubscriptionTier(enum.Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class CallStatus(enum.Enum):
    ACTIVE = "active"
    ENDED = "ended"
    SCHEDULED = "scheduled"
    CANCELLED = "cancelled"

class SubscriptionStatus(enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255))
    avatar_url = Column(String(500))
    subscription_tier = Column(SQLEnum(SubscriptionTier), default=SubscriptionTier.FREE, index=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    voice_profiles = relationship("VoiceProfile", back_populates="user", cascade="all, delete-orphan")
    calls_as_caller = relationship("Call", foreign_keys="Call.caller_id", back_populates="caller")
    calls_as_callee = relationship("Call", foreign_keys="Call.callee_id", back_populates="callee")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")
    contacts = relationship("Contact", foreign_keys="Contact.user_id", back_populates="user")
    user_settings = relationship("UserSetting", back_populates="user", cascade="all, delete-orphan")

class VoiceProfile(Base):
    __tablename__ = "voice_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    language = Column(String(10), nullable=False)  # ISO language code
    voice_data = Column(JSON)  # Voice training data and parameters
    is_default = Column(Boolean, default=False)
    quality_score = Column(Numeric(3, 2))  # 0.00 to 1.00
    training_duration = Column(Integer)  # seconds of training audio
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="voice_profiles")
    
    # Indexes
    __table_args__ = (
        Index('idx_voice_profiles_user_lang', 'user_id', 'language'),
    )

class Call(Base):
    __tablename__ = "calls"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    caller_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    callee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(String(255), unique=True, nullable=False)
    status = Column(SQLEnum(CallStatus), default=CallStatus.SCHEDULED, index=True)
    started_at = Column(DateTime(timezone=True))
    ended_at = Column(DateTime(timezone=True))
    duration = Column(Integer)  # seconds
    quality_rating = Column(Integer)  # 1-5 rating
    translation_enabled = Column(Boolean, default=True)
    recording_enabled = Column(Boolean, default=False)
    participants_data = Column(JSON)  # Additional participant info
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    caller = relationship("User", foreign_keys=[caller_id], back_populates="calls_as_caller")
    callee = relationship("User", foreign_keys=[callee_id], back_populates="calls_as_callee")
    
    # Indexes
    __table_args__ = (
        Index('idx_calls_user_id', 'caller_id', 'callee_id'),
        Index('idx_calls_created_at', 'created_at'),
        Index('idx_calls_status_active', 'status', postgresql_where=status == CallStatus.ACTIVE),
    )

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    stripe_subscription_id = Column(String(255), unique=True, index=True)
    tier = Column(SQLEnum(SubscriptionTier), nullable=False)
    status = Column(SQLEnum(SubscriptionStatus), nullable=False, index=True)
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    cancel_at_period_end = Column(Boolean, default=False)
    cancelled_at = Column(DateTime(timezone=True))
    trial_end = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")
    
    # Indexes
    __table_args__ = (
        Index('idx_subscriptions_status_active', 'status', postgresql_where=status == SubscriptionStatus.ACTIVE),
    )

class UsageLog(Base):
    __tablename__ = "usage_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    feature_used = Column(String(100), nullable=False, index=True)
    usage_data = Column(JSON)  # Detailed usage information
    session_id = Column(String(255))
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="usage_logs")
    
    # Indexes
    __table_args__ = (
        Index('idx_usage_logs_user_date', 'user_id', 'created_at'),
    )

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    contact_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    nickname = Column(String(100))
    is_favorite = Column(Boolean, default=False)
    is_blocked = Column(Boolean, default=False)
    last_contact = Column(DateTime(timezone=True))
    contact_frequency = Column(Integer, default=0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="contacts")
    contact_user = relationship("User", foreign_keys=[contact_user_id])

class UserSetting(Base):
    __tablename__ = "user_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    setting_key = Column(String(100), nullable=False)
    setting_value = Column(JSON, nullable=False)
    setting_type = Column(String(50), default="json")  # json, string, boolean, number
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="user_settings")
    
    # Unique constraint on user_id + setting_key
    __table_args__ = (
        Index('idx_user_settings_user_key', 'user_id', 'setting_key', unique=True),
    )