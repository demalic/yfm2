import React from 'react';
import { useToast } from '../hooks/useToast';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 flex flex-col items-center gap-2 z-50 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg max-w-sm w-full md:w-auto
                    toast-enter ${toast.type === 'error' ? 'bg-red-500/90 text-white' :
                                toast.type === 'success' ? 'bg-green-500/90 text-white' :
                                'bg-dark-card text-white border border-dark-border'
                    }`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.type === 'success' && <Check className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <X className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
