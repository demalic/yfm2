import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { useSettings } from '../hooks/useSettings';
import { TrendingUp, DollarSign, Target, Award } from 'lucide-react';
import { StatusIconSvg } from './StatusIcon';
import type { IconKey } from './StatusIcon';
import { PageHeader, StatCard, Card } from './ui';

export function MyStats() {
  const { member } = useAuth();
  const { leads } = useLeads();
  const { commissionRate, statuses } = useSettings();

  const stats = useMemo(() => {
    if (!member) return { sold: 0, knocked: 0, closeRate: 0, commission: 0, total: 0 };

    const myLeads = leads.filter(
      (lead) => lead.rep === member.name || lead.rep === member.id
    );

    const sold = myLeads.filter((lead) => lead.status === 'sold').length;
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
      <PageHeader title="My Stats" subtitle="Your performance at a glance" />

      <div className="p-4 grid grid-cols-2 gap-3">
        <StatCard
          label="Sold"
          value={stats.sold}
          icon={<DollarSign className="w-4 h-4" style={{ color: soldStatus?.color || '#22c55e' }} />}
          iconBg={soldStatus?.color ? `${soldStatus.color}20` : '#22c55e20'}
        />
        <StatCard
          label="Doors Knocked"
          value={stats.knocked}
          icon={<Target className="w-4 h-4 text-brand-orange" />}
          iconBg="rgba(248, 148, 6, 0.15)"
        />
        <StatCard
          label="Close Rate"
          value={`${stats.closeRate}%`}
          icon={<TrendingUp className="w-4 h-4 text-white" />}
          iconBg="rgba(255, 255, 255, 0.1)"
        />
        <StatCard
          label="Commission"
          value={`$${stats.commission.toLocaleString()}`}
          icon={<Award className="w-4 h-4 text-brand-orange-bright" />}
          iconBg="rgba(248, 148, 6, 0.2)"
        />
      </div>

      <div className="px-4">
        <Card>
          <p className="text-gray-400 text-sm font-medium mb-1">Total Assigned Leads</p>
          <p className="text-2xl font-extrabold text-white">{stats.total}</p>
        </Card>
      </div>

      <div className="px-4 mt-4">
        <Card>
          <p className="text-gray-400 text-sm font-medium mb-3">Status Breakdown</p>
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
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: status.color }}
                  >
                    <StatusIconSvg iconKey={status.icon as IconKey} className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400 font-medium">{status.name}</span>
                      <span className="text-white font-semibold">{count}</span>
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
        </Card>
      </div>

      <div className="px-4 mt-4 pb-4">
        <p className="text-xs text-gray-500 text-center font-medium">
          Commission rate: ${commissionRate}/sale
        </p>
      </div>
    </div>
  );
}
