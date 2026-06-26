import * as React from 'react';
import { cn } from '../../lib/cn';

interface ButtonCtaProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  className?: string;
}

function ButtonCta({ label = 'Get Access', className, children, ...props }: ButtonCtaProps) {
  return (
    <button
      type="button"
      className={cn(
        'group relative inline-flex items-center justify-center w-1/2 h-12 px-4 rounded-full overflow-hidden transition-all duration-500 bg-transparent',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-b from-[#8a5a12] via-[#1a0e02] to-[#5c3500]">
        <div className="absolute inset-0 bg-[#160d01] rounded-full opacity-90" />
      </div>

      <div className="absolute inset-[2px] bg-[#160d01] rounded-full opacity-95" />

      <div className="absolute inset-[2px] bg-gradient-to-r from-[#160d01] via-[#211405] to-[#160d01] rounded-full opacity-90" />
      <div className="absolute inset-[2px] bg-gradient-to-b from-[#8a5a12]/40 via-[#211405] to-[#5c3500]/30 rounded-full opacity-80" />
      <div className="absolute inset-[2px] bg-gradient-to-br from-[#f89406]/10 via-[#211405] to-[#2a1804]/50 rounded-full" />

      <div className="absolute inset-[2px] shadow-[inset_0_0_15px_rgba(248,148,6,0.18)] rounded-full" />

      <div className="relative flex items-center justify-center gap-2">
        <span className="text-lg font-light bg-gradient-to-b from-[#FCD9A8] to-[#F89406] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(248,148,6,0.45)] tracking-tighter">
          {label}
        </span>
        {children}
      </div>

      <div className="absolute inset-[2px] opacity-0 transition-opacity duration-300 bg-gradient-to-r from-[#2a1804]/20 via-[#f89406]/10 to-[#2a1804]/20 group-hover:opacity-100 rounded-full" />
    </button>
  );
}

export { ButtonCta };
