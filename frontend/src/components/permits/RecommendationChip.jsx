import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

// ─── RecommendationChip ───────────────────────────────────────────────────────
// Displays an AI recommendation pill with appropriate color and icon.

const CONFIG = {
  approve: {
    bg: 'bg-emerald-950',
    text: 'text-emerald-400',
    border: 'border-emerald-800',
    Icon: CheckCircle2,
    label: 'APPROVE',
    flash: '',
  },
  approve_with_conditions: {
    bg: 'bg-amber-950',
    text: 'text-amber-400',
    border: 'border-amber-800',
    Icon: AlertCircle,
    label: 'CONDITIONS',
    flash: '',
  },
  deny: {
    bg: 'bg-red-950',
    text: 'text-red-400',
    border: 'border-red-800',
    Icon: XCircle,
    label: 'DENY',
    flash: 'flash-critical',
  },
}

export default function RecommendationChip({ recommendation }) {
  const cfg = CONFIG[recommendation]

  if (!cfg) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        PENDING
      </span>
    )
  }

  const { bg, text, border, Icon, label, flash } = cfg

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium border ${bg} ${text} ${border} ${flash}`}
    >
      <Icon size={12} />
      {label}
    </span>
  )
}
