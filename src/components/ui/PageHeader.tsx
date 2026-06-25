import React from 'react';
import { cn } from '../../lib/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  children,
  className,
  sticky = true,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'page-header',
        sticky && 'sticky top-0 z-10',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </header>
  );
}
