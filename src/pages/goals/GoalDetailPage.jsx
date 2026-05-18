import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ClipboardList, Lock, MessageSquare } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { getGoal, getGoalCheckins, submitGoal } from '@/api/goals'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import ProgressBar from '@/components/shared/ProgressBar'
import StatusBadge from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { formatDate } from '@/lib/utils'

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

export default function GoalDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const goalQuery = useQuery({ queryKey: QUERY_KEYS.GOAL(id), queryFn: () => getGoal(id) })
  const checkinsQuery = useQuery({ queryKey: QUERY_KEYS.CHECKINS(id), queryFn: () => getGoalCheckins(id) })
  const submitMutation = useMutation({
    mutationFn: () => submitGoal(id),
    onSuccess: () => {
      toast.success('Goal submitted for approval')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOAL(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOALS })
    },
    onError: () => toast.error('Unable to submit goal'),
  })

  if (goalQuery.isLoading) return <DetailSkeleton />
  if (goalQuery.isError) return <ErrorState message="Unable to load goal details." onRetry={goalQuery.refetch} />

  const goal = goalQuery.data
  const checkins = checkinsQuery.data ?? []
  const approvals = goal.approvals ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={`Goals > ${goal.title}`}
        title={goal.title}
        subtitle="Quarterly objective detail"
        action={
          !goal.is_locked && goal.status === 'draft' ? (
            <Button disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="rounded-xl border-slate-200 shadow-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Description</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{goal.description}</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 shadow-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Progress</h2>
              <div className="mt-4">
                <ProgressBar value={goal.progress} showLabel />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 shadow-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Check-in history</h2>
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
                  description="Quarterly check-ins will appear here once progress updates are submitted."
                />
              ) : (
                <div className="mt-4 space-y-3">
                  {checkins.map((checkin) => (
                    <div key={checkin.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-900">{formatDate(checkin.created_at)}</p>
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                          {checkin.progress_value}%
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{checkin.notes}</p>
                      {checkin.manager_comment ? (
                        <div className="mt-3 border-l-2 border-indigo-200 pl-3">
                          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-indigo-600">
                            <MessageSquare className="h-3 w-3" /> Manager comment
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{checkin.manager_comment}</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
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
                <span className="font-medium text-slate-900">{goal.owner.full_name}</span>
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
