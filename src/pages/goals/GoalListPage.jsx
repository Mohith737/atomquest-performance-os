import { useQuery } from '@tanstack/react-query'
import { Target } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getGoals } from '@/api/goals'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import GoalCard from '@/components/shared/GoalCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'

const STATUS_TABS = ['all', 'draft', 'pending', 'approved', 'completed']

function LoadingGoals() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-[118px] rounded-xl" />
      ))}
    </div>
  )
}

function emptyCopy(status) {
  if (status === 'all') {
    return {
      title: 'No goals yet',
      description: 'Create your first goal to begin tracking quarterly performance.',
    }
  }

  return {
    title: `No ${status} goals`,
    description: `Goals in ${status} status will appear here when available.`,
  }
}

export default function GoalListPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const goalsQuery = useQuery({
    queryKey: [...QUERY_KEYS.GOALS, activeTab],
    queryFn: () => getGoals(activeTab === 'all' ? {} : { status: activeTab }),
  })

  const goals = (goalsQuery.data ?? []).filter((goal) => activeTab === 'all' || goal.status === activeTab)
  const emptyState = emptyCopy(activeTab)

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Dashboard > Goals"
        title="My Goals"
        subtitle="Track your quarterly objectives"
        action={<Button onClick={() => navigate(ROUTES.GOAL_CREATE)}>+ Create Goal</Button>}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl border border-slate-200 bg-white">
          {STATUS_TABS.map((status) => (
            <TabsTrigger key={status} value={status} className="capitalize">
              {status}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {goalsQuery.isLoading ? <LoadingGoals /> : null}

      {goalsQuery.isError ? <ErrorState message="Unable to load goals." onRetry={goalsQuery.refetch} /> : null}

      {!goalsQuery.isLoading && !goalsQuery.isError && goals.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState
            icon={Target}
            title={emptyState.title}
            description={emptyState.description}
            action={activeTab === 'all' ? { label: 'Create Goal', onClick: () => navigate(ROUTES.GOAL_CREATE) } : undefined}
          />
        </div>
      ) : null}

      {!goalsQuery.isLoading && !goalsQuery.isError && goals.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onClick={() => navigate(ROUTES.GOAL_DETAIL(goal.id))} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
