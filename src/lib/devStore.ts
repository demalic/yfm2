import type { Member, Lead, ImportBatch, FCCLocation, LeadStatus } from '../types';

const STORAGE_KEY = 'yfm_dev_db';

const DEFAULT_STATUSES: LeadStatus[] = [
  { id: 'new', name: 'New', color: '#ef4444', icon: 'skull' },
  { id: 'not_home', name: 'Not Home', color: '#3b82f6', icon: 'house' },
  { id: 'sold', name: 'Sold', color: '#22c55e', icon: 'money-bag' },
  { id: 'ndm', name: 'NDM', color: '#6b7280', icon: 'dots' },
  { id: 'call_back', name: 'Call Back', color: '#eab308', icon: 'phone' },
  { id: 'pending', name: 'Pending', color: '#4b5563', icon: 'hourglass' },
  { id: 'untouched', name: 'Untouched', color: '#ec4899', icon: 'check' },
  { id: 'existing_customer', name: 'Existing Customer', color: '#f97316', icon: 'exclamation' },
];

export interface DevSettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface DevDatabase {
  team: Member[];
  leads: Lead[];
  imports: ImportBatch[];
  settings: DevSettingRow[];
  fcc_locations: FCCLocation[];
}

const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
const REP_ID = '00000000-0000-4000-8000-000000000002';

function now() {
  return new Date().toISOString();
}

function seedDatabase(): DevDatabase {
  const created = now();
  return {
    team: [
      {
        id: ADMIN_ID,
        name: 'demalic',
        role: 'admin',
        password: 'yfmusa',
        created_at: created,
      },
      {
        id: REP_ID,
        name: 'Test Rep',
        role: 'rep',
        password: 'changeme',
        created_at: created,
      },
    ],
    leads: [
      {
        id: crypto.randomUUID(),
        rep: 'demalic',
        street: '123 Main St',
        city: 'Salt Lake City',
        state: 'UT',
        zip: '84101',
        lat: 40.7608,
        lng: -111.891,
        status: 'new',
        notes: null,
        import_id: null,
        created_at: created,
      },
      {
        id: crypto.randomUUID(),
        rep: 'demalic',
        street: '456 State St',
        city: 'Salt Lake City',
        state: 'UT',
        zip: '84111',
        lat: 40.7589,
        lng: -111.8883,
        status: 'not_home',
        notes: 'Come back after 5pm',
        import_id: null,
        created_at: created,
      },
      {
        id: crypto.randomUUID(),
        rep: 'Test Rep',
        street: '789 South Temple',
        city: 'Salt Lake City',
        state: 'UT',
        zip: '84101',
        lat: 40.7686,
        lng: -111.892,
        status: 'sold',
        notes: null,
        import_id: null,
        created_at: created,
      },
      {
        id: crypto.randomUUID(),
        rep: 'Test Rep',
        street: '100 Broadway',
        city: 'Salt Lake City',
        state: 'UT',
        zip: '84101',
        lat: 40.7625,
        lng: -111.885,
        status: 'call_back',
        notes: null,
        import_id: null,
        created_at: created,
      },
    ],
    imports: [],
    settings: [
      {
        key: 'statuses',
        value: DEFAULT_STATUSES,
        updated_at: created,
      },
    ],
    fcc_locations: [
      {
        id: crypto.randomUUID(),
        location_id: 'fcc-1',
        street: '200 Fiber Way',
        city: 'Salt Lake City',
        state: 'UT',
        zip: '84101',
        lat: 40.761,
        lng: -111.89,
        isp_name: 'Sample Fiber ISP',
        technology: 'Fiber',
        max_download_mbps: 1000,
        max_upload_mbps: 1000,
        loaded_at: created,
      },
    ],
  };
}

export function loadDevDatabase(): DevDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as DevDatabase;
    }
  } catch {
    // re-seed below
  }
  const db = seedDatabase();
  saveDevDatabase(db);
  return db;
}

export function saveDevDatabase(db: DevDatabase) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDevDatabase() {
  localStorage.removeItem(STORAGE_KEY);
  return loadDevDatabase();
}

export function stripPassword(member: Member): Member {
  const { password: _, ...rest } = member;
  return rest;
}
