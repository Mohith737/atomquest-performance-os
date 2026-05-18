import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function ErrorState({ message = 'Failed to load', onRetry }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <AlertTriangle size={40} className="mb-4 text-red-300" />
      <h3 className="text-base font-semibold text-slate-700">Failed to load</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  )
}
