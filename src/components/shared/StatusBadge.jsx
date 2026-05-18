import { Edit2, Lock } from 'lucide-react'

import { STATUS_COLORS } from '@/constants/statusColors'
import { cn } from '@/lib/utils'

export default function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_COLORS[status],
      )}
    >
      {status === 'draft' ? <Edit2 size={10} className="mr-1" /> : null}
      {status === 'approved' ? <Lock size={10} className="mr-1" /> : null}
      {status}
    </span>
  )
}
