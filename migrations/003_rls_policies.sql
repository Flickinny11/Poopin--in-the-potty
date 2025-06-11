-- 003_rls_policies.sql
-- Row Level Security policies for production security

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Voice profiles policies
CREATE POLICY "Users can view own voice profiles" ON voice_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own voice profiles" ON voice_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Calls table policies
CREATE POLICY "Users can view calls they host" ON calls
    FOR SELECT USING (auth.uid() = host_user_id);

CREATE POLICY "Users can view calls they participate in" ON calls
    FOR SELECT USING (
        auth.uid() = host_user_id OR 
        EXISTS (
            SELECT 1 FROM call_participants 
            WHERE call_id = calls.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage calls they host" ON calls
    FOR ALL USING (auth.uid() = host_user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage logs" ON usage_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Contacts policies
CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own contacts" ON contacts
    FOR ALL USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Webhook events policies (service role only)
CREATE POLICY "Service role can manage webhook events" ON webhook_events
    FOR ALL USING (auth.role() = 'service_role');

-- Create call_participants table for many-to-many relationship
CREATE TABLE IF NOT EXISTS call_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    is_host BOOLEAN DEFAULT false,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'observer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(call_id, user_id)
);

-- Enable RLS on call_participants
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;

-- Call participants policies
CREATE POLICY "Users can view call participants for their calls" ON call_participants
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM calls 
            WHERE id = call_participants.call_id AND host_user_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can manage call participants" ON call_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM calls 
            WHERE id = call_participants.call_id AND host_user_id = auth.uid()
        )
    );

-- Indexes for call_participants
CREATE INDEX IF NOT EXISTS idx_call_participants_call_id ON call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_user_id ON call_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_host ON call_participants(call_id, is_host) WHERE is_host = true;

-- Create function to automatically create user settings
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user settings on user creation
CREATE TRIGGER on_user_created
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-- Create function to update call participant count
CREATE OR REPLACE FUNCTION update_call_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE calls 
        SET participant_count = (
            SELECT COUNT(*) FROM call_participants 
            WHERE call_id = NEW.call_id AND left_at IS NULL
        )
        WHERE id = NEW.call_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.left_at IS NULL AND NEW.left_at IS NOT NULL THEN
        UPDATE calls 
        SET participant_count = (
            SELECT COUNT(*) FROM call_participants 
            WHERE call_id = NEW.call_id AND left_at IS NULL
        )
        WHERE id = NEW.call_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE calls 
        SET participant_count = (
            SELECT COUNT(*) FROM call_participants 
            WHERE call_id = OLD.call_id AND left_at IS NULL
        )
        WHERE id = OLD.call_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update participant count
CREATE TRIGGER update_participant_count
    AFTER INSERT OR UPDATE OR DELETE ON call_participants
    FOR EACH ROW EXECUTE FUNCTION update_call_participant_count();