import type { EligibilityJob, JobLogsResponse, PendingQualifierJob, StartEligibilityJobRequest, TowerHealthResponse, TowerISPInfo } from '../types';

const TOWER_API_URL = import.meta.env.VITE_TOWER_API_URL?.replace(/\/$/, '') ?? '';
const TOWER_API_KEY = import.meta.env.VITE_TOWER_API_KEY?.trim() ?? '';

export const TOWER_OUTDATED_MESSAGE =
  'Tower API is outdated — sync tower-server to Drive and restart python main.py.';

export function towerHealthSupportsLoggedZipchecks(
  health: TowerHealthResponse | null | undefined
): boolean {
  if (!health?.ok) return false;
  return (
    health.features?.pendingQualifier === true ||
    health.apiVersion === '1.1.0' ||
    Array.isArray(health.pendingJobs)
  );
}

export function isTowerConfigured(): boolean {
  return Boolean(TOWER_API_URL);
}

export function getTowerApiUrl(): string {
  return TOWER_API_URL;
}

export async function fetchTowerHealth(): Promise<TowerHealthResponse> {
  return towerFetch('/health');
}

class TowerApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'TowerApiError';
  }
}

async function towerFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!TOWER_API_URL) {
    throw new TowerApiError('Tower API URL is not configured. Set VITE_TOWER_API_URL in your .env file.');
  }

  const response = await fetch(`${TOWER_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(TOWER_API_KEY ? { 'X-Tower-Key': TOWER_API_KEY } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Tower request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
      else if (body?.detail) message = typeof body.detail === 'string' ? body.detail : message;
    } catch {
      // ignore parse errors
    }
    throw new TowerApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

/**
 * Tower API contract (implemented on the tower PC):
 *
 * POST /api/jobs
 *   Body: { isp, scope: "zip"|"state", zip?, state? }
 *   → { jobId }
 *
 * GET /api/jobs/:jobId
 *   → EligibilityJob (live zipcheck + qualifier progress)
 *
 * GET /api/jobs/:jobId/logs?offset=0
 *   → { lines, total, offset } (incremental stdout from zip checker + qualifier)
 *
 * GET /api/isps
 *   → { isps: TowerISPInfo[] }
 *
 * DELETE /api/jobs/:jobId  (optional cancel)
 *
 * POST /api/jobs/:jobId/retry-qualifier
 *   → EligibilityJob (re-run qualifier only, reuse zip checker CSV)
 *
 * GET /api/jobs/pending-qualifier
 *   → { jobs: PendingQualifierJob[] } (zipcheck done, qualifier not finished)
 */
export async function startEligibilityJob(
  request: StartEligibilityJobRequest
): Promise<{ jobId: string }> {
  return towerFetch('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function fetchEligibilityJob(jobId: string): Promise<EligibilityJob> {
  return towerFetch(`/api/jobs/${jobId}`);
}

export async function fetchJobLogs(jobId: string, offset = 0): Promise<JobLogsResponse> {
  return towerFetch(`/api/jobs/${jobId}/logs?offset=${offset}`);
}

export async function cancelEligibilityJob(jobId: string): Promise<void> {
  await towerFetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
}

export async function retryQualifierJob(jobId: string): Promise<EligibilityJob> {
  return towerFetch(`/api/jobs/${jobId}/retry-qualifier`, { method: 'POST' });
}

export async function fetchPendingQualifierJobs(): Promise<PendingQualifierJob[]> {
  const health = await fetchTowerHealth();
  if (Array.isArray(health.pendingJobs)) {
    return health.pendingJobs;
  }

  try {
    const data = await towerFetch<{ jobs: PendingQualifierJob[] }>('/api/jobs/pending-qualifier');
    return data.jobs ?? [];
  } catch (err) {
    if (err instanceof TowerApiError && err.status === 404) {
      throw new TowerApiError(TOWER_OUTDATED_MESSAGE, err.status);
    }
    throw err;
  }
}

export async function fetchTowerISPs(): Promise<TowerISPInfo[]> {
  const data = await towerFetch<{ isps: TowerISPInfo[] }>('/api/isps');
  return data.isps;
}

export function getDownloadUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${TOWER_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Empty job shape for UI before first poll */
export function createEmptyJob(jobId: string, isp: string, scope: 'zip' | 'state', zip: string | null, state: string | null): EligibilityJob {
  return {
    jobId,
    isp,
    scope,
    zip,
    state,
    status: 'queued',
    phase: 'zipcheck',
    createdAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    inputCsvPath: null,
    qualifierOutputDir: null,
    zipcheck: {
      status: 'queued',
      progress: 0,
      message: 'Waiting to start zip checker…',
      addressCount: null,
      outputCsv: null,
    },
    qualifier: {
      status: 'idle',
      progress: 0,
      current: 0,
      total: 0,
      message: 'Waiting for zip checker…',
      counts: {
        eligible: 0,
        notEligible: 0,
        existingCopper: 0,
        existingFiber: 0,
        futureFiber: 0,
        skipped: 0,
      },
    },
  };
}

export { TowerApiError };
