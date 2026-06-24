import { useCallback, useEffect, useRef, useState } from 'react';
import type { EligibilityJob, StartEligibilityJobRequest } from '../types';
import {
  cancelEligibilityJob,
  createEmptyJob,
  fetchEligibilityJob,
  retryQualifierJob,
  startEligibilityJob,
  TowerApiError,
} from '../lib/towerApi';

const POLL_INTERVAL_MS = 2000;

interface UseEligibilityJobResult {
  job: EligibilityJob | null;
  isStarting: boolean;
  isPolling: boolean;
  error: string | null;
  startJob: (request: StartEligibilityJobRequest) => Promise<void>;
  retryQualifier: () => Promise<void>;
  cancelJob: () => Promise<void>;
  reset: () => void;
}

export function useEligibilityJob(): UseEligibilityJobResult {
  const [job, setJob] = useState<EligibilityJob | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const pollOnce = useCallback(async (jobId: string) => {
    try {
      const updated = await fetchEligibilityJob(jobId);
      setJob(updated);
      setError(null);

      if (updated.status === 'completed' || updated.status === 'failed' || updated.status === 'cancelled') {
        stopPolling();
      }
    } catch (err) {
      const message = err instanceof TowerApiError ? err.message : 'Failed to reach tower';
      setError(message);
      stopPolling();
    }
  }, [stopPolling]);

  const startPolling = useCallback((jobId: string) => {
    stopPolling();
    setIsPolling(true);
    pollOnce(jobId);
    pollRef.current = setInterval(() => pollOnce(jobId), POLL_INTERVAL_MS);
  }, [pollOnce, stopPolling]);

  const startJob = useCallback(async (request: StartEligibilityJobRequest) => {
    setIsStarting(true);
    setError(null);
    stopPolling();

    try {
      const { jobId } = await startEligibilityJob(request);
      const placeholder = createEmptyJob(
        jobId,
        request.isp,
        request.scope,
        request.zip ?? null,
        request.state ?? null
      );
      setJob(placeholder);
      startPolling(jobId);
    } catch (err) {
      const message = err instanceof TowerApiError ? err.message : 'Failed to start job';
      setError(message);
      setJob(null);
    } finally {
      setIsStarting(false);
    }
  }, [startPolling, stopPolling]);

  const retryQualifier = useCallback(async () => {
    if (!job?.jobId) return;
    setIsStarting(true);
    setError(null);

    try {
      const updated = await retryQualifierJob(job.jobId);
      setJob(updated);
      startPolling(job.jobId);
    } catch (err) {
      const message = err instanceof TowerApiError ? err.message : 'Failed to retry qualifier';
      setError(message);
    } finally {
      setIsStarting(false);
    }
  }, [job?.jobId, startPolling]);

  const cancelJob = useCallback(async () => {
    if (!job?.jobId) return;
    try {
      await cancelEligibilityJob(job.jobId);
      stopPolling();
      setJob((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    } catch (err) {
      const message = err instanceof TowerApiError ? err.message : 'Failed to cancel job';
      setError(message);
    }
  }, [job?.jobId, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setJob(null);
    setError(null);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { job, isStarting, isPolling, error, startJob, retryQualifier, cancelJob, reset };
}
