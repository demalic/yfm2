import React from 'react';
import { cn } from '../../lib/cn';

type CardVariant = 'default' | 'glass' | 'elevated' | 'interactive';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-dark-card border border-dark-border',
  glass: 'glass-card',
  elevated: 'bg-dark-elevated border border-white/[0.08] shadow-card',
  interactive:
    'bg-dark-card border border-dark-border hover:border-brand-orange/30 hover:bg-dark-hover transition-colors cursor-pointer',
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
      className={cn('rounded-2xl', variantClasses[variant], paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}
