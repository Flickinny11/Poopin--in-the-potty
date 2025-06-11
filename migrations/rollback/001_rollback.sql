-- rollback/001_rollback.sql
-- Rollback script for initial schema migration

-- Drop triggers first
DROP TRIGGER IF EXISTS auto_log_call_events_trigger ON calls;
DROP TRIGGER IF EXISTS update_participant_count ON call_participants;
DROP TRIGGER IF EXISTS on_user_created ON users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_voice_profiles_updated_at ON voice_profiles;
DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS create_user_settings();
DROP FUNCTION IF EXISTS update_call_participant_count();
DROP FUNCTION IF EXISTS auto_log_call_events();
DROP FUNCTION IF EXISTS get_user_usage_stats(UUID, VARCHAR);
DROP FUNCTION IF EXISTS check_usage_limits(UUID, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS log_usage(UUID, UUID, VARCHAR, INTEGER, INTEGER, JSONB);
DROP FUNCTION IF EXISTS cleanup_old_data();
DROP FUNCTION IF EXISTS update_user_subscription_tier(UUID, VARCHAR);
DROP FUNCTION IF EXISTS get_analytics_summary(DATE, DATE);
DROP FUNCTION IF EXISTS schedule_cleanup();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS call_participants CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS voice_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop extensions
DROP EXTENSION IF EXISTS "pgcrypto";
DROP EXTENSION IF EXISTS "uuid-ossp";