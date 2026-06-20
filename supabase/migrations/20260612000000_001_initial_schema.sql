/*
  Initial YFM schema — run this FIRST in Supabase SQL Editor
  if tables do not exist yet (e.g. fresh project after leaving Bolt).

  Then run the other migrations in supabase/migrations/ in order.
*/

-- Team members (custom auth — not Supabase Auth)
CREATE TABLE IF NOT EXISTS team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'rep')),
  password TEXT NOT NULL DEFAULT 'changeme',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Import batches
CREATE TABLE IF NOT EXISTS imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rep TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads
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

CREATE INDEX IF NOT EXISTS idx_leads_rep ON leads(rep);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_import_id ON leads(import_id);

-- App settings (key/value JSON)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FCC fiber locations (optional — for Find tab)
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

-- Default admin (change password after first login)
INSERT INTO team (name, role, password)
VALUES ('demalic', 'admin', 'yfmusa')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS (policies applied in later migrations)
ALTER TABLE team ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcc_locations ENABLE ROW LEVEL SECURITY;
