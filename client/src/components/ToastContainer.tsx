import React from 'react';
import { ToastNotification } from '../types';

interface ToastContainerProps {
  toasts: ToastNotification[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl backdrop-blur-md animate-slide-up pointer-events-auto ${
            toast.type === 'info'
              ? 'bg-zinc-900/90 border-zinc-600/60 text-zinc-200'
              : toast.type === 'warning'
              ? 'bg-zinc-900/90 border-amber-500/40 text-amber-400'
              : 'bg-zinc-900/90 border-emerald-500/40 text-emerald-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
