-- YFM one-shot Supabase setup
-- Paste this entire file into Supabase → SQL Editor → Run once.

-- ── 1. Tables ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'rep')),
  password TEXT NOT NULL DEFAULT 'changeme',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rep TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep TEXT NOT NULL,
  street TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  import_id UUID REFERENCES imports(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patch existing Bolt tables (CREATE IF NOT EXISTS skips missing columns)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS import_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS street TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS zip TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE team ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'changeme';
ALTER TABLE team ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE team ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  ALTER TABLE leads
    ADD CONSTRAINT leads_import_id_fkey
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_rep ON leads(rep);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_import_id ON leads(import_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fcc_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  isp_name TEXT,
  technology TEXT,
  max_download_mbps INTEGER,
  max_upload_mbps INTEGER,
  loaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fcc_locations_zip ON fcc_locations(zip);
CREATE INDEX IF NOT EXISTS idx_fcc_locations_state ON fcc_locations(state);
CREATE INDEX IF NOT EXISTS idx_fcc_locations_city ON fcc_locations(city);

INSERT INTO team (name, role, password)
VALUES ('demalic', 'admin', 'yfmusa')
ON CONFLICT (name) DO UPDATE SET role = EXCLUDED.role, password = EXCLUDED.password;

ALTER TABLE team ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcc_locations ENABLE ROW LEVEL SECURITY;

-- ── 2. Access policies (YFM custom login) ────────────────────────────────────

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS is_admin(uuid);

CREATE POLICY "team_leads_select" ON leads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "team_leads_insert" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "team_leads_update" ON leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "team_leads_delete" ON leads FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "team_imports_select" ON imports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "team_imports_insert" ON imports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "team_imports_delete" ON imports FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "team_settings_select" ON settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "team_settings_insert" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "team_settings_update" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "team_members_select" ON team FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "team_members_insert" ON team FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "team_members_update" ON team FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "team_members_delete" ON team FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "team_fcc_select" ON fcc_locations FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE leads DROP COLUMN IF EXISTS user_id;
ALTER TABLE imports DROP COLUMN IF EXISTS user_id;
ALTER TABLE settings DROP COLUMN IF EXISTS user_id;
ALTER TABLE team DROP COLUMN IF EXISTS user_id;

DROP INDEX IF EXISTS idx_leads_user_id;
DROP INDEX IF EXISTS idx_imports_user_id;
DROP INDEX IF EXISTS idx_team_user_id;

UPDATE team SET password = 'yfmusa' WHERE role = 'admin';
