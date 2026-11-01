import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorMessage({ error, onRetry }) {
  const code = error?.code || 'ERROR';
  const message = error?.message || 'An unexpected problem occurred.';

  return (
    <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-4 sm:p-6 text-slate-200">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {code}
            </span>
            <h4 className="font-semibold text-rose-200 text-sm sm:text-base">Investigation Interrupted</h4>
          </div>
          <p className="text-sm text-slate-300 mb-4">{message}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Action</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

