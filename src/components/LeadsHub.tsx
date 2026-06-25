import type { ReactNode } from 'react';
import { List, Search, Upload, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { TableBackdrop } from './TableBackdrop';
import { LEADS_TOOLS_NAME } from './ui/table-transition-label';
import { Card } from './ui';

export type LeadsSubView = 'hub' | 'list' | 'find' | 'import' | 'eligibility';

interface LeadHubCard {
  id: Exclude<LeadsSubView, 'hub'>;
  title: string;
  description: string;
  icon: ReactNode;
  roles: string[];
}

const LEAD_HUB_CARDS: LeadHubCard[] = [
  {
    id: 'list',
    title: 'My Leads',
    description: 'View and manage your assigned leads',
    icon: <List className="w-6 h-6" />,
    roles: ['admin', 'manager', 'rep'],
  },
  {
    id: 'find',
    title: 'Find',
    description: 'Search FCC fiber availability data',
    icon: <Search className="w-6 h-6" />,
    roles: ['admin'],
  },
  {
    id: 'import',
    title: 'Import',
    description: 'Upload lead lists and addresses',
    icon: <Upload className="w-6 h-6" />,
    roles: ['admin'],
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    description: 'Run zip checker and qualifier on the tower',
    icon: <ShieldCheck className="w-6 h-6" />,
    roles: ['admin'],
  },
];

interface LeadsHubProps {
  onNavigate: (view: Exclude<LeadsSubView, 'hub'>) => void;
}

export function LeadsHub({ onNavigate }: LeadsHubProps) {
  const { member } = useAuth();
  const role = member?.role ?? '';

  const cards = LEAD_HUB_CARDS.filter((card) => card.roles.includes(role));

  return (
    <div className="h-full auth-screen relative overflow-hidden">
      <TableBackdrop />

      <div className="relative z-10 h-full overflow-y-auto">
        <div className="page-header shrink-0 border-dark-border/60 bg-dark-bg/40 backdrop-blur-md">
          <h1 className="page-title">{LEADS_TOOLS_NAME}</h1>
          <p className="page-subtitle">Choose a leads tool</p>
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

interface LeadsSubViewBarProps {
  onBack: () => void;
}

export function LeadsSubViewBar({ onBack }: LeadsSubViewBarProps) {
  return (
    <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-dark-border/80 bg-dark-bg/80 backdrop-blur-md">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-brand-orange hover:text-brand-orange-bright transition-colors"
      >
        ← {LEADS_TOOLS_NAME}
      </button>
    </div>
  );
}
