import React from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: boolean;
}

export function Input({ icon, error, className, ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        className={cn(
          'input-yfm',
          icon && 'pl-12',
          error && 'border-red-500/50 focus:border-red-400 focus:shadow-none',
          className
        )}
        {...props}
      />
    </div>
  );
}
