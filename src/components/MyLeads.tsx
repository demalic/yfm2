import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { Search, MapPin, Clock, ChevronRight, Filter, X } from 'lucide-react';
import type { Lead } from '../types';

interface MyLeadsProps {
  onLeadClick?: (lead: Lead) => void;
}

export function MyLeads({ onLeadClick }: MyLeadsProps) {
  const { member } = useAuth();
  const { leads, updateLead } = useLeads();
  const { statuses, getStatusById } = useSettings();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [showStatusPicker, setShowStatusPicker] = useState<Lead | null>(null);

  const myLeads = useMemo(() => {
    if (!member) return [];
    return leads.filter(
      (lead) => lead.rep === member.name || lead.rep === member.id
    );
  }, [leads, member]);

  const filteredLeads = useMemo(() => {
    return myLeads.filter((lead) => {
      const matchesSearch =
        !search ||
        lead.street.toLowerCase().includes(search.toLowerCase()) ||
        lead.city.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter.size === 0 || statusFilter.has(lead.status);

      return matchesSearch && matchesStatus;
    });
  }, [myLeads, search, statusFilter]);

  const handleQuickStatus = async (lead: Lead, newStatus: string) => {
    try {
      await updateLead(lead.id, { status: newStatus });
      showToast('Status updated', 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const toggleStatusFilter = (statusId: string) => {
    const newFilter = new Set(statusFilter);
    if (newFilter.has(statusId)) {
      newFilter.delete(statusId);
    } else {
      newFilter.add(statusId);
    }
    setStatusFilter(newFilter);
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="px-4 py-4 border-b border-dark-border">
        <h1 className="text-xl font-bold text-white mb-3">My Leads</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address..."
            className="w-full bg-dark-card border border-dark-border rounded-xl pl-10 pr-4 py-2.5
                     text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan
                     text-base"
          />
        </div>

        {/* Status Filters */}
        {statuses.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto scroll-hide pb-1">
            {statuses.slice(0, 6).map((status) => (
              <button
                key={status.id}
                onClick={() => toggleStatusFilter(status.id)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                          transition-colors whitespace-nowrap
                          ${statusFilter.has(status.id)
                            ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50'
                            : 'bg-dark-card text-gray-400 border border-dark-border hover:border-gray-600'
                          }`}
              >
                <span>{status.icon}</span>
                <span>{status.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto">
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No leads found</p>
            <p className="text-sm mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {filteredLeads.map((lead) => {
              const status = getStatusById(lead.status);
              return (
                <div
                  key={lead.id}
                  className="px-4 py-3 hover:bg-dark-hover transition-colors cursor-pointer"
                  onClick={() => setShowStatusPicker(lead)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ backgroundColor: status.color + '20' }}
                    >
                      {status.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {lead.street}
                      </p>
                      <p className="text-sm text-gray-400">
                        {lead.city}, {lead.state}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: status.color + '20', color: status.color }}
                        >
                          {status.name}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(lead.created_at)}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Picker Modal */}
      {showStatusPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-dark-card rounded-t-3xl border-t border-dark-border bottom-sheet">
            <div className="flex items-center justify-between px-4 py-4 border-b border-dark-border">
              <div>
                <h3 className="font-semibold text-white">{showStatusPicker.street}</h3>
                <p className="text-sm text-gray-400">{showStatusPicker.city}</p>
              </div>
              <button
                onClick={() => setShowStatusPicker(null)}
                className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-xs text-gray-500 mb-2">Quick Status</p>
              <div className="grid grid-cols-2 gap-2">
                {statuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => {
                      handleQuickStatus(showStatusPicker, status.id);
                      setShowStatusPicker(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors
                              ${showStatusPicker.status === status.id
                                ? 'bg-accent-cyan/20 border border-accent-cyan text-white'
                                : 'bg-dark-bg border border-dark-border text-gray-300 hover:border-gray-600'
                              }`}
                  >
                    <span>{status.icon}</span>
                    <span>{status.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
