-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin full access on profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin full access on visitors" ON visitors;
DROP POLICY IF EXISTS "Receptionist can manage visitors" ON visitors;
DROP POLICY IF EXISTS "Receptionist can insert visitors" ON visitors;
DROP POLICY IF EXISTS "Receptionist can update visitors" ON visitors;
DROP POLICY IF EXISTS "Guard can view visitors" ON visitors;
DROP POLICY IF EXISTS "Admin full access on visitor_passes" ON visitor_passes;
DROP POLICY IF EXISTS "Receptionist can manage passes" ON visitor_passes;
DROP POLICY IF EXISTS "Receptionist can insert passes" ON visitor_passes;
DROP POLICY IF EXISTS "Receptionist can update passes" ON visitor_passes;
DROP POLICY IF EXISTS "Guard can view passes" ON visitor_passes;
DROP POLICY IF EXISTS "Admin full access on visits" ON visits;
DROP POLICY IF EXISTS "Receptionist can view visits" ON visits;
DROP POLICY IF EXISTS "Guard can log visits" ON visits;
DROP POLICY IF EXISTS "Guard can update own visit entries" ON visits;
DROP POLICY IF EXISTS "Guard can view visits" ON visits;

-- Create policies for authenticated users with admin role
-- Profiles table: All authenticated users can read; admins can insert/update
CREATE POLICY "Authenticated read profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin insert profiles" ON profiles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin update profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Visitors table: All authenticated users can read; admins can manage
CREATE POLICY "Authenticated read visitors" ON visitors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage visitors" ON visitors FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin update visitors" ON visitors FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Visitor passes table: All authenticated users can read; admins can manage
CREATE POLICY "Authenticated read passes" ON visitor_passes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage passes" ON visitor_passes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin update passes" ON visitor_passes FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Visits table: All authenticated users can read; admins can manage
CREATE POLICY "Authenticated read visits" ON visits FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage visits" ON visits FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin update visits" ON visits FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
