"""
Database configuration and connection management
"""
import os
import asyncpg
from databases import Database
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger(__name__)

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Allow for testing/development without real database
    DATABASE_URL = "postgresql://test:test@localhost:5432/test"
    import warnings
    warnings.warn("Using default DATABASE_URL for testing. Set DATABASE_URL environment variable for production.")

# Create database instance
database = Database(DATABASE_URL)

# SQLAlchemy setup for migrations and ORM (lazy loading)
def get_engine():
    """Get SQLAlchemy engine lazily"""
    return create_engine(DATABASE_URL)

def get_session_local():
    """Get SessionLocal class lazily"""
    engine = get_engine()
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Metadata for table definitions
metadata = MetaData()

async def get_database() -> Database:
    """Get database instance"""
    return database

async def check_database_connection() -> bool:
    """Check if database connection is working"""
    try:
        await database.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

class DatabaseManager:
    """Database manager for handling connections and queries"""
    
    def __init__(self):
        self.database = database
    
    async def execute_query(self, query: str, values: dict = None):
        """Execute a database query"""
        try:
            if values:
                return await self.database.execute(query, values)
            else:
                return await self.database.execute(query)
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise
    
    async def fetch_one(self, query: str, values: dict = None):
        """Fetch one record from database"""
        try:
            if values:
                return await self.database.fetch_one(query, values)
            else:
                return await self.database.fetch_one(query)
        except Exception as e:
            logger.error(f"Fetch one failed: {e}")
            raise
    
    async def fetch_all(self, query: str, values: dict = None):
        """Fetch all records from database"""
        try:
            if values:
                return await self.database.fetch_all(query, values)
            else:
                return await self.database.fetch_all(query)
        except Exception as e:
            logger.error(f"Fetch all failed: {e}")
            raise
    
    # Subscription methods
    async def get_user_subscription(self, user_id):
        """Get user's current subscription"""
        query = """
        SELECT * FROM subscriptions 
        WHERE user_id = :user_id AND status = 'active'
        ORDER BY created_at DESC LIMIT 1
        """
        result = await self.fetch_one(query, {"user_id": str(user_id)})
        return dict(result) if result else None
    
    async def create_subscription(self, subscription_data: dict):
        """Create new subscription"""
        query = """
        INSERT INTO subscriptions (
            user_id, stripe_subscription_id, stripe_customer_id, stripe_price_id,
            tier, status, current_period_start, current_period_end,
            cancel_at_period_end, trial_end
        ) VALUES (
            :user_id, :stripe_subscription_id, :stripe_customer_id, :stripe_price_id,
            :tier, :status, :current_period_start, :current_period_end,
            :cancel_at_period_end, :trial_end
        ) RETURNING id
        """
        return await self.execute_query(query, subscription_data)
    
    async def update_subscription(self, subscription_id, updates: dict):
        """Update subscription"""
        set_clauses = []
        values = {"id": str(subscription_id)}
        
        for key, value in updates.items():
            set_clauses.append(f"{key} = :{key}")
            values[key] = value
        
        query = f"""
        UPDATE subscriptions 
        SET {', '.join(set_clauses)}, updated_at = NOW()
        WHERE id = :id
        """
        return await self.execute_query(query, values)
    
    async def get_subscription_by_stripe_id(self, stripe_subscription_id: str):
        """Get subscription by Stripe subscription ID"""
        query = """
        SELECT * FROM subscriptions 
        WHERE stripe_subscription_id = :stripe_subscription_id
        """
        result = await self.fetch_one(query, {"stripe_subscription_id": stripe_subscription_id})
        return dict(result) if result else None
    
    async def update_user_subscription_tier(self, user_id, tier):
        """Update user's subscription tier"""
        query = """
        UPDATE users 
        SET subscription_tier = :tier, updated_at = NOW()
        WHERE id = :user_id
        """
        return await self.execute_query(query, {
            "user_id": str(user_id),
            "tier": tier.value
        })
    
    # Webhook event methods
    async def get_webhook_event(self, event_id: str):
        """Get webhook event by ID"""
        query = """
        SELECT * FROM webhook_events WHERE id = :event_id
        """
        result = await self.fetch_one(query, {"event_id": event_id})
        return dict(result) if result else None
    
    async def upsert_webhook_event(self, event_data: dict):
        """Insert or update webhook event"""
        query = """
        INSERT INTO webhook_events (
            id, event_type, status, event_data, retry_count
        ) VALUES (
            :id, :event_type, :status, :event_data, :retry_count
        ) ON CONFLICT (id) DO UPDATE SET
            event_type = EXCLUDED.event_type,
            status = EXCLUDED.status,
            event_data = EXCLUDED.event_data,
            retry_count = EXCLUDED.retry_count,
            updated_at = NOW()
        """
        return await self.execute_query(query, event_data)
    
    async def update_webhook_event(self, event_id: str, updates: dict):
        """Update webhook event"""
        set_clauses = []
        values = {"id": event_id}
        
        for key, value in updates.items():
            set_clauses.append(f"{key} = :{key}")
            values[key] = value
        
        query = f"""
        UPDATE webhook_events 
        SET {', '.join(set_clauses)}, updated_at = NOW()
        WHERE id = :id
        """
        return await self.execute_query(query, values)
    
    # Usage tracking methods
    async def get_user_usage_stats(self, user_id, period_start=None, period_end=None):
        """Get user usage statistics for a billing period"""
        from datetime import datetime, timezone
        
        if not period_start:
            # Default to current month
            now = datetime.now(timezone.utc)
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        if not period_end:
            # Default to end of current month
            from calendar import monthrange
            now = datetime.now(timezone.utc)
            last_day = monthrange(now.year, now.month)[1]
            period_end = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
        
        # Get call minutes
        call_query = """
        SELECT COALESCE(SUM(duration), 0) / 60 as total_minutes,
               COUNT(*) as calls_count
        FROM calls 
        WHERE (caller_id = :user_id OR callee_id = :user_id)
        AND created_at >= :period_start 
        AND created_at <= :period_end
        AND status = 'ended'
        """
        
        call_result = await self.fetch_one(call_query, {
            "user_id": str(user_id),
            "period_start": period_start,
            "period_end": period_end
        })
        
        # Get feature usage
        feature_query = """
        SELECT feature_used, COUNT(*) as usage_count
        FROM usage_logs
        WHERE user_id = :user_id
        AND created_at >= :period_start 
        AND created_at <= :period_end
        GROUP BY feature_used
        """
        
        feature_results = await self.fetch_all(feature_query, {
            "user_id": str(user_id),
            "period_start": period_start,
            "period_end": period_end
        })
        
        features_used = {row['feature_used']: row['usage_count'] for row in feature_results}
        
        return {
            "total_minutes": int(call_result['total_minutes']) if call_result['total_minutes'] else 0,
            "calls_count": call_result['calls_count'] if call_result['calls_count'] else 0,
            "features_used": features_used
        }
    
    async def get_user_by_email(self, email: str):
        """Get user by email"""
        query = """
        SELECT * FROM users WHERE email = :email
        """
        result = await self.fetch_one(query, {"email": email})
        return dict(result) if result else None

# Global database manager instance
db_manager = DatabaseManager()