import { ChevronDown, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TowerConnectionStatus } from '../hooks/useTowerHealth';

interface TowerStatusBadgeProps {
  status: TowerConnectionStatus;
  towerUrl?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const STATUS_CONFIG: Record<
  Exclude<TowerConnectionStatus, 'unconfigured'>,
  { label: string; className: string; dotClassName: string }
> = {
  checking: {
    label: 'Checking tower…',
    className: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    dotClassName: 'bg-gray-400',
  },
  online: {
    label: 'Tower online',
    className: 'text-green-400 bg-green-500/10 border-green-500/30',
    dotClassName: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]',
  },
  offline: {
    label: 'Tower offline',
    className: 'text-red-400 bg-red-500/10 border-red-500/30',
    dotClassName: 'bg-red-400',
  },
};

function StatusIcon({ status }: { status: Exclude<TowerConnectionStatus, 'unconfigured'> }) {
  if (status === 'checking') {
    return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
  }
  if (status === 'online') {
    return <Wifi className="w-3.5 h-3.5 opacity-80" />;
  }
  return <WifiOff className="w-3.5 h-3.5 opacity-80" />;
}

export function TowerStatusBadge({ status, towerUrl, onRefresh, isRefreshing }: TowerStatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (status !== 'offline') {
      setOpen(false);
    }
  }, [status]);

  if (status === 'unconfigured') return null;

  const config = STATUS_CONFIG[status];
  const badgeContent = (
    <>
      {status === 'checking' ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClassName}`} />
      )}
      <StatusIcon status={status} />
      <span>{config.label}</span>
      {status === 'offline' && (
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      )}
    </>
  );

  return (
    <div ref={rootRef} className="relative shrink-0">
      {status === 'offline' ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${config.className}`}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          {badgeContent}
        </button>
      ) : (
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${config.className}`}
        >
          {badgeContent}
        </span>
      )}

      {open && status === 'offline' && (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 rounded-xl border border-red-500/30
                     bg-dark-card shadow-card p-4 space-y-3"
          role="dialog"
        >
          <div>
            <p className="text-sm font-medium text-red-300">Tower is offline</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              The API URL is set but the tower is not responding. On the tower PC, start the server
              and funnel, then check again.
            </p>
          </div>

          <div className="rounded-lg bg-dark-bg/80 border border-dark-border px-3 py-2 space-y-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Tower commands</p>
            <code className="block text-xs text-gray-300">python main.py</code>
            <code className="block text-xs text-gray-300">tailscale funnel 8787</code>
          </div>

          {towerUrl && (
            <div className="rounded-lg bg-dark-bg/80 border border-dark-border px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">API URL</p>
              <code className="text-xs text-accent-cyan break-all">{towerUrl}</code>
            </div>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={() => {
                void onRefresh();
              }}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                       bg-dark-hover border border-dark-border text-gray-300 hover:text-white
                       transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Check now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
