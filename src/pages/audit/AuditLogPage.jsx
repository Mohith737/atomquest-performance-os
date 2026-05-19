import { useQuery } from '@tanstack/react-query'
import { Shield } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getAuditLogs } from '@/api/audit'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { cn, formatRelativeTime } from '@/lib/utils'

const ACTION_BADGES = {
  GOAL_APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
  GOAL_REJECTED: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-50',
  GOAL_CREATED: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50',
}

function AuditSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="space-y-2 p-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-12 rounded-md" />
        ))}
      </div>
    </div>
  )
}

function ActionBadge({ action }) {
  return (
    <Badge className={cn('font-medium', ACTION_BADGES[action] || 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-50')}>
      {action}
    </Badge>
  )
}

function JsonPreview({ value, onExpand }) {
  if (value === null || value === undefined) return <span className="text-slate-400">-</span>

  return (
    <button
      className="max-w-[220px] truncate text-left font-mono text-xs text-slate-600 hover:text-indigo-700"
      onClick={() => onExpand(value)}
    >
      {JSON.stringify(value)}
    </button>
  )
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [actionSearch, setActionSearch] = useState('')
  const [targetModel, setTargetModel] = useState('all')
  const [expandedJson, setExpandedJson] = useState(null)
  const queryParams = {
    page,
    ...(targetModel !== 'all' ? { target_model: targetModel } : {}),
  }
  const auditQuery = useQuery({
    queryKey: [...QUERY_KEYS.AUDIT_LOGS, queryParams],
    queryFn: () => getAuditLogs(queryParams),
  })

  const rawLogs = Array.isArray(auditQuery.data) ? auditQuery.data : auditQuery.data?.results ?? []
  const logs = rawLogs.filter((log) => log.action.toLowerCase().includes(actionSearch.toLowerCase()))
  const totalCount = auditQuery.data?.count ?? rawLogs.length
  const totalPages = Math.max(1, Math.ceil(totalCount / 50))
  const targetModels = useMemo(
    () => Array.from(new Set(rawLogs.map((log) => log.target_model).filter(Boolean))).sort(),
    [rawLogs],
  )

  if (auditQuery.isError) {
    return <ErrorState message="Unable to load audit logs." onRetry={auditQuery.refetch} />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" subtitle="Complete trail of all system actions" />

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <Input
          value={actionSearch}
          onChange={(event) => setActionSearch(event.target.value)}
          placeholder="Search by action"
          className="md:max-w-sm"
        />
        <Select
          value={targetModel}
          onValueChange={(value) => {
            setTargetModel(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="md:w-56">
            <SelectValue placeholder="Target model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All target models</SelectItem>
            {targetModels.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {auditQuery.isLoading ? <AuditSkeleton /> : null}

      {!auditQuery.isLoading && logs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState icon={Shield} title="No audit events yet" description="System actions will appear here once activity is recorded." />
        </div>
      ) : null}

      {!auditQuery.isLoading && logs.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-slate-500">{formatRelativeTime(log.timestamp)}</TableCell>
                  <TableCell className="text-slate-700">{log.actor?.email || 'System'}</TableCell>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <div className="font-medium text-slate-900">{log.target_model}</div>
                    <div className="max-w-[160px] truncate text-xs text-slate-500">{log.target_id}</div>
                  </TableCell>
                  <TableCell>
                    <JsonPreview value={log.old_value} onExpand={setExpandedJson} />
                  </TableCell>
                  <TableCell>
                    <JsonPreview value={log.new_value} onExpand={setExpandedJson} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={expandedJson !== null} onOpenChange={(open) => !open && setExpandedJson(null)}>
        <DialogContent className="max-w-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Audit value</DialogTitle>
          </DialogHeader>
          <pre className="max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
            {JSON.stringify(expandedJson, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}
