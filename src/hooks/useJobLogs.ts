import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJobLogs, TowerApiError } from '../lib/towerApi';

const POLL_INTERVAL_MS = 1500;

interface UseJobLogsResult {
  lines: string[];
  isPolling: boolean;
  error: string | null;
  reset: () => void;
}

export function useJobLogs(jobId: string | null, active: boolean): UseJobLogsResult {
  const [lines, setLines] = useState<string[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    offsetRef.current = 0;
    setLines([]);
    setError(null);
  }, [stopPolling]);

  const pollOnce = useCallback(async (id: string) => {
    try {
      const { lines: newLines, total } = await fetchJobLogs(id, offsetRef.current);
      if (newLines.length > 0) {
        offsetRef.current = total;
        setLines((prev) => [...prev, ...newLines]);
      }
      setError(null);
    } catch (err) {
      const message = err instanceof TowerApiError ? err.message : 'Failed to load tower logs';
      setError(message);
      stopPolling();
    }
  }, [stopPolling]);

  useEffect(() => {
    reset();
  }, [jobId, reset]);

  useEffect(() => {
    if (!jobId) {
      stopPolling();
      return;
    }

    if (!active) {
      void pollOnce(jobId);
      stopPolling();
      return;
    }

    setIsPolling(true);
    pollOnce(jobId);
    pollRef.current = setInterval(() => pollOnce(jobId), POLL_INTERVAL_MS);

    return () => stopPolling();
  }, [jobId, active, pollOnce, stopPolling]);

  return { lines, isPolling, error, reset };
}
