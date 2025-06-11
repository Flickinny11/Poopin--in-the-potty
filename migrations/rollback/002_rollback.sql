-- rollback/002_rollback.sql
-- Rollback script for indexes migration

-- Drop all indexes created in 002_add_indexes.sql

-- Users table indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_stripe_customer_id;
DROP INDEX IF EXISTS idx_users_subscription_tier;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_active;
DROP INDEX IF EXISTS idx_users_full_name_gin;

-- Voice profiles indexes
DROP INDEX IF EXISTS idx_voice_profiles_user_id;
DROP INDEX IF EXISTS idx_voice_profiles_language;
DROP INDEX IF EXISTS idx_voice_profiles_default;
DROP INDEX IF EXISTS idx_voice_profiles_status;
DROP INDEX IF EXISTS idx_voice_profiles_completed;

-- Calls table indexes
DROP INDEX IF EXISTS idx_calls_room_id;
DROP INDEX IF EXISTS idx_calls_host_user_id;
DROP INDEX IF EXISTS idx_calls_status;
DROP INDEX IF EXISTS idx_calls_scheduled_start;
DROP INDEX IF EXISTS idx_calls_actual_start;
DROP INDEX IF EXISTS idx_calls_created_at;
DROP INDEX IF EXISTS idx_calls_active;
DROP INDEX IF EXISTS idx_calls_host_status_date;
DROP INDEX IF EXISTS idx_calls_active_scheduled;
DROP INDEX IF EXISTS idx_calls_settings_gin;

-- Subscriptions table indexes
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_stripe_subscription_id;
DROP INDEX IF EXISTS idx_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_tier;
DROP INDEX IF EXISTS idx_subscriptions_period_end;
DROP INDEX IF EXISTS idx_subscriptions_active;
DROP INDEX IF EXISTS idx_subscriptions_user_status;

-- Usage logs indexes
DROP INDEX IF EXISTS idx_usage_logs_user_id;
DROP INDEX IF EXISTS idx_usage_logs_call_id;
DROP INDEX IF EXISTS idx_usage_logs_action_type;
DROP INDEX IF EXISTS idx_usage_logs_timestamp;
DROP INDEX IF EXISTS idx_usage_logs_billing_period;
DROP INDEX IF EXISTS idx_usage_logs_user_period;
DROP INDEX IF EXISTS idx_usage_logs_user_action_period;
DROP INDEX IF EXISTS idx_usage_logs_metadata_gin;

-- Contacts table indexes
DROP INDEX IF EXISTS idx_contacts_user_id;
DROP INDEX IF EXISTS idx_contacts_contact_user_id;
DROP INDEX IF EXISTS idx_contacts_email;
DROP INDEX IF EXISTS idx_contacts_favorite;
DROP INDEX IF EXISTS idx_contacts_created_at;
DROP INDEX IF EXISTS idx_contacts_name_gin;

-- User settings indexes
DROP INDEX IF EXISTS idx_user_settings_user_id;
DROP INDEX IF EXISTS idx_user_settings_language;
DROP INDEX IF EXISTS idx_user_settings_timezone;
DROP INDEX IF EXISTS idx_user_settings_notifications_gin;
DROP INDEX IF EXISTS idx_user_settings_call_settings_gin;

-- Webhook events indexes
DROP INDEX IF EXISTS idx_webhook_events_stripe_event_id;
DROP INDEX IF EXISTS idx_webhook_events_event_type;
DROP INDEX IF EXISTS idx_webhook_events_processed;
DROP INDEX IF EXISTS idx_webhook_events_created_at;
DROP INDEX IF EXISTS idx_webhook_events_unprocessed;

-- Call participants indexes
DROP INDEX IF EXISTS idx_call_participants_call_id;
DROP INDEX IF EXISTS idx_call_participants_user_id;
DROP INDEX IF EXISTS idx_call_participants_host;