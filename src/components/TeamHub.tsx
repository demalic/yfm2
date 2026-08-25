import type { ReactNode } from 'react';
import {
  Users,
  DollarSign,
  BarChart3,
  Map,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { TEAM_TOOLS_NAME } from './ui/table-transition-label';

export type TeamSubView = 'hub' | 'members' | 'commission' | 'stats' | 'territory';

interface TeamHubCard {
  id: Exclude<TeamSubView, 'hub'>;
  title: string;
  description: string;
  icon: ReactNode;
  roles: string[];
}

const TEAM_HUB_CARDS: TeamHubCard[] = [
  {
    id: 'members',
    title: 'Members',
    description: 'Manage team roster and roles',
    icon: <Users className="w-6 h-6" />,
    roles: ['admin'],
  },
  {
    id: 'commission',
    title: 'Commission',
    description: 'Sales leaderboard and commission totals',
    icon: <DollarSign className="w-6 h-6" />,
    roles: ['admin'],
  },
  {
    id: 'stats',
    title: 'Stats',
    description: 'Your sales performance and close rate',
    icon: <BarChart3 className="w-6 h-6" />,
    roles: ['admin', 'manager', 'rep'],
  },
  {
    id: 'territory',
    title: 'Territory',
    description: 'Draw territories and assign leads to reps',
    icon: <Map className="w-6 h-6" />,
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

  return (
    <div className="h-full hub-shell overflow-y-auto">
      <div className="page-header shrink-0">
        <h1 className="page-title">{TEAM_TOOLS_NAME}</h1>
        <p className="page-subtitle">Choose a team tool</p>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full space-y-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onNavigate(card.id)}
            className="hub-card w-full flex items-center gap-4 p-4 text-left group"
          >
            <div className="icon-well group-hover:border-brand-orange/40 group-hover:bg-brand-orange/10 transition-colors">
              {card.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-content group-hover:text-brand-orange-bright transition-colors">
                {card.title}
              </p>
              <p className="text-sm text-content-muted mt-0.5">{card.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-content-muted group-hover:text-brand-orange shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

interface TeamSubViewBarProps {
  onBack: () => void;
}

export function TeamSubViewBar({ onBack }: TeamSubViewBarProps) {
  return (
    <div className="shrink-0 page-header !py-3">
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
