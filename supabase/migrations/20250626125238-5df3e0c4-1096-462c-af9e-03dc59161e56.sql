
-- FIXED: CRITICAL DATABASE SCHEMA FOR GP51 PRODUCTION INTEGRATION
-- Execute these in order on your Supabase instance

-- 1. Enhanced GP51 Sessions Table (UPSERT capability for admin 'octopus')
CREATE TABLE IF NOT EXISTS gp51_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    session_data JSONB NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    session_fingerprint TEXT,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE gp51_sessions ENABLE ROW LEVEL SECURITY;

-- Admin and user access policies
CREATE POLICY "Users can manage own sessions" ON gp51_sessions
    FOR ALL USING (auth.jwt() ->> 'username' = username);

CREATE POLICY "Admins can manage all sessions" ON gp51_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 2. GP51 Users Registry (Synced from GP51 API)
CREATE TABLE IF NOT EXISTS gp51_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gp51_username TEXT UNIQUE NOT NULL,
    user_data JSONB NOT NULL, -- Store full GP51 user object
    usertype INTEGER NOT NULL, -- 3=admin, 4=company_admin, 11=end_user, 99=device
    showname TEXT,
    companyname TEXT,
    email TEXT,
    phone TEXT,
    wechat TEXT,
    qq TEXT,
    multilogin BOOLEAN DEFAULT TRUE,
    creater TEXT, -- Which admin created this user
    sync_status TEXT DEFAULT 'pending', -- pending, synced, error
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    gp51_created_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gp51_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own data, admins can view all
CREATE POLICY "Users can view own GP51 data" ON gp51_users
    FOR SELECT USING (gp51_username = auth.jwt() ->> 'username');

CREATE POLICY "Admins can manage all GP51 users" ON gp51_users
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 3. GP51 Devices Registry (Vehicles/Devices from GP51)
CREATE TABLE IF NOT EXISTS gp51_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id TEXT UNIQUE NOT NULL, -- GP51 deviceid
    device_name TEXT NOT NULL,
    device_type INTEGER NOT NULL,
    device_data JSONB NOT NULL, -- Full GP51 device object
    owner_username TEXT REFERENCES gp51_users(gp51_username),
    group_id INTEGER,
    group_name TEXT,
    status TEXT DEFAULT 'active', -- active, inactive, maintenance
    is_online BOOLEAN DEFAULT FALSE,
    last_active_time TIMESTAMPTZ,
    sim_number TEXT,
    timezone INTEGER DEFAULT 8, -- GMT offset
    mileage_mode INTEGER DEFAULT 0, -- 0=auto, 1=device, 2=platform
    location_type INTEGER DEFAULT 7, -- GPS+LBS+WiFi
    sync_status TEXT DEFAULT 'pending',
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gp51_devices ENABLE ROW LEVEL SECURITY;

-- Device access policies
CREATE POLICY "Users can view own devices" ON gp51_devices
    FOR SELECT USING (owner_username = auth.jwt() ->> 'username');

