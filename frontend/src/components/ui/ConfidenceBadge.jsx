// ─── ConfidenceBadge ─────────────────────────────────────────────────────────
// Displays a RAG confidence / relevance score as a color-coded pill.

export default function ConfidenceBadge({ score }) {
  if (score === undefined || score === null) return null;

  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? 'text-emerald-400 bg-emerald-950 border-emerald-800' :
    pct >= 50 ? 'text-amber-400 bg-amber-950 border-amber-800' :
                'text-slate-400 bg-slate-800 border-slate-600';

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-mono border ${color}`}>
      {pct}%
    </span>
  );
}
