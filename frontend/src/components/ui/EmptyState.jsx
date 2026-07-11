// ─── EmptyState ───────────────────────────────────────────────────────────────
// Centered placeholder displayed when a list or panel has no data to show.
// Props:
//   icon       — Lucide component (rendered at 32px)
//   message    — string  primary message
//   submessage — string  (optional) secondary hint text

export default function EmptyState({ icon: Icon, message, submessage }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      {Icon && (
        <Icon className="h-8 w-8 text-slate-600" strokeWidth={1.5} />
      )}
      {message && (
        <p className="text-sm text-slate-500">{message}</p>
      )}
      {submessage && (
        <p className="text-xs text-slate-600">{submessage}</p>
      )}
    </div>
  );
}
