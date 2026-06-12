import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { LeadStatus } from '../types';

const DEFAULT_STATUSES: LeadStatus[] = [
  { id: 'new', name: 'New', color: '#ef4444', icon: '☠️' },
  { id: 'not_home', name: 'Not Home', color: '#3b82f6', icon: '🏠' },
  { id: 'sold', name: 'Sold', color: '#22c55e', icon: '💰' },
  { id: 'ndm', name: 'NDM', color: '#6b7280', icon: '❓' },
  { id: 'call_back', name: 'Call Back', color: '#06b6d4', icon: '📞' },
  { id: 'pending', name: 'Pending', color: '#f59e0b', icon: '⏳' },
  { id: 'untouched', name: 'Untouched', color: '#14b8a6', icon: '✅' },
  { id: 'existing_customer', name: 'Existing Customer', color: '#a855f7', icon: '❗' },
];

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CacheData {
  statuses: LeadStatus[];
  timestamp: number;
}

interface SettingsContextType {
  statuses: LeadStatus[];
  commissionRate: number;
  isLoading: boolean;
  saveStatuses: (newStatuses: LeadStatus[]) => Promise<void>;
  saveCommissionRate: (rate: number) => void;
  getStatusById: (id: string) => LeadStatus;
  addStatus: (status: Omit<LeadStatus, 'id'>) => void;
  updateStatus: (id: string, updates: Partial<LeadStatus>) => void;
  deleteStatus: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<LeadStatus[]>(DEFAULT_STATUSES);
  const [commissionRate, setCommissionRate] = useState(200);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        // Try Supabase first
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'statuses')
          .single();

        if (!error && data?.value) {
          setStatuses(data.value as LeadStatus[]);
          // Cache to localStorage
          const cache: CacheData = {
            statuses: data.value as LeadStatus[],
            timestamp: Date.now(),
          };
          localStorage.setItem('yfm_statuses_cache', JSON.stringify(cache));
        } else {
          // Try localStorage fallback
          const cached = localStorage.getItem('yfm_statuses_cache');
          if (cached) {
            try {
              const cacheData: CacheData = JSON.parse(cached);
              if (Date.now() - cacheData.timestamp < CACHE_TTL) {
                setStatuses(cacheData.statuses);
              }
            } catch {
              // Use defaults
            }
          }
        }
      } catch {
        // Try localStorage fallback
        const cached = localStorage.getItem('yfm_statuses_cache');
        if (cached) {
          try {
            const cacheData: CacheData = JSON.parse(cached);
            if (Date.now() - cacheData.timestamp < CACHE_TTL) {
              setStatuses(cacheData.statuses);
            }
          } catch {
            // Use defaults
          }
        }
      }

      // Load commission rate from localStorage
      const savedRate = localStorage.getItem('yfm_commission_rate');
      if (savedRate) {
        setCommissionRate(parseFloat(savedRate));
      }

      setIsLoading(false);
    }

    loadSettings();
  }, []);

  const saveStatuses = useCallback(async (newStatuses: LeadStatus[]) => {
    setStatuses(newStatuses);
    try {
      await supabase
        .from('settings')
        .upsert({
          key: 'statuses',
          value: newStatuses as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        });
    } catch {
      // Fallback to localStorage
      localStorage.setItem(
        'yfm_statuses_cache',
        JSON.stringify({ statuses: newStatuses, timestamp: Date.now() })
      );
    }
  }, []);

  const saveCommissionRate = useCallback((rate: number) => {
    setCommissionRate(rate);
    localStorage.setItem('yfm_commission_rate', rate.toString());
  }, []);

  const getStatusById = useCallback(
    (id: string) => {
      return statuses.find((s) => s.id === id) || statuses[0];
    },
    [statuses]
  );

  const addStatus = useCallback(
    (status: Omit<LeadStatus, 'id'>) => {
      const newStatus: LeadStatus = {
        ...status,
        id: crypto.randomUUID(),
      };
      saveStatuses([...statuses, newStatus]);
    },
    [statuses, saveStatuses]
  );

  const updateStatus = useCallback(
    (id: string, updates: Partial<LeadStatus>) => {
      const newStatuses = statuses.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      saveStatuses(newStatuses);
    },
    [statuses, saveStatuses]
  );

  const deleteStatus = useCallback(
    (id: string) => {
      if (statuses.length <= 1) return;
      const newStatuses = statuses.filter((s) => s.id !== id);
      saveStatuses(newStatuses);
    },
    [statuses, saveStatuses]
  );

  const value: SettingsContextType = {
    statuses,
    commissionRate,
    isLoading,
    saveStatuses,
    saveCommissionRate,
    getStatusById,
    addStatus,
    updateStatus,
    deleteStatus,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
