-- 002_add_indexes.sql
-- Performance optimization indexes for production workloads

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

-- Voice profiles indexes
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_id ON voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_language ON voice_profiles(language_code);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_default ON voice_profiles(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_voice_profiles_status ON voice_profiles(training_status);

-- Calls table indexes
CREATE INDEX IF NOT EXISTS idx_calls_room_id ON calls(room_id);
CREATE INDEX IF NOT EXISTS idx_calls_host_user_id ON calls(host_user_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_scheduled_start ON calls(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_calls_actual_start ON calls(actual_start);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);
CREATE INDEX IF NOT EXISTS idx_calls_active ON calls(status) WHERE status = 'active';

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(status) WHERE status = 'active';

-- Usage logs indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_call_id ON usage_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_logs_billing_period ON usage_logs(billing_period);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_period ON usage_logs(user_id, billing_period);

-- Contacts table indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON contacts(contact_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON contacts(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_language ON user_settings(language);
CREATE INDEX IF NOT EXISTS idx_user_settings_timezone ON user_settings(timezone);

-- Webhook events indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed ON webhook_events(processed, created_at) WHERE processed = false;

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_calls_host_status_date ON calls(host_user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_action_period ON usage_logs(user_id, action_type, billing_period);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_calls_active_scheduled ON calls(scheduled_start) WHERE status IN ('scheduled', 'active');
CREATE INDEX IF NOT EXISTS idx_voice_profiles_completed ON voice_profiles(user_id, language_code) WHERE training_status = 'completed';

-- Text search indexes for names and emails
CREATE INDEX IF NOT EXISTS idx_users_full_name_gin ON users USING gin(to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_contacts_name_gin ON contacts USING gin(to_tsvector('english', name));

-- JSONB indexes for metadata queries
CREATE INDEX IF NOT EXISTS idx_calls_settings_gin ON calls USING gin(settings);
CREATE INDEX IF NOT EXISTS idx_usage_logs_metadata_gin ON usage_logs USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_user_settings_notifications_gin ON user_settings USING gin(notifications);
CREATE INDEX IF NOT EXISTS idx_user_settings_call_settings_gin ON user_settings USING gin(call_settings);