import type { ReactNode } from 'react';
import { List, Search, Upload, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LEADS_TOOLS_NAME } from './ui/table-transition-label';
import { PageHero } from './ui/PageHero';
import { HubSummaryCard } from './ui/HubSummaryCard';
import { HubGridCard } from './ui/HubGridCard';

export type LeadsSubView = 'hub' | 'list' | 'find' | 'import' | 'eligibility';

interface LeadHubCard {
  id: Exclude<LeadsSubView, 'hub'>;
  title: string;
  description: string;
  detail: string;
  icon: ReactNode;
  roles: string[];
}

const LEAD_HUB_CARDS: LeadHubCard[] = [
  {
    id: 'list',
    title: 'My Leads',
    description: 'View and manage your assigned leads',
    detail: 'Assigned pipeline',
    icon: <List className="w-5 h-5" strokeWidth={1.75} />,
    roles: ['admin', 'manager', 'rep'],
  },
  {
    id: 'find',
    title: 'Find',
    description: 'Search FCC fiber availability data',
    detail: 'FCC lookup',
    icon: <Search className="w-5 h-5" strokeWidth={1.75} />,
    roles: ['admin'],
  },
  {
    id: 'import',
    title: 'Import',
    description: 'Upload lead lists and addresses',
    detail: 'CSV upload',
    icon: <Upload className="w-5 h-5" strokeWidth={1.75} />,
    roles: ['admin'],
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    description: 'Run zip checker and qualifier on the tower',
    detail: 'Tower pipeline',
    icon: <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />,
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
  const defaultTool = cards[0]?.id ?? 'list';

  return (
    <div className="h-full overflow-y-auto">
      <div className="crm-content space-y-8 py-2">
        <PageHero
          title={LEADS_TOOLS_NAME}
          description="Choose a leads tool for your workflow"
          footline={`${cards.length} tools · field sales pipeline`}
          icon={List}
          summary={
            <HubSummaryCard
              headline={`${cards.length} Tools`}
              subline="My Leads · Find · Import · Eligibility"
              featureIcon={List}
              featureText="Open the most-used tool first"
              actionLabel="Open My Leads"
              onAction={() => onNavigate(defaultTool)}
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

interface LeadsSubViewBarProps {
  onBack: () => void;
}

export function LeadsSubViewBar({ onBack }: LeadsSubViewBarProps) {
  return (
    <div className="shrink-0 crm-subview-bar">
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
