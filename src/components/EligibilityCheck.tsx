import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { US_STATES } from '../constants/usStates';
import { getISP, ISP_REGISTRY } from '../constants/isps';
import { useEligibilityJob } from '../hooks/useEligibilityJob';
import { useJobLogs } from '../hooks/useJobLogs';
import { useToast } from '../hooks/useToast';
import { getDownloadUrl, getTowerApiUrl, isTowerConfigured } from '../lib/towerApi';
import type { EligibilityJob, EligibilityCountKey, PhaseStatus, StartEligibilityJobRequest } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { JobTerminal } from './JobTerminal';

function PhaseProgressBar({ progress, status }: { progress: number; status: PhaseStatus }) {
  const pct = Math.min(100, Math.max(0, progress));
  const barColor =
    status === 'failed'
      ? 'bg-red-500'
      : status === 'completed'
        ? 'bg-green-500'
        : 'bg-accent-cyan';

  return (
    <div className="w-full h-2.5 bg-dark-border rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PhaseHeader({
  step,
  title,
  status,
}: {
  step: number;
  title: string;
  status: PhaseStatus;
}) {
  const icon =
    status === 'completed' ? (
      <CheckCircle2 className="w-5 h-5 text-green-400" />
    ) : status === 'running' ? (
      <Loader2 className="w-5 h-5 text-accent-cyan animate-spin" />
    ) : status === 'failed' ? (
      <XCircle className="w-5 h-5 text-red-400" />
    ) : (
      <Circle className="w-5 h-5 text-gray-600" />
    );

  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-dark-hover flex items-center justify-center text-xs font-bold text-gray-400">
        {step}
      </div>
      {icon}
      <h3 className="font-semibold text-white">{title}</h3>
      {status === 'completed' && (
        <span className="text-xs font-medium text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">
          Complete
        </span>
      )}
    </div>
  );
}

function resolveJobFilePaths(job: EligibilityJob) {
  const stem =
    job.zipcheck.outputCsv?.replace(/\.csv$/i, '') ??
    (job.zip ? `zipcheck_${job.zip}` : 'zipcheck');
  const relativeBase = `jobs/${job.jobId}`;

  return {
    inputCsv: job.inputCsvPath ?? `${relativeBase}/${stem}.csv`,
    outputDir: job.qualifierOutputDir ?? `${relativeBase}/${stem}/`,
  };
}

function buildJobRequest(job: EligibilityJob): StartEligibilityJobRequest {
  return {
    isp: job.isp,
    scope: job.scope,
    ...(job.scope === 'zip' ? { zip: job.zip ?? undefined } : { state: job.state ?? undefined }),
  };
}

