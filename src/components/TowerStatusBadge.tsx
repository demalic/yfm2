import { ChevronDown, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { TowerConnectionStatus } from '../hooks/useTowerHealth';
import type { TowerHealthResponse } from '../types';

interface TowerStatusBadgeProps {
  status: TowerConnectionStatus;
  towerUrl?: string;
  health?: TowerHealthResponse | null;
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

export function TowerStatusBadge({
  status,
  towerUrl,
  health,
  onRefresh,
  isRefreshing,
}: TowerStatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (status === 'checking') {
      setOpen(false);
    }
  }, [status]);

  if (status === 'unconfigured') return null;

  const config = STATUS_CONFIG[status];
  const isOnline = status === 'online';
  const canOpenMenu = status === 'online' || status === 'offline';

  const badgeContent = (
    <>
      {status === 'checking' ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClassName}`} />
      )}
      <StatusIcon status={status} />
      <span>{config.label}</span>
      {canOpenMenu && (
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      )}
    </>
  );

  const handleRefreshClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (onRefresh) {
      void onRefresh();
    }
  };

  return (
    <div ref={rootRef} className="relative shrink-0 z-[120]">
      {canOpenMenu ? (
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

      {open && canOpenMenu && (
        <>
          <button
            type="button"
            aria-label="Close tower menu"
            className="fixed inset-0 z-[130] cursor-default bg-black/50"
            onClick={() => setOpen(false)}
          />

          <div
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[140] w-80 rounded-xl border shadow-2xl p-4 space-y-3
                       bg-[#12151c] border-dark-border"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div>
              <p className={`text-sm font-medium ${isOnline ? 'text-green-300' : 'text-red-300'}`}>
                {isOnline ? 'Tower is connected' : 'Tower is offline'}
              </p>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                {isOnline
                  ? 'The site can reach your tower API. Use Check now after restarting the tower or funnel.'
                  : 'The API URL is set but the tower is not responding. Start the server and funnel on the tower PC.'}
              </p>
            </div>

            {isOnline && health && (
              <div className="rounded-lg bg-[#0d1017] border border-dark-border px-3 py-2 space-y-1.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Tower status</p>
                {typeof health.pendingQualifierCount === 'number' && (
                  <p className="text-xs text-gray-200">
                    Pending qualifiers:{' '}
                    <span className="text-accent-cyan font-medium">{health.pendingQualifierCount}</span>
                  </p>
                )}
                {typeof health.jobFolderCount === 'number' && (
                  <p className="text-xs text-gray-200">
                    Job folders:{' '}
                    <span className="text-white font-medium">{health.jobFolderCount}</span>
                  </p>
                )}
                {health.jobsDir && (
                  <code className="block text-[11px] text-gray-400 break-all">{health.jobsDir}</code>
                )}
              </div>
            )}

            <div className="rounded-lg bg-[#0d1017] border border-dark-border px-3 py-2 space-y-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Tower commands</p>
              <code className="block text-xs text-gray-200">python main.py</code>
              <code className="block text-xs text-gray-200">tailscale funnel 8787</code>
            </div>

            {towerUrl && (
              <div className="rounded-lg bg-[#0d1017] border border-dark-border px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">API URL</p>
                <code className="text-xs text-accent-cyan break-all">{towerUrl}</code>
              </div>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold
                         bg-accent-cyan text-white hover:bg-accent-cyan/90
                         transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Check now
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
