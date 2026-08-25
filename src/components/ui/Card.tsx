import React from 'react';
import { cn } from '../../lib/cn';

type CardVariant = 'default' | 'glass' | 'elevated' | 'interactive';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-surface-raised border border-surface-border shadow-panel',
  glass: 'glass-card',
  elevated: 'bg-surface-raised border border-surface-border shadow-card',
  interactive:
    'bg-surface-raised border border-surface-border hover:border-brand-orange/35 hover:bg-dark-hover transition-colors cursor-pointer',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn('rounded-xl', variantClasses[variant], paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}
