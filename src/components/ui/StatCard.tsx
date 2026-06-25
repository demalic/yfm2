import React from 'react';
import { cn } from '../../lib/cn';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  iconBg?: string;
  className?: string;
}

export function StatCard({ label, value, icon, iconBg, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-brand-orange/[0.04] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: iconBg || 'rgba(248, 148, 6, 0.15)' }}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
    </Card>
  );
}
