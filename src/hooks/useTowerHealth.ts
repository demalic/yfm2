import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTowerHealth, isTowerConfigured } from '../lib/towerApi';
import type { TowerHealthResponse } from '../types';

const POLL_INTERVAL_MS = 15_000;

export type TowerConnectionStatus = 'unconfigured' | 'checking' | 'online' | 'offline';

function pendingJobsEqual(
  left: TowerHealthResponse['pendingJobs'],
  right: TowerHealthResponse['pendingJobs']
): boolean {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  return left.every((job, index) => job.jobId === right[index]?.jobId);
}

interface UseTowerHealthResult {
  status: TowerConnectionStatus;
  health: TowerHealthResponse | null;
  error: string | null;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
}

export function useTowerHealth(): UseTowerHealthResult {
  const configured = isTowerConfigured();
  const [status, setStatus] = useState<TowerConnectionStatus>(configured ? 'checking' : 'unconfigured');
  const [health, setHealth] = useState<TowerHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (!isTowerConfigured()) {
      setStatus('unconfigured');
      setHealth(null);
      setError(null);
      return;
    }

    if (!silent) {
      setStatus((prev) => (prev === 'online' || prev === 'offline' ? prev : 'checking'));
    }

    try {
      const result = await fetchTowerHealth();
      const nextStatus: TowerConnectionStatus = result.ok ? 'online' : 'offline';

      setStatus((prev) => (prev === nextStatus ? prev : nextStatus));
      setError(null);
      setHealth((prev) => {
        if (
          prev?.ok === result.ok &&
          prev?.apiVersion === result.apiVersion &&
          prev?.features?.pendingQualifier === result.features?.pendingQualifier &&
          prev?.botDir === result.botDir &&
          prev?.jobsDir === result.jobsDir &&
          prev?.jobFolderCount === result.jobFolderCount &&
          prev?.pendingQualifierCount === result.pendingQualifierCount &&
          pendingJobsEqual(prev?.pendingJobs, result.pendingJobs) &&
          prev?.python === result.python &&
          prev?.scripts.zipChecker === result.scripts.zipChecker &&
          prev?.scripts.qualifier === result.scripts.qualifier
        ) {
          return prev;
        }
        return result;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reach tower';
      setStatus((prev) => (prev === 'offline' ? prev : 'offline'));
      setError(message);
      if (!silent) {
        setHealth(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!configured) {
      setStatus('unconfigured');
      setHealth(null);
      setError(null);
      return;
    }

    void refresh();
    pollRef.current = setInterval(() => {
      void refresh({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [configured, refresh]);

  return { status, health, error, refresh };
}
