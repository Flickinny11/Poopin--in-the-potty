"""Initial database schema with all tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('subscription_tier', sa.Enum('FREE', 'BASIC', 'PRO', 'ENTERPRISE', name='subscriptiontier'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    
    # Enable RLS on users table
    op.execute('ALTER TABLE users ENABLE ROW LEVEL SECURITY')
    
    # Create RLS policies for users
    op.execute("""
        CREATE POLICY "Users can view own data" ON users 
        FOR SELECT USING (auth.uid() = id)
    """)
    op.execute("""
        CREATE POLICY "Users can update own data" ON users 
        FOR UPDATE USING (auth.uid() = id)
    """)
    op.execute("""
        CREATE POLICY "Users can insert own data" ON users 
        FOR INSERT WITH CHECK (auth.uid() = id)
    """)

    # Create voice_profiles table
    op.create_table('voice_profiles',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('language', sa.String(length=10), nullable=False),
        sa.Column('voice_data', sa.JSON(), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=True),
        sa.Column('quality_score', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('training_duration', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Enable RLS on voice_profiles
    op.execute('ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY')
    op.execute("""
        CREATE POLICY "Users can manage own voice profiles" ON voice_profiles 
        FOR ALL USING (auth.uid() = user_id)
    """)

    # Create calls table
    op.create_table('calls',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('caller_id', UUID(as_uuid=True), nullable=False),
        sa.Column('callee_id', UUID(as_uuid=True), nullable=False),
        sa.Column('room_id', sa.String(length=255), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'ENDED', 'SCHEDULED', 'CANCELLED', name='callstatus'), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('quality_rating', sa.Integer(), nullable=True),
        sa.Column('translation_enabled', sa.Boolean(), nullable=True),
        sa.Column('recording_enabled', sa.Boolean(), nullable=True),
        sa.Column('participants_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.ForeignKeyConstraint(['callee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['caller_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('room_id')
    )
    
    # Enable RLS on calls
    op.execute('ALTER TABLE calls ENABLE ROW LEVEL SECURITY')
    op.execute("""
        CREATE POLICY "Users can access own calls" ON calls 
        FOR ALL USING (auth.uid() = caller_id OR auth.uid() = callee_id)
    """)

    # Create subscriptions table
    op.create_table('subscriptions',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('stripe_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('tier', sa.Enum('FREE', 'BASIC', 'PRO', 'ENTERPRISE', name='subscriptiontier'), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING', name='subscriptionstatus'), nullable=False),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stripe_subscription_id')
    )
    
    # Enable RLS on subscriptions
    op.execute('ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY')
    op.execute("""
        CREATE POLICY "Users can manage own subscriptions" ON subscriptions 
        FOR ALL USING (auth.uid() = user_id)
    """)

    # Create usage_logs table
    op.create_table('usage_logs',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('feature_used', sa.String(length=100), nullable=False),
        sa.Column('usage_data', sa.JSON(), nullable=True),
        sa.Column('session_id', sa.String(length=255), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Enable RLS on usage_logs
    op.execute('ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY')
    op.execute("""
        CREATE POLICY "Users can access own usage logs" ON usage_logs 
        FOR SELECT USING (auth.uid() = user_id)
    """)

    # Create contacts table
    op.create_table('contacts',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('contact_user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('nickname', sa.String(length=100), nullable=True),
        sa.Column('is_favorite', sa.Boolean(), nullable=True),
        sa.Column('is_blocked', sa.Boolean(), nullable=True),
        sa.Column('last_contact', sa.DateTime(timezone=True), nullable=True),
        sa.Column('contact_frequency', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.ForeignKeyConstraint(['contact_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Enable RLS on contacts
    op.execute('ALTER TABLE contacts ENABLE ROW LEVEL SECURITY')
    op.execute("""
        CREATE POLICY "Users can manage own contacts" ON contacts 
        FOR ALL USING (auth.uid() = user_id)
    """)

    # Create user_settings table
    op.create_table('user_settings',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('setting_key', sa.String(length=100), nullable=False),
        sa.Column('setting_value', sa.JSON(), nullable=False),
        sa.Column('setting_type', sa.String(length=50), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('timezone(\'utc\'::text, now())'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Enable RLS on user_settings
    op.execute('ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY')
    op.execute("""
        CREATE POLICY "Users can manage own settings" ON user_settings 
        FOR ALL USING (auth.uid() = user_id)
    """)


def downgrade() -> None:
    # Drop RLS policies first
    op.execute('DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings')
    op.execute('DROP POLICY IF EXISTS "Users can manage own contacts" ON contacts')
    op.execute('DROP POLICY IF EXISTS "Users can access own usage logs" ON usage_logs')
    op.execute('DROP POLICY IF EXISTS "Users can manage own subscriptions" ON subscriptions')
    op.execute('DROP POLICY IF EXISTS "Users can access own calls" ON calls')
    op.execute('DROP POLICY IF EXISTS "Users can manage own voice profiles" ON voice_profiles')
    op.execute('DROP POLICY IF EXISTS "Users can view own data" ON users')
    op.execute('DROP POLICY IF EXISTS "Users can update own data" ON users')
    op.execute('DROP POLICY IF EXISTS "Users can insert own data" ON users')
    
    # Drop tables
    op.drop_table('user_settings')
    op.drop_table('contacts')
    op.drop_table('usage_logs')
    op.drop_table('subscriptions')
    op.drop_table('calls')
    op.drop_table('voice_profiles')
    op.drop_table('users')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS subscriptionstatus')
    op.execute('DROP TYPE IF EXISTS callstatus')
    op.execute('DROP TYPE IF EXISTS subscriptiontier')