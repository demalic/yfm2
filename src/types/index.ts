export type Role = 'admin' | 'manager' | 'rep';

export interface Member {
  id: string;
  name: string;
  role: Role;
  password?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  rep: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  status: string;
  notes: string | null;
  import_id: string | null;
  created_at: string;
}

export interface ImportBatch {
  id: string;
  name: string;
  rep: string;
  created_at: string;
}

export interface ManualSale {
  id: string;
  rep: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface LeadStatus {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Settings {
  statuses: LeadStatus[];
  commissionRate: number;
  darkMode: boolean;
}

export interface FCCLocation {
  id: string;
  location_id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  isp_name: string;
  technology: string;
  max_download_mbps: number;
  max_upload_mbps: number;
  loaded_at: string;
}

export interface SessionData {
  memberId: string;
  memberName: string;
  role: Role;
  timestamp: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
