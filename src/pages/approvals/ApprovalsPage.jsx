import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCircle2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { approveGoal, getPendingApprovals, rejectGoal } from '@/api/approvals'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import StatusBadge from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { QUERY_KEYS } from '@/constants/queryKeys'

function ApprovalSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-44 rounded-lg" />
      ))}
    </div>
  )
}

function RejectDialog({ goal, comment, setComment, onClose, onConfirm, isPending }) {
  const canConfirm = comment.trim().length >= 10

  return (
    <Dialog open={Boolean(goal)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-slate-200 bg-white sm:rounded-xl">
        <DialogHeader>
          <DialogTitle>Reject goal</DialogTitle>
          <DialogDescription>Add specific guidance before returning this goal to the employee.</DialogDescription>
        </DialogHeader>
        {goal ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
            <p className="mt-1 text-sm text-slate-500">{goal.owner?.full_name}</p>
          </div>
        ) : null}
        <div className="space-y-2">
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Explain what needs to change before approval."
            className="min-h-28"
          />
          <p className="text-xs text-slate-500">Minimum 10 characters required.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!canConfirm || isPending} onClick={onConfirm}>
            {isPending ? 'Rejecting...' : 'Reject Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ApprovalCard({ goal, onApprove, onReject, isMutating }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-900">{goal.title}</h2>
        <StatusBadge status={goal.status} />
      </div>
      <p className="text-sm font-medium text-slate-500">
        {goal.owner?.full_name || 'Employee'} · {goal.quarter} · {Number(goal.weightage)}%
      </p>
      <p className="line-clamp-2 text-sm leading-6 text-slate-600">{goal.description}</p>
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-3">
        <Button disabled={isMutating} onClick={() => onApprove(goal)}>
          <Check className="h-4 w-4" />
          Approve
        </Button>
        <Button variant="destructive" disabled={isMutating} onClick={() => onReject(goal)}>
          <X className="h-4 w-4" />
          Reject
        </Button>
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const queryClient = useQueryClient()
  const [rejectGoalState, setRejectGoalState] = useState(null)
  const [rejectComment, setRejectComment] = useState('')
  const pendingQuery = useQuery({ queryKey: QUERY_KEYS.PENDING_APPROVALS, queryFn: getPendingApprovals })

  const approveMutation = useMutation({
    mutationFn: (goalId) => approveGoal(goalId),
    onSuccess: (_, goalId) => {
      toast.success('Goal approved')
      queryClient.setQueryData(QUERY_KEYS.PENDING_APPROVALS, (current = []) =>
        current.filter((goal) => goal.id !== goalId),
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_APPROVALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: () => toast.error('Unable to approve goal'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ goalId, comment }) => rejectGoal(goalId, comment),
    onSuccess: (_, variables) => {
      toast.success('Goal rejected')
      setRejectGoalState(null)
      setRejectComment('')
      queryClient.setQueryData(QUERY_KEYS.PENDING_APPROVALS, (current = []) =>
        current.filter((goal) => goal.id !== variables.goalId),
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_APPROVALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: (error) => toast.error(error.response?.data?.comment?.[0] || 'Unable to reject goal'),
  })

  const pendingGoals = pendingQuery.data ?? []
  const isMutating = approveMutation.isPending || rejectMutation.isPending

  function openReject(goal) {
    setRejectGoalState(goal)
    setRejectComment('')
  }

  function confirmReject() {
    if (!rejectGoalState || rejectComment.trim().length < 10) return
    rejectMutation.mutate({ goalId: rejectGoalState.id, comment: rejectComment.trim() })
  }

  if (pendingQuery.isError) {
    return <ErrorState message="Unable to load approvals." onRetry={pendingQuery.refetch} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Workflow"
        title="Approvals"
        subtitle="Review and approve team goal submissions"
        action={
          <Badge className="border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700 hover:bg-indigo-50">
            {pendingGoals.length} pending
          </Badge>
        }
      />

      {pendingQuery.isLoading ? <ApprovalSkeleton /> : null}

      {!pendingQuery.isLoading && pendingGoals.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <EmptyState
            icon={CheckCircle2}
            title="All caught up!"
            description="No goals waiting for review"
          />
        </div>
      ) : null}

      {!pendingQuery.isLoading && pendingGoals.length > 0 ? (
        <div className="space-y-3">
          {pendingGoals.map((goal) => (
            <ApprovalCard
              key={goal.id}
              goal={goal}
              isMutating={isMutating}
              onApprove={(selectedGoal) => approveMutation.mutate(selectedGoal.id)}
              onReject={openReject}
            />
          ))}
        </div>
      ) : null}

      <RejectDialog
        goal={rejectGoalState}
        comment={rejectComment}
        setComment={setRejectComment}
        onClose={() => setRejectGoalState(null)}
        onConfirm={confirmReject}
        isPending={rejectMutation.isPending}
      />
    </div>
  )
}
