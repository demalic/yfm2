import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface HubGridCardProps {
  label?: string;
  title: string;
  detail: string;
  icon: ReactNode;
  onClick: () => void;
}

export function HubGridCard({ label = 'Tool', title, detail, icon, onClick }: HubGridCardProps) {
  return (
    <button type="button" onClick={onClick} className="crm-grid-card group">
      <div className="flex items-start justify-between gap-3">
        <div className="crm-icon-well">{icon}</div>
        <ChevronDown
          className="w-5 h-5 text-content-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -rotate-90"
          aria-hidden
        />
      </div>
      <p className="mt-4 text-xs text-content-muted">{label}</p>
      <p className="mt-1 text-xl sm:text-2xl font-bold text-content group-hover:text-brand-orange-bright transition-colors">
        {title}
      </p>
      <p className="mt-2 text-sm text-content-muted">{detail}</p>
    </button>
  );
}
