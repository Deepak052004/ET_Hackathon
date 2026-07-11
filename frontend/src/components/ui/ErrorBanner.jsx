import { AlertTriangle, RotateCcw } from 'lucide-react';

// ─── ErrorBanner ──────────────────────────────────────────────────────────────
// Red-tinted notification strip for surfacing fetch / API errors.
// Props:
//   message  — string error message to display
//   onRetry  — function (optional) — renders a retry button when provided
//   compact  — bool (default false) — tighter padding for inline use

export default function ErrorBanner({ message, onRetry, compact = false }) {
  return (
    <div
      className={`flex items-start gap-3 bg-red-950/50 border border-red-900 text-red-400 rounded-sm ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      }`}
      role="alert"
    >
      {/* Icon */}
      <AlertTriangle className={`flex-shrink-0 ${compact ? 'h-3.5 w-3.5 mt-0.5' : 'h-4 w-4 mt-0.5'}`} />

      {/* Message */}
      <p className={`flex-1 ${compact ? 'text-xs' : 'text-sm'} leading-snug`}>
        {message || 'An unexpected error occurred.'}
      </p>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 flex-shrink-0 text-red-400 hover:text-red-300 transition-colors duration-150 text-xs font-medium border border-red-800 hover:border-red-700 rounded-sm px-2 py-0.5"
        >
          <RotateCcw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  );
}
