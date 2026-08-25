import type { ElementType, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface PageHeroProps {
  title: string;
  description: string;
  footline?: string;
  icon?: ElementType;
  summary?: ReactNode;
}

export function PageHero({ title, description, footline, icon: Icon, summary }: PageHeroProps) {
  const iconEl = Icon ? (
    <Icon
      className={cn(
        'pointer-events-none block shrink-0 self-end text-content opacity-40',
        summary ? 'h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24' : 'h-20 w-20 sm:h-28 sm:w-28'
      )}
      strokeWidth={1.25}
      aria-hidden
    />
  ) : null;

  return (
    <div
      className={
        summary
          ? 'flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8'
          : 'flex flex-col'
      }
    >
      <div className="flex min-w-0 flex-1 items-end justify-between gap-4 sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-content-muted">{description}</p>
          <h1
            className="mt-2 break-words font-bold leading-[0.9] tracking-tighter text-content font-display"
            style={{ fontSize: summary ? 'clamp(2.75rem, 10vw, 7rem)' : 'clamp(3rem, 10vw, 8rem)' }}
          >
            {title}
          </h1>
          {footline ? <p className="mt-3 text-sm text-content-muted">{footline}</p> : null}
        </div>
        {iconEl}
      </div>

      {summary ? (
        <div className="relative z-10 w-full shrink-0 sm:max-w-md lg:w-auto xl:max-w-lg">
          {summary}
        </div>
      ) : null}
    </div>
  );
}
