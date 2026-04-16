-- 1. Clean up the placeholder wildcard policies from the previous migration
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable all access for all users" ON profiles;

DROP POLICY IF EXISTS "Enable read access for all users" ON visitors;
DROP POLICY IF EXISTS "Enable all access for all users" ON visitors;

DROP POLICY IF EXISTS "Enable read access for all users" ON visitor_passes;
DROP POLICY IF EXISTS "Enable all access for all users" ON visitor_passes;

DROP POLICY IF EXISTS "Enable read access for all users" ON visits;
DROP POLICY IF EXISTS "Enable all access for all users" ON visits;

-------------------------------------------------------------------------------
-- 2. Helper function (used in every policy)
-------------------------------------------------------------------------------
create or replace function get_my_role()
returns text as $$
  select role from profiles where user_id = auth.uid();
$$ language sql security definer stable;

-------------------------------------------------------------------------------
-- 3. Policies per table
-------------------------------------------------------------------------------

-- profiles table
-- Admin: full access
create policy "Admin full access on profiles"
  on profiles for all
  using (get_my_role() = 'admin');

-- Receptionist & Guard: can only see their own profile
create policy "Staff can view own profile"
  on profiles for select
  using (user_id = auth.uid());

-- visitors table
-- Admin: full access
create policy "Admin full access on visitors"
  on visitors for all
  using (get_my_role() = 'admin');

-- Receptionist: can create, view, and update visitors
create policy "Receptionist can manage visitors"
  on visitors for select
  using (get_my_role() = 'receptionist');

create policy "Receptionist can insert visitors"
  on visitors for insert
  with check (get_my_role() = 'receptionist');

create policy "Receptionist can update visitors"
  on visitors for update
  using (get_my_role() = 'receptionist');

-- Guard: read-only (to verify identity at entry)
create policy "Guard can view visitors"
  on visitors for select
  using (get_my_role() = 'guard');

-- visitor_passes table
-- Admin: full access
create policy "Admin full access on visitor_passes"
  on visitor_passes for all
  using (get_my_role() = 'admin');

-- Receptionist: can create, view, and update passes
create policy "Receptionist can manage passes"
  on visitor_passes for select
  using (get_my_role() = 'receptionist');

create policy "Receptionist can insert passes"
  on visitor_passes for insert
  with check (get_my_role() = 'receptionist');

create policy "Receptionist can update passes"
  on visitor_passes for update
  using (get_my_role() = 'receptionist');

-- Guard: read-only (to scan and validate QR codes)
create policy "Guard can view passes"
  on visitor_passes for select
  using (get_my_role() = 'guard');

-- visits table
-- Admin: full access
create policy "Admin full access on visits"
  on visits for all
  using (get_my_role() = 'admin');

-- Receptionist: read-only (can view visit logs on dashboard)
create policy "Receptionist can view visits"
  on visits for select
  using (get_my_role() = 'receptionist');

-- Guard: can log check-in/check-out (insert + update own entries only)
create policy "Guard can log visits"
  on visits for insert
  with check (get_my_role() = 'guard');

create policy "Guard can update own visit entries"
  on visits for update
  using (
    get_my_role() = 'guard'
    and logged_by = (select id from profiles where user_id = auth.uid())
  );

create policy "Guard can view visits"
  on visits for select
  using (get_my_role() = 'guard');

-------------------------------------------------------------------------------
-- 4. Auto-create profiles for new Auth users
-------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 'receptionist');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it previously existed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
