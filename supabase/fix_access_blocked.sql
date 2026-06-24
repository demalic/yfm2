-- Fix "Access blocked" / 401 on login
-- Run this entire file in Supabase SQL Editor

-- 1. Allow anon role to access tables (required for YFM app)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON team TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON imports TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON settings TO anon, authenticated;
GRANT SELECT ON fcc_locations TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 2. Ensure RLS is on
ALTER TABLE team ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcc_locations ENABLE ROW LEVEL SECURITY;

-- 3. Recreate team policies (login reads this table)
DROP POLICY IF EXISTS "team_members_select" ON team;
DROP POLICY IF EXISTS "team_members_insert" ON team;
DROP POLICY IF EXISTS "team_members_update" ON team;
DROP POLICY IF EXISTS "team_members_delete" ON team;
DROP POLICY IF EXISTS "anon_team_select" ON team;
DROP POLICY IF EXISTS "auth_team_select" ON team;

CREATE POLICY "team_members_select" ON team
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "team_members_insert" ON team
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "team_members_update" ON team
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "team_members_delete" ON team
  FOR DELETE TO anon, authenticated USING (true);

-- 4. Ensure admin user exists
INSERT INTO team (name, role, password)
VALUES ('demalic', 'admin', 'yfmusa')
ON CONFLICT (name) DO UPDATE SET role = EXCLUDED.role, password = EXCLUDED.password;
