-- Drop existing visits table if it conflicts (Assuming no production data needs migrating)
DROP TABLE IF EXISTS public.visits CASCADE;

-- profiles (extends auth.users)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  full_name text not null,
  role text not null check (role in ('admin', 'guard', 'receptionist')),
  created_at timestamptz default now()
);

-- visitors
create table visitors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  id_type text,
  id_number text,
  company text,
  host_name text,
  host_department text,
  created_at timestamptz default now()
);

-- visitor_passes
create table visitor_passes (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references visitors(id) on delete cascade,
  created_by uuid references profiles(id),
  qr_code text unique not null default gen_random_uuid()::text,
  status text not null default 'active' check (status in ('active', 'used', 'expired', 'revoked')),
  valid_from timestamptz default now(),
  valid_until timestamptz,
  created_at timestamptz default now()
);

-- visits
create table visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references visitors(id) on delete cascade,
  pass_id uuid references visitor_passes(id) on delete cascade,
  logged_by uuid references profiles(id),
  purpose text,
  checked_in_at timestamptz default now(),
  checked_out_at timestamptz,
  notes text
);

-- Row Level Security (RLS) configuration
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- For demo purposes (and since detailed org auth isn't fully set up yet in prompt context),
-- we leave these open for the authenticated application, or fully public while prototyping:

CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON profiles FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON visitors FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON visitors FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON visitor_passes FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON visitor_passes FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON visits FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON visits FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE visitor_passes;
ALTER PUBLICATION supabase_realtime ADD TABLE visits;
