import { AlertTriangle, Sparkles, X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onCancel}
        aria-label="Close dialog"
      />

      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/10
                   shadow-[0_0_60px_rgba(249,115,22,0.15),0_24px_48px_rgba(0,0,0,0.5)]
                   animate-[dialogPop_0.25s_cubic-bezier(0.16,1,0.3,1)_forwards]"
      >
        <div
          className={`absolute inset-x-0 top-0 h-1 ${
            isDanger
              ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500'
              : 'bg-gradient-to-r from-brand-orange via-brand-orange-bright to-brand-orange'
          }`}
        />

        <div className="glass-card rounded-none border-0 p-6">
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white
                     hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4 pr-8">
            <div
              className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                isDanger
                  ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30'
                  : 'bg-accent-cyan/15 text-accent-cyan ring-1 ring-accent-cyan/30'
              }`}
            >
              {isDanger ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
            </div>

            <div className="min-w-0">
              <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
                {title}
              </h2>
              <div className="mt-2 text-sm text-gray-400 leading-relaxed">{description}</div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-dark-border bg-dark-bg/60
                       text-gray-300 font-medium hover:text-white hover:border-gray-500
                       transition-all active:scale-[0.98]"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all active:scale-[0.98]
                ${
                  isDanger
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:opacity-90 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                    : 'bg-brand-orange text-white hover:bg-brand-orange-bright shadow-glow-sm'
                }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
