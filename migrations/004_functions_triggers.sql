-- 004_functions_triggers.sql
-- Additional functions and triggers for production features

-- Function to calculate usage statistics
CREATE OR REPLACE FUNCTION get_user_usage_stats(
    p_user_id UUID,
    p_billing_period VARCHAR(7) DEFAULT NULL
)
RETURNS TABLE (
    total_minutes INTEGER,
    total_calls INTEGER,
    translation_minutes INTEGER,
    recording_minutes INTEGER,
    current_period VARCHAR(7)
) AS $$
DECLARE
    current_period_val VARCHAR(7);
BEGIN
    -- Default to current month if no period specified
    current_period_val := COALESCE(p_billing_period, TO_CHAR(NOW(), 'YYYY-MM'));
    
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN action_type = 'call_ended' THEN duration_minutes ELSE 0 END), 0)::INTEGER as total_minutes,
        COALESCE(COUNT(CASE WHEN action_type = 'call_started' THEN 1 END), 0)::INTEGER as total_calls,
        COALESCE(SUM(CASE WHEN action_type = 'translation_used' THEN duration_minutes ELSE 0 END), 0)::INTEGER as translation_minutes,
        COALESCE(SUM(CASE WHEN action_type = 'recording_started' THEN duration_minutes ELSE 0 END), 0)::INTEGER as recording_minutes,
        current_period_val as current_period
    FROM usage_logs
    WHERE user_id = p_user_id 
    AND billing_period = current_period_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limits(
    p_user_id UUID,
    p_action_type VARCHAR(50),
    p_requested_duration INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    user_tier VARCHAR(20);
    current_usage RECORD;
    limits JSONB;
    result JSONB;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM users
    WHERE id = p_user_id;
    
    -- Set limits based on tier
    CASE user_tier
        WHEN 'free' THEN
            limits := '{"monthly_minutes": 5, "daily_calls": 3, "max_participants": 2}';
        WHEN 'basic' THEN
            limits := '{"monthly_minutes": 60, "daily_calls": 20, "max_participants": 2}';
        WHEN 'pro' THEN
            limits := '{"monthly_minutes": 300, "daily_calls": 100, "max_participants": 10}';
        WHEN 'business' THEN
            limits := '{"monthly_minutes": -1, "daily_calls": -1, "max_participants": 100}';
        ELSE
            limits := '{"monthly_minutes": 5, "daily_calls": 3, "max_participants": 2}';
    END CASE;
    
    -- Get current usage
    SELECT * INTO current_usage
    FROM get_user_usage_stats(p_user_id);
    
    -- Check limits and return result
    result := jsonb_build_object(
        'allowed', true,
        'tier', user_tier,
        'limits', limits,
        'current_usage', jsonb_build_object(
            'monthly_minutes', current_usage.total_minutes,
            'daily_calls', current_usage.total_calls
        )
    );
    
    -- Check monthly minutes limit
    IF (limits->>'monthly_minutes')::INTEGER > 0 AND 
       current_usage.total_minutes + p_requested_duration > (limits->>'monthly_minutes')::INTEGER THEN
        result := jsonb_set(result, '{allowed}', 'false');
        result := jsonb_set(result, '{reason}', '"Monthly minutes limit exceeded"');
    END IF;
    
    -- For business tier, always allow
    IF user_tier = 'business' THEN
        result := jsonb_set(result, '{allowed}', 'true');
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log usage
CREATE OR REPLACE FUNCTION log_usage(
    p_user_id UUID,
    p_call_id UUID,
    p_action_type VARCHAR(50),
    p_duration_minutes INTEGER DEFAULT 0,
    p_participant_count INTEGER DEFAULT 0,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO usage_logs (
        user_id,
        call_id,
        action_type,
        duration_minutes,
        participant_count,
        metadata,
        billing_period
    ) VALUES (
        p_user_id,
        p_call_id,
        p_action_type,
        p_duration_minutes,
        p_participant_count,
        p_metadata,
        TO_CHAR(NOW(), 'YYYY-MM')
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Delete usage logs older than 2 years
    DELETE FROM usage_logs 
    WHERE timestamp < NOW() - INTERVAL '2 years';
    
    -- Delete completed calls older than 1 year
    DELETE FROM calls 
    WHERE status = 'completed' 
    AND actual_end < NOW() - INTERVAL '1 year';
    
    -- Delete processed webhook events older than 30 days
    DELETE FROM webhook_events 
    WHERE processed = true 
    AND processed_at < NOW() - INTERVAL '30 days';
    
    -- Delete inactive users with no subscriptions older than 2 years
    DELETE FROM users 
    WHERE is_active = false 
    AND last_login < NOW() - INTERVAL '2 years'
    AND NOT EXISTS (
        SELECT 1 FROM subscriptions 
        WHERE user_id = users.id 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update subscription tier
CREATE OR REPLACE FUNCTION update_user_subscription_tier(
    p_user_id UUID,
    p_tier VARCHAR(20)
)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET subscription_tier = p_tier,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Log the tier change
    INSERT INTO usage_logs (
        user_id,
        action_type,
        metadata,
        billing_period
    ) VALUES (
        p_user_id,
        'tier_changed',
        jsonb_build_object('new_tier', p_tier),
        TO_CHAR(NOW(), 'YYYY-MM')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate analytics data
CREATE OR REPLACE FUNCTION get_analytics_summary(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    metric_name VARCHAR,
    metric_value BIGINT,
    period_start DATE,
    period_end DATE
) AS $$
DECLARE
    start_date_val DATE;
    end_date_val DATE;
BEGIN
    start_date_val := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
    end_date_val := COALESCE(p_end_date, CURRENT_DATE);
    
    RETURN QUERY
    -- Total users
    SELECT 'total_users'::VARCHAR, COUNT(*)::BIGINT, start_date_val, end_date_val
    FROM users
    WHERE created_at::DATE BETWEEN start_date_val AND end_date_val
    
    UNION ALL
    
    -- Active subscriptions
    SELECT 'active_subscriptions'::VARCHAR, COUNT(*)::BIGINT, start_date_val, end_date_val
    FROM subscriptions
    WHERE status = 'active'
    
    UNION ALL
    
    -- Total calls
    SELECT 'total_calls'::VARCHAR, COUNT(*)::BIGINT, start_date_val, end_date_val
    FROM calls
    WHERE created_at::DATE BETWEEN start_date_val AND end_date_val
    
    UNION ALL
    
    -- Total minutes
    SELECT 'total_minutes'::VARCHAR, COALESCE(SUM(duration_minutes), 0)::BIGINT, start_date_val, end_date_val
    FROM usage_logs
    WHERE timestamp::DATE BETWEEN start_date_val AND end_date_val
    AND action_type = 'call_ended';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log call events
CREATE OR REPLACE FUNCTION auto_log_call_events()
RETURNS TRIGGER AS $$
BEGIN
    -- Log call started event
    IF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
        PERFORM log_usage(
            NEW.host_user_id,
            NEW.id,
            'call_started',
            0,
            NEW.participant_count,
            jsonb_build_object('room_id', NEW.room_id)
        );
    END IF;
    
    -- Log call ended event
    IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'completed' THEN
        PERFORM log_usage(
            NEW.host_user_id,
            NEW.id,
            'call_ended',
            NEW.duration_minutes,
            NEW.participant_count,
            jsonb_build_object('room_id', NEW.room_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic call logging
CREATE TRIGGER auto_log_call_events_trigger
    AFTER UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION auto_log_call_events();

-- Create scheduled cleanup job function
CREATE OR REPLACE FUNCTION schedule_cleanup()
RETURNS VOID AS $$
BEGIN
    -- This would be called by a cron job or scheduled task
    PERFORM cleanup_old_data();
    
    -- Log cleanup execution
    INSERT INTO usage_logs (
        user_id,
        action_type,
        metadata,
        billing_period
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        'system_cleanup',
        jsonb_build_object('executed_at', NOW()),
        TO_CHAR(NOW(), 'YYYY-MM')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;