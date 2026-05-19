import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export default function ManagerReviewDialog({ review, onClose, onConfirm, isPending }) {
  const [comment, setComment] = useState('')
  const isReject = review?.action === 'reject'

  useEffect(() => {
    setComment('')
  }, [review?.goal?.id, review?.action])

  function handleConfirm() {
    if (!review) return

    if (isReject && comment.trim().length < 10) {
      toast.error('Rejection comment must be at least 10 characters')
      return
    }

    onConfirm({ goalId: review.goal.id, comment: comment.trim() })
  }

  return (
    <Dialog open={Boolean(review)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-slate-200 bg-white shadow-xl sm:rounded-xl">
        <DialogHeader>
          <DialogTitle>{isReject ? 'Reject goal' : 'Approve goal'}</DialogTitle>
          <DialogDescription>
            {isReject
              ? 'Send the goal back with clear manager guidance.'
              : 'Approve and lock this goal for execution.'}
          </DialogDescription>
        </DialogHeader>

        {review ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{review.goal.title}</p>
            <p className="mt-1 text-sm text-slate-500">{review.goal.owner?.full_name}</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="review-comment">
            Manager comment {isReject ? '' : '(optional)'}
          </label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={isReject ? 'Explain what needs to change before approval.' : 'Add approval context for the audit trail.'}
            className="min-h-28"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={isReject ? 'outline' : 'default'}
            disabled={isPending}
            onClick={handleConfirm}
            className={isReject ? 'border-slate-300 text-slate-700 hover:bg-slate-50' : ''}
          >
            {isPending ? 'Submitting...' : isReject ? 'Reject Goal' : 'Approve & Lock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
