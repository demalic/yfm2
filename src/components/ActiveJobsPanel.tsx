import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, PlayCircle } from 'lucide-react';
import { getISP } from '../constants/isps';
import type { EligibilityJob } from '../types';
import { ProgressiveFluxLoader } from '@/components/ui/progressive-flux-loader';

interface ActiveJobsPanelProps {
  jobs: EligibilityJob[];
  isLoading: boolean;
  error: string | null;
  supported: boolean;
  towerOnline: boolean;
  selectedJobId: string | null;
  onOpenJob: (jobId: string) => void;
}

function formatJobTarget(job: EligibilityJob): string {
  if (job.zip) return `ZIP ${job.zip}`;
  if (job.state) return job.state;
  return job.scope === 'state' ? 'State run' : 'Pipeline run';
}

function getActivePhase(job: EligibilityJob): { label: string; progress: number; detail: string } {
  if (job.zipcheck.status === 'running' || job.zipcheck.status === 'queued') {
    return {
      label: 'Zip checker',
      progress: job.zipcheck.progress,
      detail: job.zipcheck.message || 'Scanning addresses…',
    };
  }

  if (job.qualifier.status === 'running' || job.qualifier.status === 'queued') {
    const detail =
      job.qualifier.total > 0
        ? `${job.qualifier.current.toLocaleString()} / ${job.qualifier.total.toLocaleString()} addresses`
        : job.qualifier.message || 'Checking addresses…';
    return {
      label: 'Qualifier',
      progress: job.qualifier.progress,
      detail,
    };
  }

  if (job.status === 'queued') {
    return { label: 'Queued', progress: 0, detail: 'Waiting to start…' };
  }

  return { label: 'Running', progress: 0, detail: job.status };
}

function ActiveJobRow({
  job,
  expanded,
  selected,
  onToggle,
  onOpen,
}: {
  job: EligibilityJob;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const phase = getActivePhase(job);
  const isp = getISP(job.isp);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        selected ? 'border-accent-cyan/50 bg-accent-cyan/5' : 'border-dark-border bg-dark-bg/60'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 text-left flex items-center gap-3"
      >
        <div className="shrink-0">
          {job.status === 'queued' ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <PlayCircle className="w-4 h-4 text-accent-cyan" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-white">{formatJobTarget(job)}</span>
            <span className="text-xs text-gray-500 capitalize">{job.isp}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-dark-card text-gray-400">
              {phase.label}
            </span>
            <span className="text-xs text-gray-500 font-mono">{job.jobId.slice(0, 8)}…</span>
          </div>

          <ProgressiveFluxLoader
            value={phase.progress}
            showLabel={false}
            className="max-w-none gap-0"
            barClassName="h-1.5 bg-dark-border"
          />

          <div className="flex justify-between gap-2 text-xs text-gray-500">
            <span className="truncate">{phase.detail}</span>
            <span className="shrink-0">{phase.progress}%</span>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-dark-border/60">
          <div className="grid sm:grid-cols-2 gap-3 pt-3">
            <div className="rounded-lg bg-dark-card border border-dark-border px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Zip checker</p>
              <p className="text-sm text-gray-300 capitalize">{job.zipcheck.status}</p>
              <p className="text-xs text-gray-500 mt-1">{job.zipcheck.progress}%</p>
              {job.zipcheck.addressCount != null && (
                <p className="text-xs text-gray-500">
                  {job.zipcheck.addressCount.toLocaleString()} addresses
                </p>
              )}
            </div>

            <div className="rounded-lg bg-dark-card border border-dark-border px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Qualifier</p>
              <p className="text-sm text-gray-300 capitalize">{job.qualifier.status}</p>
              <p className="text-xs text-gray-500 mt-1">{job.qualifier.progress}%</p>
              {job.qualifier.total > 0 && (
                <p className="text-xs text-gray-500">
                  {job.qualifier.current.toLocaleString()} / {job.qualifier.total.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {isp && job.qualifier.status !== 'idle' && (
            <div className="flex flex-wrap gap-2">
              {isp.statusBuckets.slice(0, 4).map((bucket) => {
                const count = job.qualifier.counts[bucket.key] ?? 0;
                return (
                  <div
                    key={bucket.key}
                    className="rounded-lg px-2.5 py-1.5 bg-dark-card border border-dark-border text-xs"
                  >
                    <span className={bucket.color}>{count.toLocaleString()}</span>
                    <span className="text-gray-500 ml-1.5">{bucket.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={onOpen}
            className="text-sm font-medium text-accent-cyan hover:text-accent-cyan/80 transition-colors"
          >
            Open full view →
          </button>
        </div>
      )}
    </div>
  );
}

export function ActiveJobsPanel({
  jobs,
  isLoading,
  error,
  supported,
  towerOnline,
  selectedJobId,
  onOpenJob,
}: ActiveJobsPanelProps) {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  return (
    <section className="px-4 pb-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-white text-sm">In progress</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live runs on the tower — click a row to expand
            </p>
          </div>
          {jobs.length > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-accent-cyan/10 text-accent-cyan">
              {jobs.length} active
            </span>
          )}
        </div>

        {!towerOnline && (
          <p className="text-xs text-amber-300">Tower offline — reconnect to see active runs.</p>
        )}

        {towerOnline && !supported && (
          <p className="text-xs text-amber-300">
            Update tower-server on the tower PC to list active runs here.
          </p>
        )}

        {error && towerOnline && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        {towerOnline && supported && isLoading && jobs.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading active runs…
          </div>
        )}

        {towerOnline && supported && !isLoading && jobs.length === 0 && !error && (
          <p className="text-xs text-gray-500 py-2">No runs in progress.</p>
        )}

        {jobs.length > 0 && (
          <div className="space-y-2">
            {jobs.map((activeJob) => (
              <ActiveJobRow
                key={activeJob.jobId}
                job={activeJob}
                expanded={expandedJobId === activeJob.jobId}
                selected={selectedJobId === activeJob.jobId}
                onToggle={() =>
                  setExpandedJobId((current) =>
                    current === activeJob.jobId ? null : activeJob.jobId
                  )
                }
                onOpen={() => onOpenJob(activeJob.jobId)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
