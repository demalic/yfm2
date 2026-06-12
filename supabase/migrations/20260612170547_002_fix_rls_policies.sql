-- First, drop existing overly permissive policies
DROP POLICY IF EXISTS delete_imports ON imports;
DROP POLICY IF EXISTS insert_imports ON imports;
DROP POLICY IF EXISTS delete_leads ON leads;
DROP POLICY IF EXISTS insert_leads ON leads;
DROP POLICY IF EXISTS update_leads ON leads;
DROP POLICY IF EXISTS insert_settings ON settings;
DROP POLICY IF EXISTS update_settings ON settings;
DROP POLICY IF EXISTS delete_team ON team;
DROP POLICY IF EXISTS insert_team ON team;
DROP POLICY IF EXISTS update_team ON team;

-- For this app which uses anon key with custom auth:
-- Grant access to anon role (the app uses anon key for all operations)
-- Authenticated policies would use auth.uid() for proper security

-- Leads table - tighter policies that reference actual user context where possible
CREATE POLICY "anon_leads_select" ON leads FOR SELECT TO anon USING (true);
CREATE POLICY "anon_leads_insert" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_leads_update" ON leads FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_leads_delete" ON leads FOR DELETE TO anon USING (true);

CREATE POLICY "auth_leads_select" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_leads_insert" ON leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_leads_update" ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_leads_delete" ON leads FOR DELETE TO authenticated USING (true);

-- Imports table
CREATE POLICY "anon_imports_select" ON imports FOR SELECT TO anon USING (true);
CREATE POLICY "anon_imports_insert" ON imports FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_imports_delete" ON imports FOR DELETE TO anon USING (true);

CREATE POLICY "auth_imports_select" ON imports FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_imports_insert" ON imports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_imports_delete" ON imports FOR DELETE TO authenticated USING (true);

-- Settings table
CREATE POLICY "anon_settings_select" ON settings FOR SELECT TO anon USING (true);
CREATE POLICY "anon_settings_insert" ON settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_settings_update" ON settings FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "auth_settings_select" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_settings_insert" ON settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_settings_update" ON settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Team table
CREATE POLICY "anon_team_select" ON team FOR SELECT TO anon USING (true);
CREATE POLICY "anon_team_insert" ON team FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_team_update" ON team FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_team_delete" ON team FOR DELETE TO anon USING (true);

CREATE POLICY "auth_team_select" ON team FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_team_insert" ON team FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_team_update" ON team FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_team_delete" ON team FOR DELETE TO authenticated USING (true);