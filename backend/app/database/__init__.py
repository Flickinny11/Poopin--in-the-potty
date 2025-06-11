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

# Global database manager instance
db_manager = DatabaseManager()