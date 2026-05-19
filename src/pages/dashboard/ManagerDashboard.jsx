import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart2, Check, CheckCircle, ClipboardCheck, Target, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'

import { getDashboard } from '@/api/analytics'
import { approveGoal, getPendingApprovals, rejectGoal } from '@/api/approvals'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import ManagerReviewDialog from '@/components/shared/ManagerReviewDialog'
import StatCard from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-20 rounded-xl" />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

export default function ManagerDashboard() {
  const queryClient = useQueryClient()
  const [review, setReview] = useState(null)
  const pendingQuery = useQuery({ queryKey: QUERY_KEYS.PENDING_APPROVALS, queryFn: getPendingApprovals })
  const dashboardQuery = useQuery({ queryKey: QUERY_KEYS.DASHBOARD, queryFn: getDashboard })

  const approveMutation = useMutation({
    mutationFn: ({ goalId, comment }) => approveGoal(goalId, comment),
    onSuccess: (goal) => {
      toast.success('Goal approved and locked')
      setReview(null)
      queryClient.setQueryData(QUERY_KEYS.PENDING_APPROVALS, (current = []) =>
        current.filter((pendingGoal) => pendingGoal.id !== goal.id),
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_APPROVALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOAL(goal.id) })
    },
    onError: () => toast.error('Unable to approve goal'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ goalId, comment }) => rejectGoal(goalId, comment),
    onSuccess: (goal) => {
      toast.success('Goal rejected with manager feedback')
      setReview(null)
      queryClient.setQueryData(QUERY_KEYS.PENDING_APPROVALS, (current = []) =>
        current.filter((pendingGoal) => pendingGoal.id !== goal.id),
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PENDING_APPROVALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOALS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GOAL(goal.id) })
    },
    onError: (error) => toast.error(error.response?.data?.comment?.[0] || 'Unable to reject goal'),
  })

  if (pendingQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb="Overview" title="Manager Dashboard" subtitle="Operational workflow visibility for your team." />
        <DashboardSkeleton />
      </div>
    )
  }

  if (pendingQuery.isError || dashboardQuery.isError) {
    return (
      <ErrorState
        message="Unable to load the manager dashboard."
        onRetry={() => {
          pendingQuery.refetch()
          dashboardQuery.refetch()
        }}
      />
    )
  }

  const pendingGoals = pendingQuery.data ?? []
  const stats = dashboardQuery.data
  const chartData = Object.entries(stats.by_status).map(([status, value]) => ({ status, value }))
  const isMutating = approveMutation.isPending || rejectMutation.isPending

  function confirmReview({ goalId, comment }) {
    if (review.action === 'approve') {
      approveMutation.mutate({ goalId, comment })
      return
    }
    rejectMutation.mutate({ goalId, comment })
  }

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb="Overview" title="Manager Dashboard" subtitle="Operational workflow visibility for your team." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Team Goals" value={stats.total_goals} icon={Target} />
        <StatCard title="Pending Approvals" value={stats.pending_count} icon={ClipboardCheck} />
        <StatCard title="Team Avg Progress" value={`${stats.avg_progress}%`} icon={BarChart2} />
        <StatCard title="Completed" value={stats.by_status.completed} icon={CheckCircle} />
      </div>

      {pendingGoals.length > 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          <span>
            <span className="font-semibold">Action Required:</span> {pendingGoals.length} goal(s) awaiting review.
          </span>
          <Link to={ROUTES.APPROVALS} className="font-medium text-indigo-700 hover:text-indigo-900">
            Review now
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Pending approvals</h2>
            <span className="text-sm text-slate-500">Top 3</span>
          </div>

          {pendingGoals.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No approvals waiting"
              description="Your team has no pending goal approvals at the moment."
            />
          ) : (
            <div className="space-y-3">
              {pendingGoals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{goal.owner.full_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={isMutating}
                      onClick={() => setReview({ goal, action: 'approve' })}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isMutating}
                      onClick={() => setReview({ goal, action: 'reject' })}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Goals by status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="status" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <ManagerReviewDialog
        review={review}
        onClose={() => setReview(null)}
        onConfirm={confirmReview}
        isPending={isMutating}
      />
    </div>
  )
}
