import { cn } from '@/lib/utils'

export default function StatCard({ title, value, trend, trendLabel, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        <Icon size={18} className="text-slate-300" />
      </div>
      <p className="mt-3 text-4xl font-bold tabular-nums text-slate-900">{value}</p>
      {trend ? (
        <p className={cn('mt-2 text-xs', trend > 0 ? 'text-emerald-600' : 'text-red-500')}>
          {trend > 0 ? '?' : '?'} {trendLabel}
        </p>
      ) : null}
    </div>
  )
}
