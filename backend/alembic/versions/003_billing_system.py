"""Add billing system enhancements

Revision ID: 003_billing_system
Revises: 002_add_indexes
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_billing_system'
down_revision = '002_add_indexes'
branch_labels = None
depends_on = None

def upgrade():
    # Update subscription_tier enum to replace 'enterprise' with 'business'
    op.execute("ALTER TYPE subscriptiontier RENAME VALUE 'enterprise' TO 'business'")
    
    # Add new columns to subscriptions table
    op.add_column('subscriptions', sa.Column('stripe_customer_id', sa.String(255), nullable=True))
    op.add_column('subscriptions', sa.Column('stripe_price_id', sa.String(255), nullable=True))
    
    # Add indexes for new columns
    op.create_index('idx_subscriptions_customer', 'subscriptions', ['stripe_customer_id'])
    
    # Create webhook_events table
    op.create_table('webhook_events',
        sa.Column('id', sa.String(255), primary_key=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, default='processing'),
        sa.Column('retry_count', sa.Integer(), nullable=False, default=0),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('event_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Add indexes for webhook_events
    op.create_index('idx_webhook_events_type_status', 'webhook_events', ['event_type', 'status'])
    op.create_index('idx_webhook_events_created', 'webhook_events', ['created_at'])

def downgrade():
    # Drop webhook_events table
    op.drop_index('idx_webhook_events_created')
    op.drop_index('idx_webhook_events_type_status')
    op.drop_table('webhook_events')
    
    # Remove new subscription columns
    op.drop_index('idx_subscriptions_customer')
    op.drop_column('subscriptions', 'stripe_price_id')
    op.drop_column('subscriptions', 'stripe_customer_id')
    
    # Revert subscription_tier enum change
    op.execute("ALTER TYPE subscriptiontier RENAME VALUE 'business' TO 'enterprise'")