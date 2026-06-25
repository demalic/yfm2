import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/cn';

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title: string;
  description?: string;
  className?: string;
}

const config: Record<
  AlertVariant,
  { icon: React.ReactNode; classes: string }
> = {
  error: {
    icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    classes: 'bg-red-500/10 border-red-500/25 text-red-400',
  },
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-brand-orange shrink-0" />,
    classes: 'bg-brand-orange/10 border-brand-orange/25 text-brand-orange',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-brand-orange-bright shrink-0" />,
    classes: 'bg-brand-orange/10 border-brand-orange/25 text-brand-orange-bright',
  },
  info: {
    icon: <Info className="w-5 h-5 text-white shrink-0" />,
    classes: 'bg-white/5 border-white/15 text-white',
  },
};

export function Alert({ variant = 'info', title, description, className }: AlertProps) {
  const { icon, classes } = config[variant];

  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-2xl border px-4 py-3', classes, className)}
    >
      {icon}
      <div>
        <p className="font-semibold text-sm">{title}</p>
        {description && (
          <p className="text-xs mt-1 leading-relaxed opacity-80">{description}</p>
        )}
      </div>
    </div>
  );
}
