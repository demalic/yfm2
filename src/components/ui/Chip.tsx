import React from 'react';
import { cn } from '../../lib/cn';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  color?: string;
}

export function Chip({ active, color, className, children, style, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
        'border transition-all duration-200 shrink-0',
        active
          ? 'bg-brand-orange/15 border-brand-orange/40 text-brand-orange-bright'
          : 'bg-dark-card border-dark-border text-gray-400 hover:text-white hover:border-dark-hover',
        className
      )}
      style={
        active && color
          ? {
              backgroundColor: `${color}20`,
              borderColor: `${color}50`,
              color,
              ...style,
            }
          : style
      }
      {...props}
    >
      {children}
    </button>
  );
}
