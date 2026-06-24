import { useToast } from '../hooks/useToast';
import { Check, X, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 flex flex-col items-center gap-2 z-[100] pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl max-w-sm w-full md:w-auto
                    toast-enter backdrop-blur-md border
                    ${toast.type === 'error'
                      ? 'bg-red-950/90 text-red-100 border-red-500/30 shadow-lg shadow-red-900/20'
                      : toast.type === 'success'
                        ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/30 shadow-lg shadow-emerald-900/20'
                        : 'bg-dark-card/95 text-white border-dark-border shadow-card'
                    }`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.type === 'success' && <Check className="w-5 h-5 flex-shrink-0 text-emerald-400" />}
          {toast.type === 'error' && <X className="w-5 h-5 flex-shrink-0 text-red-400" />}
          {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 text-accent-cyan" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
