import { useCallback, useEffect, useState } from 'react';
import type { PendingQualifierJob } from '../types';
import { fetchPendingQualifierJobs, TowerApiError } from '../lib/towerApi';

const REFRESH_INTERVAL_MS = 30_000;

interface UsePendingQualifierJobsResult {
  jobs: PendingQualifierJob[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePendingQualifierJobs(enabled: boolean): UsePendingQualifierJobsResult {
  const [jobs, setJobs] = useState<PendingQualifierJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    try {
      const pending = await fetchPendingQualifierJobs();
      setJobs(pending);
      setError(null);
    } catch (err) {
      const message = err instanceof TowerApiError ? err.message : 'Failed to load pending ZIPs';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [enabled, refresh]);

  return { jobs, isLoading, error, refresh };
}
