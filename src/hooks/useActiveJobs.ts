import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchActiveJobs, towerHealthSupportsActiveJobs, TowerApiError } from '../lib/towerApi';
import type { EligibilityJob, TowerHealthResponse } from '../types';

const POLL_INTERVAL_MS = 3000;

interface UseActiveJobsOptions {
  enabled: boolean;
  health: TowerHealthResponse | null;
}

interface UseActiveJobsResult {
  jobs: EligibilityJob[];
  isLoading: boolean;
  error: string | null;
  supported: boolean;
  refresh: () => Promise<void>;
}

function jobsEqual(left: EligibilityJob[], right: EligibilityJob[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((job, index) => {
    const other = right[index];
    if (!other || job.jobId !== other.jobId) return false;
    return (
      job.status === other.status &&
      job.phase === other.phase &&
      job.zipcheck.progress === other.zipcheck.progress &&
      job.zipcheck.status === other.zipcheck.status &&
      job.qualifier.progress === other.qualifier.progress &&
      job.qualifier.current === other.qualifier.current &&
      job.qualifier.status === other.qualifier.status
    );
  });
}

export function useActiveJobs({ enabled, health }: UseActiveJobsOptions): UseActiveJobsResult {
  const supported = towerHealthSupportsActiveJobs(health);
  const [jobs, setJobs] = useState<EligibilityJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled || !supported) {
      setJobs([]);
      setError(null);
      hasLoadedRef.current = false;
      return;
    }

    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }

    try {
      const next = await fetchActiveJobs();
      setJobs((prev) => (jobsEqual(prev, next) ? prev : next));
      setError(null);
    } catch (err) {
      const message = err instanceof TowerApiError ? err.message : 'Failed to load active runs';
      setError(message);
    } finally {
      hasLoadedRef.current = true;
      setIsLoading(false);
    }
  }, [enabled, supported]);

  useEffect(() => {
    if (!enabled || !supported) {
      setJobs([]);
      hasLoadedRef.current = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    void refresh();
    pollRef.current = setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [enabled, supported, refresh]);

  return { jobs, isLoading, error, supported, refresh };
}
