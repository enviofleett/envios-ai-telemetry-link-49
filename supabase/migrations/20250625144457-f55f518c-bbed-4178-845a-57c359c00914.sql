
-- Create GPS51 Groups table
CREATE TABLE IF NOT EXISTS gps51_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT UNIQUE NOT NULL,
  group_name TEXT NOT NULL,
  remark TEXT,
  device_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create GPS51 Devices table
CREATE TABLE IF NOT EXISTS gps51_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  device_name TEXT NOT NULL,
  group_id TEXT REFERENCES gps51_groups(group_id),
  device_type TEXT,
  sim_number TEXT,
  login_name TEXT,
  creator TEXT,
  status_code INTEGER,
  status_text TEXT,
  last_active_time TIMESTAMP WITH TIME ZONE,
  overdue_time TIMESTAMP WITH TIME ZONE,
  expire_notify_time TIMESTAMP WITH TIME ZONE,
  allow_edit BOOLEAN DEFAULT FALSE,
  starred BOOLEAN DEFAULT FALSE,
  icon INTEGER,
  remark TEXT,
  video_channel_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT FALSE,
  is_expired BOOLEAN DEFAULT FALSE,
  days_since_active INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create GPS51 Current Positions table
CREATE TABLE IF NOT EXISTS gps51_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT REFERENCES gps51_devices(device_id),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  course INTEGER,
  altitude DOUBLE PRECISION,
  accuracy_radius DOUBLE PRECISION,
  update_time TIMESTAMP WITH TIME ZONE,
  device_time TIMESTAMP WITH TIME ZONE,
  arrived_time TIMESTAMP WITH TIME ZONE,
  moving BOOLEAN DEFAULT FALSE,
  address TEXT,
  location_type TEXT,
  signal_strength INTEGER,
  battery_voltage DOUBLE PRECISION,
  battery_percent INTEGER,
  total_distance INTEGER,
  status_flags BIGINT,
  alarm_flags BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(device_id, update_time)
);

-- Create GPS51 Users table
CREATE TABLE IF NOT EXISTS gps51_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  user_type INTEGER,
  user_type_text TEXT,
  company_name TEXT,
  company_address TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  wechat TEXT,
  qq TEXT,
  multi_login BOOLEAN DEFAULT FALSE,
  creator TEXT,
  device_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE gps51_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps51_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps51_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps51_users ENABLE ROW LEVEL SECURITY;

-- Allow read access for all authenticated users
CREATE POLICY "Allow read access to groups" ON gps51_groups FOR SELECT USING (true);
CREATE POLICY "Allow read access to devices" ON gps51_devices FOR SELECT USING (true);
CREATE POLICY "Allow read access to positions" ON gps51_positions FOR SELECT USING (true);
CREATE POLICY "Allow read access to users" ON gps51_users FOR SELECT USING (true);

-- Allow insert/update for service role (for imports)
CREATE POLICY "Allow service role to manage groups" ON gps51_groups FOR ALL USING (true);
CREATE POLICY "Allow service role to manage devices" ON gps51_devices FOR ALL USING (true);
CREATE POLICY "Allow service role to manage positions" ON gps51_positions FOR ALL USING (true);
CREATE POLICY "Allow service role to manage users" ON gps51_users FOR ALL USING (true);
