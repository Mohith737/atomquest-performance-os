import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle, Download, Target, Timer, TrendingUp } from 'lucide-react'
import { Cell, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

import { exportCSV, getDashboard } from '@/api/analytics'
import { getAuditLogs } from '@/api/audit'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import StatCard from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { formatRelativeTime } from '@/lib/utils'

const STATUS_COLORS = ['#94a3b8', '#f59e0b', '#10b981', '#ef4444', '#6366f1']

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

export default function AdminDashboard() {
  const dashboardQuery = useQuery({ queryKey: QUERY_KEYS.DASHBOARD, queryFn: getDashboard })
  const auditQuery = useQuery({ queryKey: QUERY_KEYS.AUDIT_LOGS, queryFn: getAuditLogs })
  const exportMutation = useMutation({
    mutationFn: exportCSV,
    onSuccess: () => toast.success('CSV export downloaded'),
    onError: () => toast.error('Unable to export CSV'),
  })

  if (dashboardQuery.isLoading || auditQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb="Overview" title="Admin Dashboard" subtitle="Governance, visibility, and organizational health." />
        <DashboardSkeleton />
      </div>
    )
  }

  if (dashboardQuery.isError || auditQuery.isError) {
    return (
      <ErrorState
        message="Unable to load the admin dashboard."
        onRetry={() => {
          dashboardQuery.refetch()
          auditQuery.refetch()
        }}
      />
    )
  }

  const stats = dashboardQuery.data
  const pieData = Object.entries(stats.by_status).map(([name, value]) => ({ name, value }))
  const radialData = [{ name: 'Completion', value: stats.completion_rate, fill: '#4F46E5' }]
  const auditEvents = (auditQuery.data?.results ?? []).slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Overview"
        title="Admin Dashboard"
        subtitle="Governance, visibility, and organizational health."
        action={
          <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
            <Download className="h-4 w-4" />
            {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Goals" value={stats.total_goals} icon={Target} />
        <StatCard title="Completion Rate" value={`${stats.completion_rate}%`} icon={TrendingUp} />
        <StatCard title="Approved" value={stats.approved_count} icon={CheckCircle} />
        <StatCard title="Pending" value={stats.pending_count} icon={Timer} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Organization completion</h2>
          <div className="relative mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={10} background />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-slate-900">{stats.completion_rate}%</span>
              <span className="mt-1 text-sm text-slate-500">completion rate</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Goals by status</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Recent audit events</h2>
        {auditEvents.length === 0 ? (
          <EmptyState
            icon={Timer}
            title="No audit events yet"
            description="Recent workflow activity will appear here as the organization begins using AtomQuest."
          />
        ) : (
          <div className="mt-4 divide-y divide-slate-200">
            {auditEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{event.action}</p>
                  <p className="text-slate-500">{event.actor?.full_name || 'System'}</p>
                </div>
                <span className="text-slate-500">{formatRelativeTime(event.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
