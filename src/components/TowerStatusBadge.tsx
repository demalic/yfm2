import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import type { TowerConnectionStatus } from '../hooks/useTowerHealth';

interface TowerStatusBadgeProps {
  status: TowerConnectionStatus;
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

export function TowerStatusBadge({ status, onRefresh, isRefreshing }: TowerStatusBadgeProps) {
  if (status === 'unconfigured') return null;

  const config = STATUS_CONFIG[status];
  const Icon = status === 'online' ? Wifi : status === 'offline' ? WifiOff : Loader2;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${config.className}`}
      >
        {status === 'checking' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <span className={`w-2 h-2 rounded-full ${config.dotClassName}`} />
        )}
        <Icon className="w-3.5 h-3.5 opacity-80" />
        {config.label}
      </span>
      {onRefresh && status !== 'checking' && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-dark-hover transition-colors disabled:opacity-50"
          title="Check tower now"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
