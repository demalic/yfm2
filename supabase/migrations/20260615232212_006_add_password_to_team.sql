ALTER TABLE team ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'changeme';

-- Update admin password
UPDATE team SET password = 'yfmusa' WHERE role = 'admin';