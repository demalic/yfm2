import React from 'react';
import { cn } from '../../lib/cn';

interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  scrollable?: boolean;
}

export function TabBar({ tabs, active, onChange, className, scrollable = false }: TabBarProps) {
  return (
    <div
      className={cn(
        'flex gap-2',
        scrollable && 'overflow-x-auto scroll-hide',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200',
            scrollable ? 'flex-shrink-0' : 'flex-1',
            active === tab.id
              ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/30'
              : 'bg-dark-card text-gray-400 border border-transparent hover:text-white hover:bg-dark-hover'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
