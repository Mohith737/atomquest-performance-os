import { Lock } from 'lucide-react'

import { deriveQuarter } from '@/lib/utils'

import ProgressBar from './ProgressBar'
import StatusBadge from './StatusBadge'

export default function GoalCard({ goal, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all duration-150 hover:border-indigo-200 hover:bg-slate-50"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {deriveQuarter(goal.start_date)} · {goal.weightage}% weight
          </p>
        </div>
        <StatusBadge status={goal.status} />
      </div>
      <ProgressBar value={goal.progress} showLabel />
      {goal.is_locked ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-indigo-700">
          <Lock size={10} /> Goal locked after approval
        </p>
      ) : null}
    </div>
  )
}
