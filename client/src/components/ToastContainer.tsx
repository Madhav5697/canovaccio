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
              ? 'bg-gray-900/90 border-blue-500/40 text-blue-400'
              : toast.type === 'warning'
              ? 'bg-gray-900/90 border-yellow-500/40 text-yellow-400'
              : 'bg-gray-900/90 border-green-500/40 text-green-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
