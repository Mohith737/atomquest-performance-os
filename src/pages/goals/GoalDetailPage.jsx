import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import { CalendarDays, CheckCircle2, ClipboardList, Clock3, FileLock2, Lock, MessageSquare, Send, ShieldCheck, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { addManagerComment } from '@/api/checkins'
import { createGoalCheckin, getGoal, getGoalCheckins, submitGoal, updateGoal } from '@/api/goals'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import ProgressBar from '@/components/shared/ProgressBar'
import StatusBadge from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { useAuth } from '@/hooks/useAuth'
import { cn, formatDate } from '@/lib/utils'

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}

const WORKFLOW_STEPS = [
  { key: 'draft', label: 'Draft', icon: ClipboardList },
  { key: 'pending', label: 'Manager review', icon: Clock3 },
  { key: 'approved', label: 'Approved & locked', icon: FileLock2 },
]

function workflowIndex(goal) {
  if (goal.status === 'approved' || goal.status === 'completed') return 2
  if (goal.status === 'pending') return 1
  return 0
}

function WorkflowPanel({ goal }) {
  const activeIndex = workflowIndex(goal)
  const rejected = goal.status === 'rejected'

  return (
    <Card className="rounded-xl border-slate-200 shadow-none">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Workflow State</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {goal.is_locked ? 'Approved goal is locked for execution' : rejected ? 'Returned for revision' : 'Goal approval in progress'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {goal.is_locked
                ? 'Employee edits are disabled after manager approval. Progress continues through check-ins and manager comments.'
                : rejected
                  ? 'Manager feedback is available below. The employee can revise and resubmit this goal.'
                  : goal.status === 'pending'
                    ? 'This goal is awaiting a manager decision before execution locks.'
                    : 'Submit this draft to begin the manager approval workflow.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={goal.status} />
            {goal.is_locked ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon
            const complete = index < activeIndex || (index === activeIndex && activeIndex === 2)
            const active = index === activeIndex && !rejected
            return (
              <div
                key={step.key}
                className={cn(
                  'rounded-xl border p-4 transition-all duration-300',
                  active || complete ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white',
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border',
                    active || complete ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-500',
                  )}
                >
                  {complete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{step.label}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {step.key === 'draft' ? 'Employee creates goal' : step.key === 'pending' ? 'Manager reviews' : 'Edits disabled'}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function WorkflowSignal({ goal, latestApproval }) {
  const locked = goal.is_locked
  const rejected = goal.status === 'rejected'
  const pending = goal.status === 'pending'

  return (
    <div
      className={cn(
        'rounded-xl border p-4 text-sm',
        locked || pending ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
            locked || pending ? 'border-indigo-200 bg-white text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-500',
          )}
        >
          {locked ? <ShieldCheck className="h-4 w-4" /> : pending ? <Clock3 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
        </div>
        <div>
          <p className={cn('font-semibold', locked || pending ? 'text-indigo-900' : 'text-slate-900')}>
            {locked ? 'Execution mode active' : rejected ? 'Revision requested' : pending ? 'Manager decision pending' : 'Draft not submitted'}
          </p>
          <p className={cn('mt-1 leading-6', locked || pending ? 'text-indigo-700/80' : 'text-slate-500')}>
            {locked
              ? 'Manager approval is complete. Employee edit controls are hidden and the audit trail is preserved.'
              : rejected
                ? 'The latest manager comment should be addressed before resubmission.'
                : pending
                  ? 'This goal is waiting for approval before it can move into locked execution.'
                  : 'Submit this goal when the scope, measures, and weightage are ready for review.'}
          </p>
          {latestApproval?.created_at ? (
            <p className="mt-2 text-xs text-slate-500">Last decision activity: {formatDate(latestApproval.created_at)}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CheckInComposer({ goal, isPending, onSubmit }) {
  const [progressValue, setProgressValue] = useState(Number(goal.progress || 0))
  const [notes, setNotes] = useState('')
  const notesTooShort = notes.trim().length > 0 && notes.trim().length < 10

  function handleSubmit(event) {
    event.preventDefault()
    if (notes.trim().length < 10) {
      toast.error('Check-in notes must be at least 10 characters')
      return
    }
    onSubmit({ progress_value: progressValue, notes: notes.trim(), onSettled: () => setNotes('') })
  }

  return (
    <Card className="rounded-xl border-indigo-200 bg-indigo-50 shadow-none">
      <CardContent className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase text-indigo-700">
              <TrendingUp className="h-4 w-4" />
              Weekly check-in
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Update execution progress</h2>
            <p className="mt-1 text-sm text-indigo-700/80">Log a concise status update for manager visibility.</p>
          </div>
          <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-sm font-semibold text-indigo-700">
            {progressValue}%
          </span>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-medium uppercase text-indigo-700">
              <span>Progress</span>
              <span>{progressValue}% complete</span>
            </div>
            <Slider value={[progressValue]} min={0} max={100} step={5} onValueChange={(value) => setProgressValue(value[0])} />
          </div>
          <div className="space-y-2">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Summarize completed work, blockers, or next steps."
              className="min-h-24 border-indigo-200 bg-white"
            />
            {notesTooShort ? <p className="text-xs font-medium text-red-600">Use at least 10 characters.</p> : null}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Post Check-in'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function CheckInTimeline({ checkins, canComment, commentingId, commentText, setCommentingId, setCommentText, onComment, isCommenting }) {
  return (
    <div className="mt-5">
      {checkins.map((checkin, index) => {
        const isLast = index === checkins.length - 1
        const hasComment = Boolean(checkin.manager_comment)

        return (
          <div key={checkin.id} className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-3">
            <div className="relative flex justify-center">
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-indigo-600 bg-white" />
              {!isLast ? <span className="absolute top-5 h-full w-px bg-slate-200" /> : null}
            </div>
            <div className="pb-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{formatDate(checkin.created_at)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Submitted by {checkin.submitted_by?.full_name || 'Employee'}
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    {checkin.progress_value}% progress
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{checkin.notes}</p>

                {hasComment ? (
                  <div className="mt-3 border-l-2 border-indigo-200 bg-slate-50 py-2 pl-3">
                    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-indigo-600">
                      <MessageSquare className="h-3 w-3" /> Manager comment
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{checkin.manager_comment}</p>
                  </div>
                ) : null}

                {canComment && !hasComment && commentingId !== checkin.id ? (
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setCommentingId(checkin.id)}>
                    <MessageSquare className="h-4 w-4" />
                    Add manager comment
                  </Button>
                ) : null}

                {canComment && commentingId === checkin.id ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Add concise manager guidance."
                      className="min-h-20"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isCommenting}
                        onClick={() => {
                          setCommentingId(null)
                          setCommentText('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" disabled={isCommenting} onClick={() => onComment(checkin.id)}>
                        {isCommenting ? 'Saving...' : 'Save Comment'}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function GoalDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [commentingId, setCommentingId] = useState(null)
  const [commentText, setCommentText] = useState('')
  const goalQuery = useQuery({ queryKey: QUERY_KEYS.GOAL(id), queryFn: () => getGoal(id) })
  const checkinsQuery = useQuery({ queryKey: QUERY_KEYS.CHECKINS(id), queryFn: () => getGoalCheckins(id) })
  const submitMutation = useMutation({
    mutationFn: () => submitGoal(id),
    onSuccess: (updatedGoal) => {
      toast.success('Goal submitted for approval')
      queryClient.setQueryData(QUERY_KEYS.GOAL(id), updatedGoal)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOAL(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_APPROVALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: () => toast.error('Unable to submit goal'),
  })
  const createCheckinMutation = useMutation({
    mutationFn: ({ progress_value, notes }) => createGoalCheckin({ goal: id, progress_value, notes }),
    onSuccess: (checkin, variables) => {
      toast.success('Check-in posted')
      variables.onSettled?.()
      queryClient.setQueryData(QUERY_KEYS.CHECKINS(id), (current = []) => [checkin, ...current])
      queryClient.setQueryData(QUERY_KEYS.GOAL(id), (current) =>
        current ? { ...current, progress: checkin.progress_value } : current,
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHECKINS(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOAL(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: (error) => toast.error(error.response?.data?.notes?.[0] || 'Unable to post check-in'),
  })
  const completeGoalMutation = useMutation({
    mutationFn: () => updateGoal(id, { status: 'completed' }),
    onSuccess: () => {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#22c55e', '#f59e0b'],
        disableForReducedMotion: true,
      })
      toast.success('Goal completed!')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOAL(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: () => toast.error('Unable to complete goal'),
  })
  const commentMutation = useMutation({
    mutationFn: ({ checkinId, manager_comment }) => addManagerComment(checkinId, manager_comment),
    onSuccess: (updatedCheckin) => {
      toast.success('Manager comment saved')
      setCommentingId(null)
      setCommentText('')
      queryClient.setQueryData(QUERY_KEYS.CHECKINS(id), (current = []) =>
        current.map((checkin) => (checkin.id === updatedCheckin.id ? updatedCheckin : checkin)),
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHECKINS(id) })
    },
    onError: (error) => toast.error(error.response?.data?.manager_comment?.[0] || 'Unable to save comment'),
  })

  if (goalQuery.isLoading) return <DetailSkeleton />
  if (goalQuery.isError) return <ErrorState message="Unable to load goal details." onRetry={goalQuery.refetch} />

  const goal = goalQuery.data
  const checkins = [...(checkinsQuery.data ?? [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const approvals = [...(goal.approvals ?? [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const latestApproval = approvals[0]
  const canCreateCheckin = goal.status === 'approved' && goal.owner?.id === user?.id
  const canComment = ['manager', 'admin'].includes(user?.role)

  function handleManagerComment(checkinId) {
    if (commentText.trim().length < 1) {
      toast.error('Manager comment is required')
      return
    }
    commentMutation.mutate({ checkinId, manager_comment: commentText.trim() })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={`Goals > ${goal.title}`}
        title={goal.title}
        subtitle="Quarterly objective detail"
        action={
          goal.status === 'approved' ? (
            <Button disabled={completeGoalMutation.isPending} onClick={() => completeGoalMutation.mutate()}>
              <CheckCircle2 className="h-4 w-4" />
              {completeGoalMutation.isPending ? 'Completing...' : 'Mark Complete'}
            </Button>
          ) : !goal.is_locked && goal.status === 'draft' ? (
            <Button disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
              <Send className="h-4 w-4" />
              {submitMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          ) : null
        }
      />

      <WorkflowPanel goal={goal} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <WorkflowSignal goal={goal} latestApproval={latestApproval} />

          <Card className="rounded-xl border-slate-200 shadow-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Description</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{goal.description}</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Execution Progress</h2>
                  <p className="mt-1 text-sm text-slate-500">Tracked through approved check-ins.</p>
                </div>
                <span className="text-2xl font-semibold text-slate-900">{goal.progress}%</span>
              </div>
              <div className="mt-5">
                <ProgressBar value={goal.progress} />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Quarter</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{goal.quarter}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Weightage</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{Number(goal.weightage)}%</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Owner</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">{goal.owner?.full_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {latestApproval?.comment ? (
            <Card className="rounded-xl border-indigo-200 bg-indigo-50 shadow-none">
              <CardContent className="p-6">
                <p className="flex items-center gap-2 text-xs font-medium uppercase text-indigo-700">
                  <MessageSquare className="h-4 w-4" />
                  Latest manager comment
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{latestApproval.comment}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {latestApproval.reviewed_by?.full_name} - {formatDate(latestApproval.created_at)}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {canCreateCheckin ? (
            <CheckInComposer
              goal={goal}
              isPending={createCheckinMutation.isPending}
              onSubmit={(payload) => createCheckinMutation.mutate(payload)}
            />
          ) : null}

          <Card className="rounded-xl border-slate-200 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Operational timeline</h2>
                  <p className="mt-1 text-sm text-slate-500">Progress updates and manager oversight over time.</p>
                </div>
                {checkins.length > 0 ? (
                  <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {checkins.length} check-ins
                  </span>
                ) : null}
              </div>
              {checkinsQuery.isLoading ? (
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : checkinsQuery.isError ? (
                <div className="mt-4">
                  <ErrorState message="Unable to load check-ins." onRetry={checkinsQuery.refetch} />
                </div>
              ) : checkins.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No check-ins yet"
                  description="Weekly progress updates and manager comments will appear here after execution begins."
                />
              ) : (
                <CheckInTimeline
                  checkins={checkins}
                  canComment={canComment}
                  commentingId={commentingId}
                  commentText={commentText}
                  setCommentingId={setCommentingId}
                  setCommentText={setCommentText}
                  onComment={handleManagerComment}
                  isCommenting={commentMutation.isPending}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-xl border-slate-200 shadow-none">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <StatusBadge status={goal.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Quarter</span>
                <span className="font-medium text-slate-900">{goal.quarter}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Weightage</span>
                <span className="font-medium text-slate-900">{goal.weightage}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Owner</span>
                <span className="font-medium text-slate-900">{goal.owner?.full_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Created</span>
                <span className="font-medium text-slate-900">{formatDate(goal.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          {goal.is_locked ? (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
              <div className="flex items-center gap-2 font-medium">
                <Lock className="h-4 w-4" /> Goal locked after approval
              </div>
              <p className="mt-2 text-orange-700/80">Edit controls are hidden. Execution updates now happen through check-ins.</p>
            </div>
          ) : goal.status === 'pending' ? (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700">
              <div className="flex items-center gap-2 font-medium">
                <Clock3 className="h-4 w-4" /> Awaiting manager review
              </div>
              <p className="mt-2 text-indigo-700/80">The goal will lock automatically when a manager approves it.</p>
            </div>
          ) : null}

          <Card className="rounded-xl border-slate-200 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900">Approval history</h2>
              </div>
              {approvals.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No approval activity recorded yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {approvals.map((approval) => (
                    <div key={approval.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium capitalize text-slate-900">{approval.action}</span>
                        <span className="text-slate-500">{formatDate(approval.created_at)}</span>
                      </div>
                      <p className="mt-1 text-slate-500">{approval.reviewed_by?.full_name}</p>
                      {approval.comment ? <p className="mt-2 text-slate-600">{approval.comment}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
