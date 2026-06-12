import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import type { Lead, ImportBatch } from '../types';

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface LeadsCache {
  leads: Lead[];
  timestamp: number;
  memberId: string;
}

interface LeadsContextType {
  leads: Lead[];
  leadsWithLatLng: Lead[];
  importBatches: ImportBatch[];
  isLoading: boolean;
  loadLeads: () => Promise<void>;
  loadImportBatches: () => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at'>) => Promise<Lead | undefined>;
  bulkAssign: (leadIds: string[], rep: string) => Promise<void>;
  getLeadsByRep: (rep: string) => Lead[];
  getLeadsByStatus: (status: string) => Lead[];
}

const LeadsContext = createContext<LeadsContextType | null>(null);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const { member } = useAuth();
  const memberName = member?.name || null;
  const memberRole = member?.role || null;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);

  const loadLeads = useCallback(async () => {
    if (!memberName) {
      setIsLoading(false);
      return;
    }

    // Try loading from cache first
    const cached = localStorage.getItem('yfm_leads_cache');
    let cachedData: LeadsCache | null = null;
    if (cached) {
      try {
        cachedData = JSON.parse(cached);
        if (
          cachedData.memberId === memberName &&
          Date.now() - cachedData.timestamp < CACHE_TTL
        ) {
          setLeads(cachedData.leads);
          setIsLoading(false);
        }
      } catch {
        cachedData = null;
      }
    }

    try {
      let query = supabase.from('leads').select('*');

      // Admin sees all leads, others only their own
      if (memberRole !== 'admin') {
        // For managers and reps, combine their leads + unassigned leads
        query = query.or(`rep.eq.${memberName},rep.is.null`);
      }

      const { data, error } = await query;

      if (!error && data) {
        const typedData = data as Lead[];
        setLeads(typedData);
        // Cache the results
        const cache: LeadsCache = {
          leads: typedData,
          timestamp: Date.now(),
          memberId: memberName,
        };
        localStorage.setItem('yfm_leads_cache', JSON.stringify(cache));
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    }

    setIsLoading(false);
  }, [memberName, memberRole]);

  const loadImportBatches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('imports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setImportBatches(data as ImportBatch[]);
      }
    } catch (err) {
      console.error('Failed to load import batches:', err);
    }
  }, []);

  useEffect(() => {
    loadLeads();
    loadImportBatches();
  }, [loadLeads, loadImportBatches]);

  const updateLead = useCallback(
    async (id: string, updates: Partial<Lead>) => {
      const leadIndex = leads.findIndex((l) => l.id === id);
      if (leadIndex === -1) return;

      const oldLead = leads[leadIndex];
      const newLead = { ...oldLead, ...updates };

      // Optimistic update
      const newLeads = [...leads];
      newLeads[leadIndex] = newLead;
      setLeads(newLeads);

      try {
        const { error } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', id);

        if (error) throw error;

        // Update cache
        const cached = localStorage.getItem('yfm_leads_cache');
        if (cached) {
          try {
            const cacheData: LeadsCache = JSON.parse(cached);
            cacheData.leads = newLeads;
            cacheData.timestamp = Date.now();
            localStorage.setItem('yfm_leads_cache', JSON.stringify(cacheData));
          } catch {
            // Ignore cache errors
          }
        }
      } catch (err) {
        // Revert on error
        setLeads(leads);
        throw err;
      }
    },
    [leads]
  );

  const deleteLead = useCallback(
    async (id: string) => {
      // Optimistic delete
      const newLeads = leads.filter((l) => l.id !== id);
      setLeads(newLeads);

      try {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) throw error;

        // Update cache
        const cached = localStorage.getItem('yfm_leads_cache');
        if (cached) {
          try {
            const cacheData: LeadsCache = JSON.parse(cached);
            cacheData.leads = newLeads;
            cacheData.timestamp = Date.now();
            localStorage.setItem('yfm_leads_cache', JSON.stringify(cacheData));
          } catch {
            // Ignore cache errors
          }
        }
      } catch (err) {
        // Revert on error
        setLeads(leads);
        throw err;
      }
    },
    [leads]
  );

  const addLead = useCallback(
    async (lead: Omit<Lead, 'id' | 'created_at'>) => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .insert(lead)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const typedData = data as Lead;
          const newLeads = [...leads, typedData];
          setLeads(newLeads);

          // Update cache
          const cached = localStorage.getItem('yfm_leads_cache');
          if (cached) {
            try {
              const cacheData: LeadsCache = JSON.parse(cached);
              cacheData.leads = newLeads;
              cacheData.timestamp = Date.now();
              localStorage.setItem('yfm_leads_cache', JSON.stringify(cacheData));
            } catch {
              // Ignore cache errors
            }
          }

          return typedData;
        }
      } catch (err) {
        console.error('Failed to add lead:', err);
        throw err;
      }
    },
    [leads]
  );

  const bulkAssign = useCallback(
    async (leadIds: string[], rep: string) => {
      try {
        const { error } = await supabase
          .from('leads')
          .update({ rep })
          .in('id', leadIds);

        if (error) throw error;

        // Update local state
        const newLeads = leads.map((l) =>
          leadIds.includes(l.id) ? { ...l, rep } : l
        );
        setLeads(newLeads);

        // Update cache
        const cached = localStorage.getItem('yfm_leads_cache');
        if (cached) {
          try {
            const cacheData: LeadsCache = JSON.parse(cached);
            cacheData.leads = newLeads;
            cacheData.timestamp = Date.now();
            localStorage.setItem('yfm_leads_cache', JSON.stringify(cacheData));
          } catch {
            // Ignore cache errors
          }
        }
      } catch (err) {
        console.error('Failed to bulk assign:', err);
        throw err;
      }
    },
    [leads]
  );

  const getLeadsByRep = useCallback(
    (rep: string) => leads.filter((l) => l.rep === rep),
    [leads]
  );

  const getLeadsByStatus = useCallback(
    (status: string) => leads.filter((l) => l.status === status),
    [leads]
  );

  const leadsWithLatLng = leads.filter((l) => l.lat !== null && l.lng !== null);

  const value: LeadsContextType = {
    leads,
    leadsWithLatLng,
    importBatches,
    isLoading,
    loadLeads,
    loadImportBatches,
    updateLead,
    deleteLead,
    addLead,
    bulkAssign,
    getLeadsByRep,
    getLeadsByStatus,
  };

  return (
    <LeadsContext.Provider value={value}>
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error('useLeads must be used within LeadsProvider');
  }
  return context;
}
