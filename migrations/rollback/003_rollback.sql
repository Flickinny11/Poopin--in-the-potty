-- rollback/003_rollback.sql
-- Rollback script for RLS policies migration

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

DROP POLICY IF EXISTS "Users can view own voice profiles" ON voice_profiles;
DROP POLICY IF EXISTS "Users can manage own voice profiles" ON voice_profiles;

DROP POLICY IF EXISTS "Users can view calls they host" ON calls;
DROP POLICY IF EXISTS "Users can view calls they participate in" ON calls;
DROP POLICY IF EXISTS "Users can manage calls they host" ON calls;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "Users can view own usage logs" ON usage_logs;
DROP POLICY IF EXISTS "Service role can manage usage logs" ON usage_logs;

DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage own contacts" ON contacts;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;

DROP POLICY IF EXISTS "Service role can manage webhook events" ON webhook_events;

DROP POLICY IF EXISTS "Users can view call participants for their calls" ON call_participants;
DROP POLICY IF EXISTS "Hosts can manage call participants" ON call_participants;

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants DISABLE ROW LEVEL SECURITY;