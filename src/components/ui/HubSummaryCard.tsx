import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface HubSummaryCardProps {
  headline: string;
  subline: string;
  featureIcon: LucideIcon;
  featureText: string;
  actionLabel: string;
  onAction: () => void;
  bars?: number[];
}

export function HubSummaryCard({
  headline,
  subline,
  featureIcon: FeatureIcon,
  featureText,
  actionLabel,
  onAction,
  bars = [0.2, 0.35, 0.5, 0.7, 0.55, 0.8, 0.65, 0.9, 0.75, 0.6, 0.85, 0.7],
}: HubSummaryCardProps) {
  return (
    <div className="crm-summary-card">
      <div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-content">{headline}</h2>
        <p className="text-content-muted mt-1">{subline}</p>
      </div>

      <div className="flex h-16 w-full items-end gap-[2px]" aria-hidden>
        {bars.map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-t-full bg-brand-orange"
            style={{ height: `${Math.max(height * 100, 8)}%` }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-content-muted">
        <FeatureIcon className="w-4 h-4 text-brand-orange" aria-hidden />
        <span>{featureText}</span>
      </div>

      <Button fullWidth size="lg" onClick={onAction} className="rounded-xl">
        {actionLabel}
        <ArrowRight className="w-5 h-5" aria-hidden />
      </Button>
    </div>
  );
}
