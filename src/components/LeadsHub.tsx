import type { ReactNode } from 'react';
import { List, Search, Upload, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LEADS_TOOLS_NAME } from './ui/table-transition-label';

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
    <div className="h-full hub-shell overflow-y-auto">
      <div className="page-header shrink-0">
        <h1 className="page-title">{LEADS_TOOLS_NAME}</h1>
        <p className="page-subtitle">Choose a leads tool</p>
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

interface LeadsSubViewBarProps {
  onBack: () => void;
}

export function LeadsSubViewBar({ onBack }: LeadsSubViewBarProps) {
  return (
    <div className="shrink-0 page-header !py-3">
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
