import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CircleDot, Target, TrendingUp } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { getGoals } from '@/api/goals'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import GoalCard from '@/components/shared/GoalCard'
import StatCard from '@/components/shared/StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'
import { deriveQuarter } from '@/lib/utils'

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function EmployeeDashboard() {
  const navigate = useNavigate()
  const goalsQuery = useQuery({ queryKey: QUERY_KEYS.GOALS, queryFn: () => getGoals() })

  if (goalsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb="Overview" title="Employee Dashboard" subtitle="Your personal performance workspace." />
        <DashboardSkeleton />
      </div>
    )
  }

  if (goalsQuery.isError) {
    return <ErrorState message="Unable to load your dashboard." onRetry={goalsQuery.refetch} />
  }

  const goals = goalsQuery.data ?? []
  const activeGoals = goals.filter((goal) => ['draft', 'pending', 'approved'].includes(goal.status)).length
  const pendingDrafts = goals.filter((goal) => goal.status === 'draft').length
  const avgProgress = goals.length
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0
  const currentQuarter = deriveQuarter(new Date().toISOString())

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb="Overview" title="Employee Dashboard" subtitle="Your personal performance workspace." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Goals" value={goals.length} icon={Target} />
        <StatCard title="Active Goals" value={activeGoals} icon={CircleDot} />
        <StatCard title="Avg Progress" value={`${avgProgress}%`} icon={TrendingUp} />
        <StatCard title="Current Quarter" value={currentQuarter} icon={ArrowRight} />
      </div>

      {pendingDrafts > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have {pendingDrafts} goal(s) awaiting submission.
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent goals</h2>
          {goals.length > 0 ? (
            <Link to={ROUTES.GOALS} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          ) : null}
        </div>

        {goals.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white">
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Create your first goal to start tracking progress and quarterly outcomes."
              action={{ label: 'Create Goal', onClick: () => navigate(ROUTES.GOAL_CREATE) }}
            />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {goals.slice(0, 5).map((goal) => (
              <GoalCard key={goal.id} goal={goal} onClick={() => navigate(ROUTES.GOAL_DETAIL(goal.id))} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

