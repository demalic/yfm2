import { useEffect, useRef, useState } from 'react';
import { OpeningBackdrop } from '../OpeningBackdrop';
import { TableBackdrop } from '../TableBackdrop';
import { YfmLogoMark } from '../YfmLogo';
import { BoxLoader } from './box-loader';
import {
  TableTransitionLabel,
  type TransitionLabelProps,
} from './table-transition-label';
import { cn } from '../../lib/cn';

const OPENING_STATUS_LINES = [
  'Preparing your workspace',
  'Loading tools',
  'Syncing data',
  'Almost ready',
];

/** Minimum display time for table loading screens */
export const TABLE_LOAD_MIN_MS = 2000;

interface ViewTransitionScreenProps extends TransitionLabelProps {
  className?: string;
  /** Opening = splash/sign-in continuity; table = in-app table loads */
  variant?: 'opening' | 'table';
}

export function ViewTransitionScreen({
  label,
  labelPrefix,
  labelHighlight,
  labelSuffix,
  className,
  variant = 'table',
}: ViewTransitionScreenProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const isOpening = variant === 'opening';

  useEffect(() => {
    if (!isOpening) return;
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % OPENING_STATUS_LINES.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, [isOpening]);

  return (
    <div
      className={cn(
        'h-full auth-screen relative overflow-hidden view-transition-screen',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {isOpening ? <OpeningBackdrop /> : <TableBackdrop />}

      <div className="relative z-10 h-full w-full view-transition-content">
        {isOpening ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <YfmLogoMark className="h-11 sm:h-12 w-auto mb-8 view-transition-logo" />
            <p className="text-lg sm:text-xl font-semibold text-white tracking-tight text-center">
              {label ?? 'Loading'}
            </p>
            <p
              key={lineIndex}
              className="mt-2 text-sm text-gray-400 font-medium text-center view-transition-status"
            >
              {OPENING_STATUS_LINES[lineIndex]}
            </p>
          </div>
        ) : (
          <>
            <TableTransitionLabel
              label={label}
              labelPrefix={labelPrefix}
              labelHighlight={labelHighlight}
              labelSuffix={labelSuffix}
              className="table-transition-label text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-center px-6"
            />
            <div className="table-transition-loader">
              <BoxLoader />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Keep overlay visible for at least `minMs` so fast loads still feel intentional. */
export function useMinTransitionOverlay(isPending: boolean, minMs = 480) {
  const [show, setShow] = useState(false);
  const startRef = useRef(0);

  useEffect(() => {
    if (isPending) {
      startRef.current = Date.now();
      setShow(true);
      return;
    }

    const remaining = Math.max(0, minMs - (Date.now() - startRef.current));
    const id = window.setTimeout(() => setShow(false), remaining);
    return () => window.clearTimeout(id);
  }, [isPending, minMs]);

  return show;
}
