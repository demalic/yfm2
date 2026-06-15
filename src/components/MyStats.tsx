import React, { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { useSettings } from '../hooks/useSettings';
import { TrendingUp, DollarSign, Target, Award } from 'lucide-react';
import { StatusIconSvg } from './StatusIcon';
import type { IconKey } from './StatusIcon';

export function MyStats() {
  const { member } = useAuth();
  const { leads } = useLeads();
  const { commissionRate, statuses } = useSettings();

  const stats = useMemo(() => {
    if (!member) return { sold: 0, knocked: 0, closeRate: 0, commission: 0 };

    const myLeads = leads.filter(
      (lead) => lead.rep === member.name || lead.rep === member.id
    );

    const sold = myLeads.filter((lead) => lead.status === 'sold').length;
    // Knocked = any lead that's not "new" or "untouched"
    const knocked = myLeads.filter(
      (lead) => !['new', 'untouched'].includes(lead.status)
    ).length;
    const closeRate = knocked > 0 ? Math.round((sold / knocked) * 100) : 0;
    const commission = sold * commissionRate;

    return { sold, knocked, closeRate, commission, total: myLeads.length };
  }, [leads, member, commissionRate]);

  const soldStatus = statuses.find((s) => s.id === 'sold');

  return (
    <div className="h-full overflow-y-auto bg-dark-bg">
      {/* Header */}
      <div className="px-4 py-4 border-b border-dark-border">
        <h1 className="text-xl font-bold text-white">My Stats</h1>
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {/* Sold */}
        <div className="bg-dark-card rounded-2xl p-4 border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Sold</span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: soldStatus?.color + '20' || '#22c55e20' }}
            >
              <DollarSign className="w-4 h-4" style={{ color: soldStatus?.color || '#22c55e' }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.sold}</p>
        </div>

        {/* Doors Knocked */}
        <div className="bg-dark-card rounded-2xl p-4 border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Doors Knocked</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.knocked}</p>
        </div>

        {/* Close Rate */}
        <div className="bg-dark-card rounded-2xl p-4 border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Close Rate</span>
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.closeRate}%</p>
        </div>

        {/* Commission */}
        <div className="bg-dark-card rounded-2xl p-4 border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Commission</span>
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
              <Award className="w-4 h-4 text-accent-cyan" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">${stats.commission.toLocaleString()}</p>
        </div>
      </div>

      {/* Total Leads */}
      <div className="px-4">
        <div className="bg-dark-card rounded-2xl p-4 border border-dark-border">
          <p className="text-gray-400 text-sm mb-1">Total Assigned Leads</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 mt-4">
        <div className="bg-dark-card rounded-2xl p-4 border border-dark-border">
          <p className="text-gray-400 text-sm mb-3">Status Breakdown</p>
          <div className="space-y-2">
            {statuses.slice(0, 5).map((status) => {
              const count = member
                ? leads.filter(
                    (l) =>
                      (l.rep === member.name || l.rep === member.id) &&
                      l.status === status.id
                  ).length
                : 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

              return (
                <div key={status.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: status.color }}>
                    <StatusIconSvg iconKey={status.icon as IconKey} className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{status.name}</span>
                      <span className="text-white">{count}</span>
                    </div>
                    <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: status.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Commission Rate Info */}
      <div className="px-4 mt-4 pb-4">
        <p className="text-xs text-gray-500 text-center">
          Commission rate: ${commissionRate}/sale
        </p>
      </div>
    </div>
  );
}
