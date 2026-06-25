import { cn } from '../../lib/cn';

export interface TransitionLabelProps {
  label?: string;
  labelPrefix?: string;
  labelHighlight?: string;
  labelSuffix?: string;
}

export function TableTransitionLabel({
  label,
  labelPrefix,
  labelHighlight,
  labelSuffix,
  className,
}: TransitionLabelProps & { className?: string }) {
  if (labelHighlight) {
    return (
      <p className={className}>
        {labelPrefix != null && <span className="text-white">{labelPrefix}</span>}
        <span className="text-brand-orange-bright">{labelHighlight}</span>
        {labelSuffix != null && <span className="text-white">{labelSuffix}</span>}
      </p>
    );
  }

  return (
    <p className={cn('text-white', className)}>
      {label ?? 'Loading'}
    </p>
  );
}

export const LEADS_TOOLS_NAME = 'LeadsTools';
export const TEAM_TOOLS_NAME = 'TeamTools';

export const HUB_TRANSITIONS: Record<string, TransitionLabelProps> = {
  'leads-hub': {
    labelPrefix: 'Opening ',
    labelHighlight: LEADS_TOOLS_NAME,
    labelSuffix: '.',
  },
  'team-hub': {
    labelPrefix: 'Opening ',
    labelHighlight: TEAM_TOOLS_NAME,
    labelSuffix: '.',
  },
};

export function getTransitionLabel(key: string): TransitionLabelProps {
  if (HUB_TRANSITIONS[key]) return HUB_TRANSITIONS[key];

  const labels: Record<string, string> = {
    map: 'Opening Map',
    'leads-list': 'Loading My Leads',
    'leads-find': 'Opening Find',
    'leads-import': 'Opening Import',
    'leads-eligibility': 'Opening Eligibility',
    'team-members': 'Loading Members',
    'team-commission': 'Loading Commission',
    'team-stats': 'Loading Stats',
    'team-territory': 'Loading Territory',
    settings: 'Opening Settings',
  };

  return { label: labels[key] ?? 'Loading' };
}
