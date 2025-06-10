"""Add performance indexes

Revision ID: 002_add_indexes
Revises: 001_initial_schema
Create Date: 2024-01-01 12:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_indexes'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # User-related indexes
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_subscription_tier', 'users', ['subscription_tier'])
    
    # Call-related indexes
    op.create_index('idx_calls_user_id', 'calls', ['caller_id', 'callee_id'])
    op.create_index('idx_calls_created_at', 'calls', ['created_at'], postgresql_ops={'created_at': 'DESC'})
    op.create_index('idx_calls_status', 'calls', ['status'], 
                    postgresql_where=sa.text("status = 'ACTIVE'"))
    
    # Usage tracking indexes
    op.create_index('idx_usage_logs_user_date', 'usage_logs', ['user_id', 'created_at'])
    op.create_index('idx_usage_logs_feature', 'usage_logs', ['feature_used'])
    
    # Voice profile indexes
    op.create_index('idx_voice_profiles_user_lang', 'voice_profiles', ['user_id', 'language'])
    
    # Subscription indexes
    op.create_index('idx_subscriptions_stripe_id', 'subscriptions', ['stripe_subscription_id'])
    op.create_index('idx_subscriptions_status', 'subscriptions', ['status'],
                    postgresql_where=sa.text("status = 'ACTIVE'"))
    
    # User settings indexes
    op.create_index('idx_user_settings_user_key', 'user_settings', ['user_id', 'setting_key'], unique=True)
    
    # Contact indexes
    op.create_index('idx_contacts_user_favorite', 'contacts', ['user_id', 'is_favorite'])
    op.create_index('idx_contacts_frequency', 'contacts', ['user_id', 'contact_frequency'])


def downgrade() -> None:
    # Drop all indexes
    op.drop_index('idx_contacts_frequency', table_name='contacts')
    op.drop_index('idx_contacts_user_favorite', table_name='contacts')
    op.drop_index('idx_user_settings_user_key', table_name='user_settings')
    op.drop_index('idx_subscriptions_status', table_name='subscriptions')
    op.drop_index('idx_subscriptions_stripe_id', table_name='subscriptions')
    op.drop_index('idx_voice_profiles_user_lang', table_name='voice_profiles')
    op.drop_index('idx_usage_logs_feature', table_name='usage_logs')
    op.drop_index('idx_usage_logs_user_date', table_name='usage_logs')
    op.drop_index('idx_calls_status', table_name='calls')
    op.drop_index('idx_calls_created_at', table_name='calls')
    op.drop_index('idx_calls_user_id', table_name='calls')
    op.drop_index('idx_users_subscription_tier', table_name='users')
    op.drop_index('idx_users_email', table_name='users')