CREATE POLICY "Admins can manage all devices" ON gp51_devices
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 4. Live Vehicle Positions (Real-time data from GP51)
CREATE TABLE IF NOT EXISTS live_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id TEXT NOT NULL REFERENCES gp51_devices(device_id),
    position_data JSONB NOT NULL, -- Full GP51 position object
    
    -- Extracted key fields for fast queries
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION DEFAULT 0,
    course INTEGER DEFAULT 0, -- 0-360 degrees
    altitude DOUBLE PRECISION DEFAULT 0,
    accuracy_radius DOUBLE PRECISION DEFAULT 0,
    
    -- Status and timing (FIXED: renamed timestamp to position_timestamp)
    position_timestamp TIMESTAMPTZ NOT NULL, -- Device timestamp
    server_timestamp TIMESTAMPTZ DEFAULT NOW(), -- When received by server
    status_code BIGINT DEFAULT 0,
    status_description TEXT,
    alarm_code BIGINT DEFAULT 0,
    alarm_description TEXT,
    
    -- Additional data
    location_source TEXT, -- gps, lbs, wifi
    signal_strength INTEGER,
    gps_satellite_count INTEGER,
    voltage DOUBLE PRECISION,
    fuel_level DOUBLE PRECISION,
    temperature DOUBLE PRECISION,
    is_moving BOOLEAN DEFAULT FALSE,
    parking_duration BIGINT DEFAULT 0, -- milliseconds
    total_distance INTEGER DEFAULT 0, -- meters
    report_mode INTEGER, -- Upload mode from GP51
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_positions_device_timestamp 
    ON live_positions(device_id, position_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_live_positions_location 
    ON live_positions(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_live_positions_server_time 
    ON live_positions(server_timestamp DESC);

ALTER TABLE live_positions ENABLE ROW LEVEL SECURITY;

-- Position access policies
CREATE POLICY "Users can view positions of own devices" ON live_positions
    FOR SELECT USING (
        device_id IN (
            SELECT device_id FROM gp51_devices 
            WHERE owner_username = auth.jwt() ->> 'username'
        )
    );

CREATE POLICY "Admins can view all positions" ON live_positions
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 5. Position History (For track queries and reports)
CREATE TABLE IF NOT EXISTS position_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id TEXT NOT NULL,
    track_data JSONB NOT NULL, -- GP51 track data
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION DEFAULT 0,
    course INTEGER DEFAULT 0,
    altitude DOUBLE PRECISION DEFAULT 0,
    position_timestamp TIMESTAMPTZ NOT NULL, -- FIXED: renamed from timestamp
    arrived_time TIMESTAMPTZ DEFAULT NOW(),
    total_distance INTEGER DEFAULT 0,
    report_mode INTEGER,
    status_code BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FIXED: Removed problematic index with date_trunc function
CREATE INDEX IF NOT EXISTS idx_position_history_device_time 
    ON position_history(device_id, position_timestamp DESC);

-- 6. Enhanced Vehicles Table (Link to local system)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS gp51_device_id TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS gp51_sync_status TEXT DEFAULT 'pending';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_gp51_sync TIMESTAMPTZ;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS gp51_data JSONB;

-- Create foreign key relationship
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_gp51_device 
    FOREIGN KEY (gp51_device_id) REFERENCES gp51_devices(device_id);

-- 7. GP51 Sync Operations Log (For debugging and monitoring)
CREATE TABLE IF NOT EXISTS gp51_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type TEXT NOT NULL, -- 'auth', 'fetch_users', 'fetch_devices', 'position_update'
    username TEXT,
    request_data JSONB,
    response_data JSONB,
    status TEXT NOT NULL, -- 'success', 'error', 'timeout'
    error_message TEXT,
    duration_ms INTEGER,
    gp51_status_code INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gp51_sync_log_operation_time 
    ON gp51_sync_log(operation_type, created_at DESC);

-- 8. Real-time subscriptions setup
-- Enable real-time for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE live_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE gp51_devices;
ALTER PUBLICATION supabase_realtime ADD TABLE gp51_sessions;

-- 9. Performance optimization functions
-- Function to cleanup old positions (keep last 30 days in live_positions)
CREATE OR REPLACE FUNCTION cleanup_old_positions()
RETURNS void AS $$
BEGIN
    -- Move old positions to history
    INSERT INTO position_history (
        device_id, track_data, latitude, longitude, speed, course, 
        altitude, position_timestamp, total_distance, report_mode, status_code
    )
    SELECT 
        device_id, position_data, latitude, longitude, speed, course,
        altitude, position_timestamp, total_distance, report_mode, status_code
    FROM live_positions 
    WHERE position_timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete old positions
    DELETE FROM live_positions 
    WHERE position_timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get latest position for device
CREATE OR REPLACE FUNCTION get_latest_position(p_device_id TEXT)
RETURNS TABLE(
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    position_timestamp TIMESTAMPTZ,
    is_moving BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lp.latitude,
        lp.longitude,
        lp.speed,
        lp.position_timestamp,
        lp.is_moving
    FROM live_positions lp
    WHERE lp.device_id = p_device_id
    ORDER BY lp.position_timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 10. Create indexes for optimal performance (FIXED: removed CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_gp51_users_username 
    ON gp51_users(gp51_username);
CREATE INDEX IF NOT EXISTS idx_gp51_users_sync_status 
    ON gp51_users(sync_status, last_sync);
CREATE INDEX IF NOT EXISTS idx_gp51_devices_owner 
    ON gp51_devices(owner_username);
CREATE INDEX IF NOT EXISTS idx_gp51_devices_status 
    ON gp51_devices(status, is_online);
CREATE INDEX IF NOT EXISTS idx_vehicles_gp51_device 
    ON vehicles(gp51_device_id);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
