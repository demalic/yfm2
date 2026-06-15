import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import {
  Palette, Trash2, Plus, X, DollarSign, Map
} from 'lucide-react';
import type { LeadStatus } from '../types';
import { StatusIconSvg, ICON_OPTIONS } from './StatusIcon';
import type { IconKey } from './StatusIcon';

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#6b7280',
];

type MapTheme = 'dark' | 'light' | 'satellite';

export function Settings() {
  const { member, logout } = useAuth();
  const { statuses, commissionRate, settings, saveCommissionRate, addStatus, updateStatus, deleteStatus, updateSettings } = useSettings();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<'statuses' | 'commission' | 'map' | 'data'>('map');
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [editingStatus, setEditingStatus] = useState<LeadStatus | null>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState(COLOR_OPTIONS[0]);
  const [newStatusIcon, setNewStatusIcon] = useState<IconKey>(ICON_OPTIONS[0].key);
  const [mapTheme, setMapTheme] = useState<MapTheme>((settings?.mapTheme as MapTheme) || 'dark');

  const handleSaveCommissionRate = () => {
    saveCommissionRate(commissionRate);
    showToast('Commission rate saved', 'success');
  };

  const handleMapThemeChange = async (theme: MapTheme) => {
    setMapTheme(theme);
    await updateSettings({ mapTheme: theme });
    showToast('Map theme updated', 'success');
  };

  const handleAddStatus = () => {
    if (!newStatusName.trim()) {
      showToast('Please enter a status name', 'error');
      return;
    }

    addStatus({
      name: newStatusName.trim(),
      color: newStatusColor,
      icon: newStatusIcon,
    });

    setNewStatusName('');
    setShowAddStatus(false);
    showToast('Status added', 'success');
  };

  const handleUpdateStatus = () => {
    if (!editingStatus) return;

    updateStatus(editingStatus.id, {
      name: editingStatus.name,
      color: editingStatus.color,
      icon: editingStatus.icon,
    });

    setEditingStatus(null);
    showToast('Status updated', 'success');
  };

  const handleDeleteStatus = (statusId: string) => {
    if (statuses.length <= 1) {
      showToast('Must have at least one status', 'error');
      return;
    }

    if (!confirm('Delete this status?')) return;

    deleteStatus(statusId);
    showToast('Status deleted', 'success');
  };

  const handleRemoveDuplicates = async () => {
    if (!confirm('Remove duplicate leads? This compares address + city and keeps the most recent.')) return;

    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const seen = new Map<string, string>();
      const duplicates: string[] = [];

      (leads || []).forEach((lead: { id: string; street: string; city: string }) => {
        const key = `${lead.street.toLowerCase()}-${lead.city.toLowerCase()}`;
        if (seen.has(key)) {
          duplicates.push(lead.id);
        } else {
          seen.set(key, lead.id);
        }
      });

      if (duplicates.length === 0) {
        showToast('No duplicates found', 'info');
        return;
      }

      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .in('id', duplicates);

      if (deleteError) throw deleteError;

      showToast(`Removed ${duplicates.length} duplicates`, 'success');
    } catch (err) {
      console.error('Error:', err);
      showToast('Failed to remove duplicates', 'error');
    }
  };

  const handleDeleteOrphans = async () => {
    if (!confirm('Delete orphaned leads? This removes leads whose import batch was deleted.')) return;

    try {
      const { data: leadsWithImport, error: leadsError } = await supabase
        .from('leads')
        .select('id, import_id')
        .not('import_id', 'is', null);

      if (leadsError) throw leadsError;

      const { data: imports, error: importsError } = await supabase
        .from('imports')
        .select('id');

      if (importsError) throw importsError;

      const validImportIds = new Set((imports || []).map((i: { id: string }) => i.id));
      const orphans = (leadsWithImport || [])
        .filter((l: { import_id: string | null }) => l.import_id && !validImportIds.has(l.import_id))
        .map((l: { id: string }) => l.id);

      if (orphans.length === 0) {
        showToast('No orphaned leads found', 'info');
        return;
      }

      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .in('id', orphans);

      if (deleteError) throw deleteError;

      showToast(`Deleted ${orphans.length} orphaned leads`, 'success');
    } catch (err) {
      console.error('Error:', err);
      showToast('Failed to delete orphans', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="px-4 py-4 border-b border-dark-border">
        <h1 className="text-xl font-bold text-white mb-3">Settings</h1>

        {/* Section Tabs */}
        <div className="flex gap-2 overflow-x-auto scroll-hide">
          <button
            onClick={() => setActiveSection('map')}
            className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-colors
                      ${activeSection === 'map'
                        ? 'bg-accent-cyan/20 text-accent-cyan'
                        : 'bg-dark-card text-gray-400 hover:text-white'
                      }`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveSection('statuses')}
            className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-colors
                      ${activeSection === 'statuses'
                        ? 'bg-accent-cyan/20 text-accent-cyan'
                        : 'bg-dark-card text-gray-400 hover:text-white'
                      }`}
          >
            Statuses
          </button>
          <button
            onClick={() => setActiveSection('commission')}
            className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-colors
                      ${activeSection === 'commission'
                        ? 'bg-accent-cyan/20 text-accent-cyan'
                        : 'bg-dark-card text-gray-400 hover:text-white'
                      }`}
          >
            Commission
          </button>
          <button
            onClick={() => setActiveSection('data')}
            className={`flex-shrink-0 py-2 px-4 rounded-xl text-sm font-medium transition-colors
                      ${activeSection === 'data'
                        ? 'bg-accent-cyan/20 text-accent-cyan'
                        : 'bg-dark-card text-gray-400 hover:text-white'
                      }`}
          >
            Data
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'map' && (
          <div className="space-y-6">
            {/* Map Theme */}
            <div>
              <h2 className="font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Map className="w-4 h-4" />
                Map Theme
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleMapThemeChange('dark')}
                  className={`rounded-xl p-4 border transition-all
                            ${mapTheme === 'dark'
                              ? 'border-accent-cyan bg-accent-cyan/10'
                              : 'border-dark-border bg-dark-card hover:border-gray-600'
                            }`}
                >
                  <div className="text-2xl mb-2">🌙</div>
                  <p className="text-sm font-medium text-white">Dark</p>
                </button>
                <button
                  onClick={() => handleMapThemeChange('light')}
                  className={`rounded-xl p-4 border transition-all
                            ${mapTheme === 'light'
                              ? 'border-accent-cyan bg-accent-cyan/10'
                              : 'border-dark-border bg-dark-card hover:border-gray-600'
                            }`}
                >
                  <div className="text-2xl mb-2">☀️</div>
                  <p className="text-sm font-medium text-white">Light</p>
                </button>
                <button
                  onClick={() => handleMapThemeChange('satellite')}
                  className={`rounded-xl p-4 border transition-all
                            ${mapTheme === 'satellite'
                              ? 'border-accent-cyan bg-accent-cyan/10'
                              : 'border-dark-border bg-dark-card hover:border-gray-600'
                            }`}
                >
                  <div className="text-2xl mb-2">🛰️</div>
                  <p className="text-sm font-medium text-white">Satellite</p>
                </button>
              </div>
            </div>

          </div>
        )}

        {activeSection === 'statuses' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-gray-400">Lead Statuses</h2>
              <button
                onClick={() => setShowAddStatus(true)}
                className="flex items-center gap-1 text-sm text-accent-cyan hover:text-accent-cyan/80"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            <div className="space-y-2">
              {statuses.map((status) => (
                <div
                  key={status.id}
                  className="bg-dark-card rounded-xl p-4 border border-dark-border flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: status.color }}
                  >
                    <StatusIconSvg iconKey={status.icon as IconKey} className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-white">{status.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-xs text-gray-500">{status.color}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingStatus({ ...status })}
                      className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                    >
                      <Palette className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteStatus(status.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'commission' && (
          <div>
            <h2 className="font-medium text-gray-400 mb-4">Commission Rate</h2>

            <div className="bg-dark-card rounded-xl p-4 border border-dark-border">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-green-400" />
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => saveCommissionRate(parseFloat(e.target.value) || 0)}
                  className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2
                           text-white text-2xl font-bold focus:outline-none focus:border-accent-cyan"
                  min={0}
                  step={10}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Per sale commission amount</p>
            </div>
          </div>
        )}

        {activeSection === 'data' && (
          <div>
            <h2 className="font-medium text-gray-400 mb-4">Data Management</h2>

            <div className="space-y-3">
              <button
                onClick={handleRemoveDuplicates}
                className="w-full bg-dark-card border border-dark-border rounded-xl p-4
                         hover:bg-dark-hover transition-colors text-left"
              >
                <p className="font-medium text-white">Remove Duplicate Leads</p>
                <p className="text-sm text-gray-500 mt-1">
                  Deduplicate leads by address + city
                </p>
              </button>

              <button
                onClick={handleDeleteOrphans}
                className="w-full bg-dark-card border border-dark-border rounded-xl p-4
                         hover:bg-dark-hover transition-colors text-left"
              >
                <p className="font-medium text-white">Delete Orphaned Leads</p>
                <p className="text-sm text-gray-500 mt-1">
                  Remove leads whose import batch was deleted
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <div className="mt-8">
          <button
            onClick={logout}
            className="w-full py-3 rounded-xl border border-red-500/30 text-red-400
                     hover:bg-red-500/10 active:scale-[0.98] transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Add Status Modal */}
      {showAddStatus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-dark-card rounded-t-3xl border-t border-dark-border bottom-sheet">
            <div className="flex items-center justify-between px-4 py-4 border-b border-dark-border">
              <h3 className="font-semibold text-white">Add Status</h3>
              <button onClick={() => setShowAddStatus(false)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Name</label>
                <input
                  type="text"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="Status name"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3
                           text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewStatusColor(color)}
                      className={`w-8 h-8 rounded-lg transition-transform
                                ${newStatusColor === color ? 'scale-110 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setNewStatusIcon(opt.key)}
                      title={opt.label}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                ${newStatusIcon === opt.key
                                  ? 'ring-2 ring-accent-cyan scale-110'
                                  : 'hover:scale-105'
                                }`}
                      style={{ backgroundColor: newStatusColor }}
                    >
                      <StatusIconSvg iconKey={opt.key} className="w-5 h-5 text-white" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddStatus}
                className="w-full bg-accent-cyan text-dark-bg font-semibold py-3 rounded-xl
                         hover:bg-accent-cyan/90 active:scale-[0.98] transition-all"
              >
                Add Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingStatus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-dark-card rounded-t-3xl border-t border-dark-border bottom-sheet">
            <div className="flex items-center justify-between px-4 py-4 border-b border-dark-border">
              <h3 className="font-semibold text-white">Edit Status</h3>
              <button onClick={() => setEditingStatus(null)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Name</label>
                <input
                  type="text"
                  value={editingStatus.name}
                  onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3
                           text-white focus:outline-none focus:border-accent-cyan"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingStatus({ ...editingStatus, color })}
                      className={`w-8 h-8 rounded-lg transition-transform
                                ${editingStatus.color === color ? 'scale-110 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setEditingStatus({ ...editingStatus, icon: opt.key })}
                      title={opt.label}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                ${editingStatus.icon === opt.key
                                  ? 'ring-2 ring-accent-cyan scale-110'
                                  : 'hover:scale-105'
                                }`}
                      style={{ backgroundColor: editingStatus.color }}
                    >
                      <StatusIconSvg iconKey={opt.key as IconKey} className="w-5 h-5 text-white" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleUpdateStatus}
                className="w-full bg-accent-cyan text-dark-bg font-semibold py-3 rounded-xl
                         hover:bg-accent-cyan/90 active:scale-[0.98] transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
