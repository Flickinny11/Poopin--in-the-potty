-- 004_vs_presenter_tables.sql
-- Database schema for VS Presenter feature

-- Presentation rooms table
CREATE TABLE IF NOT EXISTS presentation_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(8) UNIQUE NOT NULL,
    host_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Configuration
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('in-person', 'hybrid', 'multi-user-hub')),
    presenter_language VARCHAR(5) NOT NULL,
    audience_languages TEXT[] NOT NULL,
    voice_mode VARCHAR(10) NOT NULL CHECK (voice_mode IN ('clone', 'ai-voice')),
    selected_ai_voice VARCHAR(50),
    language_lock BOOLEAN DEFAULT false,
    max_participants INTEGER DEFAULT 100,
    recording_enabled BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presentation participants table (extends call participants for presenter features)
CREATE TABLE IF NOT EXISTS presentation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presentation_room_id UUID REFERENCES presentation_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    
    -- Participant info
    name VARCHAR(255) NOT NULL,
    selected_language VARCHAR(5) NOT NULL,
    is_presenter BOOLEAN DEFAULT false,
    
    -- Status
    is_muted BOOLEAN DEFAULT false,
    has_raised_hand BOOLEAN DEFAULT false,
    is_speaking BOOLEAN DEFAULT false,
    
    -- Audio/Video state
    audio_enabled BOOLEAN DEFAULT true,
    video_enabled BOOLEAN DEFAULT false,
    
    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(presentation_room_id, session_id)
);

-- Presentation analytics table
CREATE TABLE IF NOT EXISTS presentation_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presentation_room_id UUID REFERENCES presentation_rooms(id) ON DELETE CASCADE,
    
    -- Metrics
    total_participants INTEGER DEFAULT 0,
    peak_participants INTEGER DEFAULT 0,
    average_participants NUMERIC(5,2) DEFAULT 0,
    
    -- Language distribution (stored as JSONB)
    language_distribution JSONB DEFAULT '[]'::jsonb,
    
    -- Engagement metrics
    questions_asked INTEGER DEFAULT 0,
    average_engagement_score NUMERIC(3,2) DEFAULT 0,
    
    -- Quality metrics
    translation_accuracy NUMERIC(3,2) DEFAULT 0,
    audio_quality_score NUMERIC(3,2) DEFAULT 0,
    
    -- Cost tracking
    total_cost NUMERIC(10,2) DEFAULT 0,
    cost_per_minute NUMERIC(6,4) DEFAULT 0,
    
    -- Timestamps
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presentation recordings table
CREATE TABLE IF NOT EXISTS presentation_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presentation_room_id UUID REFERENCES presentation_rooms(id) ON DELETE CASCADE,
    
    -- Recording info
    daily_recording_id VARCHAR(255),
    file_url TEXT,
    file_size BIGINT,
    duration_seconds INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on presentation tables
ALTER TABLE presentation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for presentation_rooms
CREATE POLICY "Users can view presentations they host" ON presentation_rooms
    FOR SELECT USING (auth.uid() = host_user_id);

CREATE POLICY "Users can manage presentations they host" ON presentation_rooms
    FOR ALL USING (auth.uid() = host_user_id);

CREATE POLICY "Anyone can view active presentations by code" ON presentation_rooms
    FOR SELECT USING (is_active = true);

-- RLS Policies for presentation_participants
CREATE POLICY "Users can view participants in their presentations" ON presentation_participants
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM presentation_rooms 
            WHERE id = presentation_participants.presentation_room_id 
            AND host_user_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can manage participants" ON presentation_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM presentation_rooms 
            WHERE id = presentation_participants.presentation_room_id 
            AND host_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert themselves as participants" ON presentation_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for presentation_analytics
CREATE POLICY "Hosts can view analytics" ON presentation_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM presentation_rooms 
            WHERE id = presentation_analytics.presentation_room_id 
            AND host_user_id = auth.uid()
        )
    );

-- RLS Policies for presentation_recordings
CREATE POLICY "Hosts can view recordings" ON presentation_recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM presentation_rooms 
            WHERE id = presentation_recordings.presentation_room_id 
            AND host_user_id = auth.uid()
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_presentation_rooms_code ON presentation_rooms(code);
CREATE INDEX IF NOT EXISTS idx_presentation_rooms_host ON presentation_rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_rooms_active ON presentation_rooms(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_presentation_participants_room ON presentation_participants(presentation_room_id);
CREATE INDEX IF NOT EXISTS idx_presentation_participants_user ON presentation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_participants_session ON presentation_participants(session_id);

CREATE INDEX IF NOT EXISTS idx_presentation_analytics_room ON presentation_analytics(presentation_room_id);
CREATE INDEX IF NOT EXISTS idx_presentation_recordings_room ON presentation_recordings(presentation_room_id);

-- Function to update presentation room participant count
CREATE OR REPLACE FUNCTION update_presentation_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE presentation_rooms 
        SET updated_at = NOW()
        WHERE id = NEW.presentation_room_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.left_at IS NULL AND NEW.left_at IS NOT NULL THEN
        UPDATE presentation_rooms 
        SET updated_at = NOW()
        WHERE id = NEW.presentation_room_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE presentation_rooms 
        SET updated_at = NOW()
        WHERE id = OLD.presentation_room_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update participant count
CREATE TRIGGER update_presentation_participant_count
    AFTER INSERT OR UPDATE OR DELETE ON presentation_participants
    FOR EACH ROW EXECUTE FUNCTION update_presentation_participant_count();

-- Function to automatically end inactive presentations
CREATE OR REPLACE FUNCTION cleanup_inactive_presentations()
RETURNS void AS $$
BEGIN
    UPDATE presentation_rooms 
    SET is_active = false, ended_at = NOW()
    WHERE is_active = true 
    AND created_at < NOW() - INTERVAL '4 hours'
    AND started_at IS NULL; -- Never actually started
    
    UPDATE presentation_rooms 
    SET is_active = false, ended_at = NOW()
    WHERE is_active = true 
    AND started_at < NOW() - INTERVAL '12 hours'; -- Running too long
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;