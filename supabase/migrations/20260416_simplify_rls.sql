-- Simplify RLS policies to allow authenticated users to read all tables
-- This fixes the timeout issue with the complex get_my_role() function

-- Drop complex policies and replace with simpler ones
DROP POLICY IF EXISTS "Admin full access on visits" ON visits;
DROP POLICY IF EXISTS "Receptionist can view visits" ON visits;
DROP POLICY IF EXISTS "Guard can log visits" ON visits;
DROP POLICY IF EXISTS "Guard can update own visit entries" ON visits;
DROP POLICY IF EXISTS "Guard can view visits" ON visits;

-- Allow authenticated users to read visits
CREATE POLICY "Authenticated users can read visits"
  ON visits FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert visits
CREATE POLICY "Authenticated users can insert visits"
  ON visits FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update visits
CREATE POLICY "Authenticated users can update visits"
  ON visits FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Similar simplification for other tables
DROP POLICY IF EXISTS "Admin full access on visitors" ON visitors;
DROP POLICY IF EXISTS "Receptionist can manage visitors" ON visitors;
DROP POLICY IF EXISTS "Receptionist can insert visitors" ON visitors;
DROP POLICY IF EXISTS "Receptionist can update visitors" ON visitors;
DROP POLICY IF EXISTS "Guard can view visitors" ON visitors;

CREATE POLICY "Authenticated users can read visitors"
  ON visitors FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert visitors"
  ON visitors FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update visitors"
  ON visitors FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Similar for visitor_passes
DROP POLICY IF EXISTS "Admin full access on visitor_passes" ON visitor_passes;
DROP POLICY IF EXISTS "Receptionist can manage passes" ON visitor_passes;
DROP POLICY IF EXISTS "Receptionist can insert passes" ON visitor_passes;
DROP POLICY IF EXISTS "Receptionist can update passes" ON visitor_passes;
DROP POLICY IF EXISTS "Guard can view passes" ON visitor_passes;

CREATE POLICY "Authenticated users can read passes"
  ON visitor_passes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert passes"
  ON visitor_passes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update passes"
  ON visitor_passes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Similar for profiles
DROP POLICY IF EXISTS "Admin full access on profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can view own profile" ON profiles;

CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());
