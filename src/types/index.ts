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

// ── Tower / Eligibility pipeline ─────────────────────────────────────────────

export type EligibilityScope = 'zip' | 'state';

export type PhaseStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed';

export type EligibilityCountKey =
  | 'eligible'
  | 'notEligible'
  | 'existingCopper'
  | 'existingFiber'
  | 'futureFiber'
  | 'skipped';

export interface EligibilityStatusBucket {
  key: EligibilityCountKey;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

export interface EligibilityCounts {
  eligible: number;
  notEligible: number;
  existingCopper: number;
  existingFiber: number;
  futureFiber: number;
  skipped: number;
}

export interface ZipCheckPhase {
  status: PhaseStatus;
  progress: number;
  message: string;
  addressCount: number | null;
  outputCsv: string | null;
}

export interface QualifierPhase {
  status: PhaseStatus;
  progress: number;
  current: number;
  total: number;
  message: string;
  counts: EligibilityCounts;
}

export interface EligibilityJob {
  jobId: string;
  isp: string;
  scope: EligibilityScope;
  zip: string | null;
  state: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  phase: 'zipcheck' | 'qualifier' | 'done';
  zipcheck: ZipCheckPhase;
  qualifier: QualifierPhase;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
  downloads?: Partial<Record<EligibilityCountKey | 'all', string>>;
  /** Full path on tower — zip checker output / qualifier input */
  inputCsvPath?: string | null;
  /** Folder on tower where qualifier writes bucket CSVs */
  qualifierOutputDir?: string | null;
}

export interface StartEligibilityJobRequest {
  isp: string;
  scope: EligibilityScope;
  zip?: string;
  state?: string;
}

export interface TowerISPInfo {
  id: string;
  name: string;
  enabled: boolean;
  comingSoon?: boolean;
}

export interface TowerHealthResponse {
  ok: boolean;
  botDir: string;
  python: string;
  scripts: {
    zipChecker: boolean;
    qualifier: boolean;
  };
}

export interface JobLogsResponse {
  lines: string[];
  total: number;
  offset: number;
}

export type PendingQualifierState = 'not_started' | 'partial' | 'failed';

export interface PendingQualifierJob {
  jobId: string;
  zip: string;
  addressCount: number | null;
  csvFileName: string;
  qualifierState: PendingQualifierState;
  qualifierProgress: number;
  qualifierCurrent: number;
  createdAt: string;
}
