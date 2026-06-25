import type { ReactNode } from 'react';
import {
  Users,
  DollarSign,
  BarChart3,
  Map,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { TableBackdrop } from './TableBackdrop';
import { TEAM_TOOLS_NAME } from './ui/table-transition-label';
import { Card } from './ui';

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
    <div className="h-full auth-screen relative overflow-hidden">
      <TableBackdrop />

      <div className="relative z-10 h-full overflow-y-auto">
        <div className="page-header shrink-0 border-dark-border/60 bg-dark-bg/40 backdrop-blur-md">
          <h1 className="page-title">{TEAM_TOOLS_NAME}</h1>
          <p className="page-subtitle">Choose a team tool</p>
        </div>

        <div className="p-4 max-w-lg mx-auto w-full space-y-3">
          {cards.map((card) => (
            <Card
              key={card.id}
              variant="interactive"
              padding="md"
              role="button"
              tabIndex={0}
              onClick={() => onNavigate(card.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate(card.id);
                }
              }}
              className="flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange shrink-0">
                {card.icon}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-white group-hover:text-brand-orange-bright transition-colors">
                  {card.title}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">{card.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-brand-orange shrink-0 transition-colors" />
            </Card>
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
    <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-dark-border/80 bg-dark-bg/80 backdrop-blur-md">
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
