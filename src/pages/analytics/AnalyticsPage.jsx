import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Download, LockKeyhole, Target, Trophy } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'

import { exportCSV, getDashboard } from '@/api/analytics'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEYS } from '@/constants/queryKeys'

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card className="rounded-xl border-slate-200 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, children, className = '' }) {
  return (
    <Card className={`rounded-xl border-slate-200 shadow-none ${className}`}>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-5">{children}</div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const dashboardQuery = useQuery({ queryKey: QUERY_KEYS.DASHBOARD, queryFn: getDashboard })

  async function handleExport() {
    toast.info('Preparing report...')
    try {
      await exportCSV()
      toast.success('Export ready')
    } catch {
      toast.error('Unable to export report')
    }
  }

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Goal performance across your team" />
        <AnalyticsSkeleton />
      </div>
    )
  }

  if (dashboardQuery.isError) {
    return <ErrorState message="Unable to load analytics." onRetry={dashboardQuery.refetch} />
  }

  const data = dashboardQuery.data
  const statusData = Object.entries(data.by_status).map(([name, value]) => ({ name, value }))
  const quarterData = Object.entries(data.by_quarter).map(([name, value]) => ({ name, value }))
  const completionData = [{ name: 'Completion', value: data.completion_rate, fill: '#6366f1' }]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Goal performance across your team"
        action={
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {data.total_goals === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState
            icon={Target}
            title="No analytics yet"
            description="Goal performance metrics will appear once team goals are created."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Goals" value={data.total_goals} icon={Target} />
            <StatCard title="Approved" value={data.approved_count} icon={LockKeyhole} />
            <StatCard title="Completed" value={data.by_status.completed} icon={CheckCircle2} />
            <StatCard title="Completion Rate" value={`${data.completion_rate}%`} icon={Trophy} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Goals by Status">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Completion Rate">
              <div className="relative h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="72%"
                    outerRadius="92%"
                    data={completionData}
                    startAngle={90}
                    endAngle={90 - (360 * data.completion_rate) / 100}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f1f5f9' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-semibold text-slate-900">{data.completion_rate}%</span>
                  <span className="mt-1 text-sm text-slate-500">completed</span>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Goals by Quarter" className="xl:col-span-2">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={quarterData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={48} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
