import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface StaggeredDropdownItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect?: () => void;
}

interface StaggeredDropdownProps {
  label: string;
  triggerIcon?: LucideIcon;
  items: StaggeredDropdownItem[];
  activeId?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

const wrapperVariants: Variants = {
  open: {
    scaleY: 1,
    transition: { when: 'beforeChildren', staggerChildren: 0.08 },
  },
  closed: {
    scaleY: 0,
    transition: { when: 'afterChildren', staggerChildren: 0.08 },
  },
};

const iconVariants: Variants = {
  open: { rotate: 180 },
  closed: { rotate: 0 },
};

const itemVariants: Variants = {
  open: { opacity: 1, y: 0, transition: { when: 'beforeChildren' } },
  closed: { opacity: 0, y: -15, transition: { when: 'afterChildren' } },
};

const actionIconVariants: Variants = {
  open: { scale: 1, y: 0 },
  closed: { scale: 0, y: -7 },
};

const ALIGN: Record<NonNullable<StaggeredDropdownProps['align']>, string> = {
  left: 'left-0 origin-top-left',
  right: 'right-0 origin-top-right',
  center: 'left-1/2 origin-top',
};

export function StaggeredDropdown({
  label,
  triggerIcon: TriggerIcon,
  items,
  activeId,
  align = 'left',
  className,
}: StaggeredDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div animate={open ? 'open' : 'closed'} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((pv) => !pv)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-white bg-dark-card/95 backdrop-blur-md border border-white/10 shadow-lg hover:bg-dark-hover transition-colors"
      >
        {TriggerIcon && <TriggerIcon className="w-4 h-4 text-brand-orange" />}
        <span className="font-semibold text-sm">{label}</span>
        <motion.span variants={iconVariants}>
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <motion.ul
        initial={wrapperVariants.closed}
        variants={wrapperVariants}
        style={align === 'center' ? { translateX: '-50%' } : undefined}
        className={cn(
          'absolute top-[120%] z-[1000] flex w-44 flex-col gap-1 overflow-hidden rounded-xl border border-white/10 bg-dark-card/95 p-2 shadow-xl backdrop-blur-md',
          ALIGN[align]
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <motion.li
              key={item.id}
              variants={itemVariants}
              onClick={() => {
                item.onSelect?.();
                setOpen(false);
              }}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg p-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-orange/15 text-brand-orange'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <motion.span variants={actionIconVariants}>
                <Icon className="w-4 h-4" />
              </motion.span>
              <span>{item.label}</span>
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.div>
  );
}

export default StaggeredDropdown;
