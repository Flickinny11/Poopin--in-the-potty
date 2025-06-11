"""
Authentication middleware for JWT token verification with Supabase
"""
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import os
import httpx
import asyncio
from typing import Optional
import logging
from uuid import UUID

from ..schemas import TokenData
from ..database import db_manager

logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "your-secret-key")
JWT_ALGORITHM = "HS256"

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    # Allow for testing/development
    SUPABASE_URL = SUPABASE_URL or "https://test.supabase.co"
    SUPABASE_SERVICE_KEY = SUPABASE_SERVICE_KEY or "test-service-key"
    import warnings
    warnings.warn("Using default Supabase configuration for testing. Set SUPABASE_URL and SUPABASE_SERVICE_KEY for production.")

security = HTTPBearer()

class AuthenticationError(HTTPException):
    """Custom authentication error"""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

async def verify_supabase_jwt(token: str) -> Optional[dict]:
    """
    Verify JWT token with Supabase
    Returns user data if valid, None otherwise
    """
    try:
        # Get Supabase JWT secret from the API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/",
                headers={
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "apikey": SUPABASE_SERVICE_KEY
                }
            )
            
        # Decode the JWT token
        # In production, you'd get the actual JWT secret from Supabase
        # For now, we'll use a placeholder verification
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None or email is None:
            return None
            
        return {
            "user_id": user_id,
            "email": email,
            "exp": payload.get("exp"),
            "iat": payload.get("iat")
        }
        
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return None

async def get_current_user_from_token(token_data: dict) -> Optional[dict]:
    """
    Get current user data from database using token data
    """
    try:
        user_id = token_data.get("user_id")
        if not user_id:
            return None
            
        # Query user from database
        query = """
        SELECT id, email, full_name, avatar_url, subscription_tier, 
               is_active, last_login, created_at, updated_at
        FROM users 
        WHERE id = :user_id AND is_active = true
        """
        
        user_record = await db_manager.fetch_one(query, {"user_id": user_id})
        
        if not user_record:
            return None
            
        return dict(user_record)
        
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Get current authenticated user
    Dependency for protected routes
    """
    token = credentials.credentials
    
    # Verify JWT token
    token_data = await verify_supabase_jwt(token)
    if not token_data:
        raise AuthenticationError("Invalid authentication token")
    
    # Get user data from database
    user = await get_current_user_from_token(token_data)
    if not user:
        raise AuthenticationError("User not found or inactive")
    
    return user

async def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Get current active user
    Additional check for user status
    """
    if not current_user.get("is_active", False):
        raise AuthenticationError("User account is disabled")
    
    return current_user

async def get_optional_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """
    Get current user if authenticated, None otherwise
    For routes that work with or without authentication
    """
    if not credentials:
        return None
        
    try:
        return await get_current_user(credentials)
    except AuthenticationError:
        return None

def require_subscription_tier(required_tier: str):
    """
    Decorator to require specific subscription tier
    """
    def dependency(current_user: dict = Depends(get_current_active_user)) -> dict:
        user_tier = current_user.get("subscription_tier", "free")
        
        tier_hierarchy = {
            "free": 0,
            "basic": 1,
            "pro": 2,
            "business": 3
        }
        
        if tier_hierarchy.get(user_tier, 0) < tier_hierarchy.get(required_tier, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires {required_tier} subscription or higher"
            )
        
        return current_user
    
    return dependency

async def check_usage_limits(current_user: dict, feature: str, usage_amount: int = 1):
    """
    Check if user has enough quota for the requested feature usage
    """
    from ..database import db_manager
    from datetime import datetime, timezone
    
    user_id = current_user.get("id")
    user_tier = current_user.get("subscription_tier", "free")
    
    # Define limits per tier
    tier_limits = {
        "free": {
            "minutes_per_month": 5,
            "max_participants": 2,
            "languages": 5,
            "calls_per_day": 3
        },
        "basic": {
            "minutes_per_month": 60,
            "max_participants": 2,
            "languages": 15,
            "calls_per_day": 20
        },
        "pro": {
            "minutes_per_month": 300,
            "max_participants": 10,
            "languages": 50,
            "calls_per_day": 100
        },
        "business": {
            "minutes_per_month": -1,  # Unlimited
            "max_participants": 100,
            "languages": 50,
            "calls_per_day": -1  # Unlimited
        }
    }
    
    limits = tier_limits.get(user_tier, tier_limits["free"])
    
    # Get current subscription period
    subscription = await db_manager.get_user_subscription(user_id)
    period_start = subscription.get('current_period_start') if subscription else None
    period_end = subscription.get('current_period_end') if subscription else None
    
    # Get usage stats
    usage_stats = await db_manager.get_user_usage_stats(user_id, period_start, period_end)
    
    # Check specific feature limits
    if feature == "call_minutes":
        monthly_limit = limits["minutes_per_month"]
        if monthly_limit > 0:  # -1 means unlimited
            current_usage = usage_stats.get("total_minutes", 0)
            if current_usage + usage_amount > monthly_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Monthly minutes limit exceeded. Current: {current_usage}, Limit: {monthly_limit}"
                )
    
    elif feature == "participants":
        max_participants = limits["max_participants"]
        if usage_amount > max_participants:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Participant limit exceeded. Max allowed: {max_participants}"
            )
    
    elif feature == "daily_calls":
        daily_limit = limits["calls_per_day"]
        if daily_limit > 0:  # -1 means unlimited
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = today_start.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            today_usage = await db_manager.get_user_usage_stats(user_id, today_start, today_end)
            current_calls = today_usage.get("calls_count", 0)
            
            if current_calls + usage_amount > daily_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Daily calls limit exceeded. Current: {current_calls}, Limit: {daily_limit}"
                )
    
    return True

def require_usage_limit(feature: str, usage_amount: int = 1):
    """
    Decorator to check usage limits before allowing feature access
    """
    async def dependency(current_user: dict = Depends(get_current_active_user)) -> dict:
        await check_usage_limits(current_user, feature, usage_amount)
        return current_user
    
    return dependency

async def verify_user_access(user_id: UUID, current_user: dict = Depends(get_current_active_user)) -> bool:
    """
    Verify that the current user has access to the specified user's data
    """
    current_user_id = current_user.get("id")
    
    if str(current_user_id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot access other user's data"
        )
    
    return True

async def update_last_login(user_id: UUID):
    """
    Update user's last login timestamp
    """
    try:
        query = """
        UPDATE users 
        SET last_login = timezone('utc'::text, now())
        WHERE id = :user_id
        """
        await db_manager.execute_query(query, {"user_id": str(user_id)})
    except Exception as e:
        logger.error(f"Failed to update last login: {e}")

# Rate limiting (basic implementation)
user_request_counts = {}
MAX_REQUESTS_PER_MINUTE = 60

async def rate_limit_check(current_user: dict = Depends(get_current_active_user)) -> dict:
    """
    Basic rate limiting for authenticated users
    """
    user_id = current_user.get("id")
    current_time = asyncio.get_event_loop().time()
    
    if user_id not in user_request_counts:
        user_request_counts[user_id] = []
    
    # Clean old requests (older than 1 minute)
    user_request_counts[user_id] = [
        req_time for req_time in user_request_counts[user_id] 
        if current_time - req_time < 60
    ]
    
    # Check if limit exceeded
    if len(user_request_counts[user_id]) >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
    
    # Add current request
    user_request_counts[user_id].append(current_time)
    
    return current_user