export function EligibilityCheck() {
  const { showToast } = useToast();
  const { job, isStarting, isPolling, error, startJob, retryQualifier, cancelJob, reset } = useEligibilityJob();
  const logsActive = Boolean(job && (job.status === 'queued' || job.status === 'running'));
  const {
    lines: logLines,
    isPolling: isLogPolling,
    error: logError,
    reset: resetLogs,
  } = useJobLogs(job?.jobId ?? null, logsActive);

  const [selectedIsp, setSelectedIsp] = useState('frontier');
  const [scope, setScope] = useState<'zip' | 'state'>('zip');
  const [zip, setZip] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [retryMode, setRetryMode] = useState<'qualifier' | 'full' | null>(null);

  const ispConfig = getISP(selectedIsp);
  const isRunning = isStarting || isPolling || (job?.status === 'running' || job?.status === 'queued');
  const towerConfigured = isTowerConfigured();
  const jobFilePaths = useMemo(() => (job ? resolveJobFilePaths(job) : null), [job]);

  const canRun = useMemo(() => {
    if (!ispConfig?.enabled || isRunning) return false;
    if (scope === 'zip') return /^\d{5}$/.test(zip.trim());
    return Boolean(selectedState);
  }, [ispConfig?.enabled, isRunning, scope, zip, selectedState]);

  const canRetry = Boolean(
    !isRunning &&
      towerConfigured &&
      job &&
      (job.status === 'failed' || job.status === 'cancelled')
  );

  const canRetryQualifier = Boolean(canRetry && job?.zipcheck.status === 'completed');
  const canRetryFull = canRetry;

  const runPipeline = async (request: StartEligibilityJobRequest) => {
    resetLogs();
    reset();
    await startJob(request);
  };

  const handleRun = async () => {
    if (!canRun) return;

    await runPipeline({
      isp: selectedIsp,
      scope,
      ...(scope === 'zip' ? { zip: zip.trim() } : { state: selectedState }),
    });
  };

  const handleRetryConfirm = async () => {
    if (!job || !retryMode) return;
    setRetryMode(null);

    if (retryMode === 'qualifier') {
      await retryQualifier();
      showToast('Qualifier restarted — zip checker skipped', 'info');
      return;
    }

    await runPipeline(buildJobRequest(job));
    showToast('Full pipeline restarted on the tower', 'info');
  };

  const handleDownload = (key: string, path: string) => {
    const url = getDownloadUrl(path);
    window.open(url, '_blank');
    showToast(`Downloading ${key} results`, 'info');
  };

  const retryTargetLabel = job?.zip
    ? `ZIP ${job.zip}`
    : job?.state
      ? `state ${job.state}`
      : 'this run';

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      <ConfirmDialog
        open={retryMode !== null}
        title={retryMode === 'qualifier' ? 'Retry qualifier only?' : 'Run full pipeline again?'}
        description={
          retryMode === 'qualifier' ? (
            <>
              <p>
                Keeps the successful zip checker result and re-runs{' '}
                <strong className="text-white">only the qualifier</strong> for{' '}
                <strong className="text-accent-cyan">{retryTargetLabel}</strong>.
              </p>
              {jobFilePaths && (
                <p className="mt-2 font-mono text-xs text-accent-cyan/90 break-all">
                  {jobFilePaths.inputCsv}
                </p>
              )}
              <p className="mt-2">
                {job && job.qualifier.current > 0
                  ? `Resumes from address ${job.qualifier.current.toLocaleString()} if the last run got that far.`
                  : 'Zip checker will not run again.'}
              </p>
            </>
          ) : (
            <>
              <p>
                Starts a <strong className="text-white">brand new job</strong> and re-runs zip checker
                + qualifier for <strong className="text-accent-cyan">{retryTargetLabel}</strong>.
              </p>
              <p className="mt-2">
                Use this only if the zip checker failed or you want a fresh address list.
              </p>
            </>
          )
        }
        confirmLabel={retryMode === 'qualifier' ? 'Retry qualifier' : 'Start over'}
        cancelLabel="Not yet"
        variant={retryMode === 'qualifier' ? 'default' : 'danger'}
        onConfirm={handleRetryConfirm}
        onCancel={() => setRetryMode(null)}
      />

      {/* Header */}
      <div className="page-header shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent-cyan" />
          <h1 className="page-title">Eligibility</h1>
        </div>
        <p className="page-subtitle">Run zip checker → qualifier pipeline on the tower</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Tower connection warning */}
        {!towerConfigured && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-amber-300 font-medium text-sm">Tower not connected</p>
            <p className="text-amber-200/70 text-xs mt-1">
              Set <code className="text-amber-200">VITE_TOWER_API_URL</code> in your{' '}
              <code className="text-amber-200">.env</code> file once the tower API is running.
            </p>
          </div>
        )}

        {/* Setup form */}
        <div className="p-4 border-b border-dark-border space-y-4">
          {/* ISP */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              ISP
            </label>
            <select
              value={selectedIsp}
              onChange={(e) => setSelectedIsp(e.target.value)}
              disabled={isRunning}
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3
                       text-white focus:outline-none focus:border-accent-cyan disabled:opacity-50"
            >
              {ISP_REGISTRY.map((isp) => (
                <option key={isp.id} value={isp.id} disabled={!isp.enabled}>
                  {isp.name}{isp.comingSoon ? ' — Coming soon' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Scope tabs */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Run by
            </label>
            <div className="flex gap-2">
              {(['zip', 'state'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  disabled={isRunning}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors
                            ${scope === s
                              ? 'bg-accent-cyan/20 text-accent-cyan'
                              : 'bg-dark-card text-gray-400 hover:text-white'
                            } disabled:opacity-50`}
                >
                  {s === 'zip' ? 'ZIP Code' : 'State'}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          {scope === 'zip' ? (
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="Enter 5-digit ZIP code"
              disabled={isRunning}
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3
                       text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan
                       disabled:opacity-50"
            />
          ) : (
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={isRunning}
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3
                       text-white focus:outline-none focus:border-accent-cyan disabled:opacity-50"
            >
              <option value="">Select State</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleRun}
              disabled={!canRun || !towerConfigured}
              className="flex-1 bg-accent-cyan text-dark-bg font-semibold py-3 rounded-xl
                       hover:bg-accent-cyan/90 active:scale-[0.98] transition-all
                       flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Run Pipeline</span>
                </>
              )}
            </button>

            {canRetryQualifier && (
              <button
                type="button"
                onClick={() => setRetryMode('qualifier')}
                className="px-4 py-3 bg-accent-cyan/15 border border-accent-cyan/30 rounded-xl
                         text-accent-cyan hover:bg-accent-cyan/25 transition-colors flex items-center gap-2
                         text-sm font-medium shrink-0"
                title="Retry qualifier using existing zip checker CSV"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="hidden sm:inline">Retry qualifier</span>
              </button>
            )}

            {canRetryFull && !canRetryQualifier && (
              <button
                type="button"
                onClick={() => setRetryMode('full')}
                className="px-4 py-3 bg-amber-500/15 border border-amber-500/30 rounded-xl
                         text-amber-300 hover:bg-amber-500/25 transition-colors flex items-center gap-2
                         text-sm font-medium shrink-0"
                title="Retry full pipeline"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="hidden sm:inline">Retry</span>
              </button>
            )}

            {job && !isRunning && (
              <button
                onClick={() => {
                  resetLogs();
                  reset();
                }}
                className="px-4 py-3 bg-dark-card border border-dark-border rounded-xl
                         text-gray-400 hover:text-white transition-colors"
                title="Clear results"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}

            {isRunning && job && (
              <button
                onClick={cancelJob}
                className="px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-xl
                         text-red-400 hover:bg-red-500/25 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Pipeline progress */}
        {job && (
          <div className="p-4 space-y-6">
            {/* Job meta */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="bg-dark-card px-2 py-1 rounded-lg">
                Job {job.jobId.slice(0, 8)}…
              </span>
              <span className="bg-dark-card px-2 py-1 rounded-lg capitalize">{job.isp}</span>
              {job.zip && <span className="bg-dark-card px-2 py-1 rounded-lg">ZIP {job.zip}</span>}
              {job.state && !job.zip && (
                <span className="bg-dark-card px-2 py-1 rounded-lg">{job.state}</span>
              )}
              {towerConfigured && (
                <span className="bg-dark-card px-2 py-1 rounded-lg truncate max-w-[200px]">
                  {getTowerApiUrl()}
                </span>
              )}
            </div>

            {jobFilePaths && (
              <section className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent-cyan" />
                  <h3 className="font-semibold text-white text-sm">Tower file paths</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Zip checker writes one CSV per job; the qualifier reads that same file (not a shared
                  bot-folder CSV).
                </p>
                <div className="space-y-2 text-xs">
                  <div className="rounded-xl bg-dark-bg/80 border border-dark-border px-3 py-2">
                    <p className="text-gray-500 uppercase tracking-wide text-[10px] mb-1">
                      Qualifier input (zip checker output)
                    </p>
                    <code className="text-accent-cyan break-all">{jobFilePaths.inputCsv}</code>
                  </div>
                  <div className="rounded-xl bg-dark-bg/80 border border-dark-border px-3 py-2">
                    <p className="text-gray-500 uppercase tracking-wide text-[10px] mb-1">
                      Qualifier output folder (bucket CSVs)
                    </p>
                    <code className="text-gray-300 break-all">{jobFilePaths.outputDir}</code>
                  </div>
                </div>
              </section>
            )}

            {/* Phase 1: Zip Checker */}
            <section className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-3">
              <PhaseHeader step={1} title="Zip Checker" status={job.zipcheck.status} />
              <p className="text-sm text-gray-400">{job.zipcheck.message}</p>
              <PhaseProgressBar progress={job.zipcheck.progress} status={job.zipcheck.status} />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{job.zipcheck.progress}%</span>
                {job.zipcheck.addressCount != null && (
                  <span>{job.zipcheck.addressCount.toLocaleString()} addresses found</span>
                )}
              </div>
              {job.zipcheck.outputCsv && job.zipcheck.status === 'completed' && (
                <p className="text-xs text-green-400/80">
                  Output file: {job.zipcheck.outputCsv}
                </p>
              )}
            </section>

            {/* Phase 2: Qualifier */}
            <section className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-3">
              <PhaseHeader step={2} title="Qualifier" status={job.qualifier.status} />
              <p className="text-sm text-gray-400">{job.qualifier.message}</p>
              <PhaseProgressBar progress={job.qualifier.progress} status={job.qualifier.status} />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{job.qualifier.progress}%</span>
                {job.qualifier.total > 0 && (
                  <span>
                    {job.qualifier.current.toLocaleString()} / {job.qualifier.total.toLocaleString()} addresses
                  </span>
                )}
              </div>

              {/* Live counts — matches frontier_checker53 buckets */}
              {ispConfig && job.qualifier.status !== 'idle' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2">
                  {ispConfig.statusBuckets.map((bucket) => {
                    const count = job.qualifier.counts[bucket.key as EligibilityCountKey] ?? 0;
                    return (
                      <div
                        key={bucket.key}
                        className={`rounded-xl p-3 ${bucket.bgColor} border border-dark-border`}
                      >
                        <p className={`text-2xl font-bold ${bucket.color}`}>
                          {count.toLocaleString()}
                        </p>
                        <p className="text-xs font-medium text-gray-300 mt-0.5">{bucket.label}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <JobTerminal
              lines={logLines}
              isLive={logsActive && isLogPolling}
              error={logError}
            />

            {/* Complete */}
            {job.status === 'completed' && (
              <section className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <h3 className="font-semibold text-green-400 text-lg">Pipeline Complete</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Zip checker and qualifier finished for{' '}
                  {job.zip ? `ZIP ${job.zip}` : `state ${job.state}`}.
                </p>

                {job.downloads && Object.keys(job.downloads).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(job.downloads).map(([key, path]) =>
                      path ? (
                        <button
                          key={key}
                          onClick={() => handleDownload(key, path)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card border border-dark-border
                                   rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {key === 'all' ? 'All Results' : key}
                        </button>
                      ) : null
                    )}
                  </div>
                )}
              </section>
            )}

            {job.status === 'failed' && job.error && (
              <section className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-3">
                <p className="text-red-400 font-medium">Pipeline failed</p>
                <p className="text-sm text-red-300/80 whitespace-pre-wrap">{job.error}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {canRetryQualifier && (
                    <button
                      type="button"
                      onClick={() => setRetryMode('qualifier')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                               bg-accent-cyan/15 border border-accent-cyan/40 text-accent-cyan
                               hover:bg-accent-cyan/25 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry qualifier
                    </button>
                  )}
                  {canRetryFull && (
                    <button
                      type="button"
                      onClick={() => setRetryMode('full')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                               bg-dark-card border border-dark-border text-gray-400
                               hover:text-white hover:border-gray-500 transition-all"
                    >
                      Start over (full pipeline)
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Idle help */}
        {!job && (
          <div className="px-4 py-8 text-center text-gray-500">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-400">Ready to run</p>
            <p className="text-sm mt-2 max-w-sm mx-auto">
              Select an ISP and ZIP or state. The tower will run zip checker first,
              then feed that CSV into the qualifier automatically.
            </p>
            {ispConfig && (
              <div className="mt-6 text-left max-w-sm mx-auto space-y-2">
                <p className="text-xs text-gray-600 uppercase tracking-wide">Output buckets</p>
                {ispConfig.statusBuckets.map((b) => (
                  <div key={b.key} className="flex items-start gap-2 text-xs">
                    <span className={`font-medium ${b.color}`}>{b.label}</span>
                    <span className="text-gray-600">— {b.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
