import React from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-orange text-white font-bold shadow-glow-sm hover:bg-brand-orange-bright hover:shadow-glow active:scale-[0.98]',
  secondary:
    'bg-dark-elevated text-white border border-dark-border hover:bg-dark-hover hover:border-brand-orange/40',
  ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
  danger:
    'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
  outline:
    'bg-transparent text-brand-orange border border-brand-orange/50 hover:bg-brand-orange/10',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-4 text-base rounded-2xl gap-2',
  icon: 'p-2.5 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
