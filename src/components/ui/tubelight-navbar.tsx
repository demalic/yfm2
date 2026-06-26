import { useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface TubelightNavItem {
  name: string;
  icon: LucideIcon;
}

type NavBarSize = 'md' | 'lg';

const SIZE_STYLES: Record<NavBarSize, { container: string; tab: string; icon: number; gap: string }> = {
  md: { container: 'gap-1 py-1 px-1', tab: 'gap-1.5 text-xs px-4 py-1.5', icon: 15, gap: 'gap-1.5' },
  lg: { container: 'gap-2 py-1.5 px-1.5', tab: 'gap-2 text-base px-7 py-3', icon: 22, gap: 'gap-2' },
};

interface NavBarProps {
  items: TubelightNavItem[];
  className?: string;
  size?: NavBarSize;
  /** Controlled active item name. Falls back to internal state when omitted. */
  activeTab?: string;
  onTabChange?: (name: string) => void;
}

export function NavBar({ items, className, size = 'md', activeTab, onTabChange }: NavBarProps) {
  const [internalActive, setInternalActive] = useState(items[0]?.name ?? '');
  const active = activeTab ?? internalActive;
  const sizing = SIZE_STYLES[size];

  const handleSelect = (name: string) => {
    if (onTabChange) onTabChange(name);
    else setInternalActive(name);
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'flex items-center bg-white/[0.04] border border-white/[0.08] backdrop-blur-lg rounded-full shadow-lg',
          sizing.container
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.name;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => handleSelect(item.name)}
              aria-pressed={isActive}
              className={cn(
                'relative cursor-pointer flex items-center font-semibold rounded-full transition-colors',
                sizing.tab,
                'text-gray-400 hover:text-white',
                isActive && 'text-white'
              )}
            >
              <Icon size={sizing.icon} strokeWidth={2.5} />
              <span className="hidden sm:inline">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="tubelight-lamp"
                  className="absolute inset-0 w-full bg-brand-orange/10 rounded-full -z-10"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-orange rounded-t-full">
                    <div className="absolute w-12 h-6 bg-brand-orange/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-brand-orange/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-brand-orange/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
