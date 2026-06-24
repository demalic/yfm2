import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTowerHealth, isTowerConfigured } from '../lib/towerApi';
import type { TowerHealthResponse } from '../types';

const POLL_INTERVAL_MS = 15_000;

export type TowerConnectionStatus = 'unconfigured' | 'checking' | 'online' | 'offline';

interface UseTowerHealthResult {
  status: TowerConnectionStatus;
  health: TowerHealthResponse | null;
  lastCheckedAt: Date | null;
  refresh: () => Promise<void>;
}

export function useTowerHealth(): UseTowerHealthResult {
  const configured = isTowerConfigured();
  const [status, setStatus] = useState<TowerConnectionStatus>(configured ? 'checking' : 'unconfigured');
  const [health, setHealth] = useState<TowerHealthResponse | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!isTowerConfigured()) {
      setStatus('unconfigured');
      setHealth(null);
      setLastCheckedAt(null);
      return;
    }

    setStatus((prev) => (prev === 'online' ? 'online' : 'checking'));

    try {
      const result = await fetchTowerHealth();
      setHealth(result);
      setLastCheckedAt(new Date());
      setStatus(result.ok ? 'online' : 'offline');
    } catch {
      setHealth(null);
      setLastCheckedAt(new Date());
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    if (!configured) {
      setStatus('unconfigured');
      setHealth(null);
      setLastCheckedAt(null);
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
  }, [configured, refresh]);

  return { status, health, lastCheckedAt, refresh };
}
