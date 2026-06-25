import yfmLogoPrimary from '../assets/yfm-logo.png';
import yfmLogoBrand from '../assets/yfm-logo-brand.png';
import yfmLogoScriptWhite from '../assets/yfm-logo-script-white.png';
import yfmLogoScriptBlack from '../assets/yfm-logo-script-black.jpg';
import yfmLogoLightBg from '../assets/yfm-logo-light-bg.jpg';
import { cn } from '../lib/cn';

export type YfmLogoVariant =
  | 'primary'
  | 'brand'
  | 'script-white'
  | 'script-black'
  | 'light-bg';

const logoSources: Record<YfmLogoVariant, string> = {
  primary: yfmLogoPrimary,
  brand: yfmLogoBrand,
  'script-white': yfmLogoScriptWhite,
  'script-black': yfmLogoScriptBlack,
  'light-bg': yfmLogoLightBg,
};

interface YfmLogoProps {
  variant?: YfmLogoVariant;
  className?: string;
  alt?: string;
}

export function YfmLogo({
  variant = 'script-white',
  className,
  alt = 'YFM — Your Future Matters',
}: YfmLogoProps) {
  return (
    <img
      src={logoSources[variant]}
      alt={alt}
      className={cn('block max-w-full object-contain select-none', className)}
      draggable={false}
    />
  );
}

/** Compact script mark for nav bars */
export function YfmLogoMark({ className }: { className?: string }) {
  return (
    <YfmLogo
      variant="script-white"
      alt="YFM"
      className={cn('h-9 sm:h-10 w-auto', className)}
    />
  );
}

/** Full-screen loading splash — old block logo, no drop shadow */
export function YfmLogoSplash({ className }: { className?: string }) {
  return (
    <YfmLogo
      variant="primary"
      alt="YFM"
      className={cn(
        'w-[min(78vw,26rem)] sm:w-[min(70vw,30rem)] h-auto',
        className
      )}
    />
  );
}

/** Login page header — script logo, no underglow */
export function YfmLogoLogin({ className }: { className?: string }) {
  return (
    <YfmLogo
      variant="script-white"
      alt="YFM"
      className={cn(
        'mx-auto w-[min(82vw,15rem)] sm:w-[min(72vw,17rem)] h-auto',
        className
      )}
    />
  );
}

/** Taglines below sign-in card — side by side */
export function YfmLogoTagline({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-row flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2',
        className
      )}
    >
      <p className="text-white/75 text-sm italic tracking-wide font-serif whitespace-nowrap">
        Your Future Matters
      </p>
      <span className="hidden sm:inline text-white/25" aria-hidden>
        |
      </span>
      <p className="text-brand-gradient text-[10px] sm:text-xs tracking-[0.28em] uppercase font-bold whitespace-nowrap">
        Field Sales Platform
      </p>
    </div>
  );
}
