import type { ReactNode } from 'react';
import { Users, DollarSign, BarChart3, Map } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { TEAM_TOOLS_NAME } from './ui/table-transition-label';
import { PageHero } from './ui/PageHero';
import { HubSummaryCard } from './ui/HubSummaryCard';
import { HubGridCard } from './ui/HubGridCard';

export type TeamSubView = 'hub' | 'members' | 'commission' | 'stats' | 'territory';

interface TeamHubCard {
  id: Exclude<TeamSubView, 'hub'>;
  title: string;
  description: string;
  detail: string;
  icon: ReactNode;
  roles: string[];
}

const TEAM_HUB_CARDS: TeamHubCard[] = [
  {
    id: 'members',
    title: 'Members',
    description: 'Manage team roster and roles',
    detail: 'Roster admin',
    icon: <Users className="w-5 h-5" strokeWidth={1.75} />,
    roles: ['admin'],
  },
  {
    id: 'commission',
    title: 'Commission',
    description: 'Sales leaderboard and commission totals',
    detail: 'Leaderboard',
    icon: <DollarSign className="w-5 h-5" strokeWidth={1.75} />,
    roles: ['admin'],
  },
  {
    id: 'stats',
    title: 'Stats',
    description: 'Your sales performance and close rate',
    detail: 'Performance',
    icon: <BarChart3 className="w-5 h-5" strokeWidth={1.75} />,
    roles: ['admin', 'manager', 'rep'],
  },
  {
    id: 'territory',
    title: 'Territory',
    description: 'Draw territories and assign leads to reps',
    detail: 'Map territories',
    icon: <Map className="w-5 h-5" strokeWidth={1.75} />,
    roles: ['admin', 'manager'],
  },
];

interface TeamHubProps {
  onNavigate: (view: Exclude<TeamSubView, 'hub'>) => void;
}

export function TeamHub({ onNavigate }: TeamHubProps) {
  const { member } = useAuth();
  const role = member?.role ?? '';

  const cards = TEAM_HUB_CARDS.filter((card) => card.roles.includes(role));
  const defaultTool = cards.find((c) => c.id === 'stats')?.id ?? cards[0]?.id ?? 'stats';

  return (
    <div className="h-full overflow-y-auto">
      <div className="crm-content space-y-8 py-2">
        <PageHero
          title={TEAM_TOOLS_NAME}
          description="Choose a team tool for management and performance"
          footline={`${cards.length} tools · team operations`}
          icon={Users}
          summary={
            <HubSummaryCard
              headline={`${cards.length} Tools`}
              subline="Members · Commission · Stats · Territory"
              featureIcon={BarChart3}
              featureText="Jump into your performance dashboard"
              actionLabel="Open Stats"
              onAction={() => onNavigate(defaultTool as Exclude<TeamSubView, 'hub'>)}
            />
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <HubGridCard
              key={card.id}
              title={card.title}
              detail={card.detail}
              icon={card.icon}
              onClick={() => onNavigate(card.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TeamSubViewBarProps {
  onBack: () => void;
}

export function TeamSubViewBar({ onBack }: TeamSubViewBarProps) {
  return (
    <div className="shrink-0 crm-subview-bar">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-brand-orange hover:text-brand-orange-bright transition-colors"
      >
        ← {TEAM_TOOLS_NAME}
      </button>
    </div>
  );
}
