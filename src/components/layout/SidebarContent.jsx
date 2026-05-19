import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart2,
  Calendar,
  CheckCircle,
  LayoutDashboard,
  LogOut,
  Plus,
  Shield,
  Target,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { toast } from 'sonner'

import { getPendingApprovals } from '@/api/approvals'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const allNavItems = [
  {
    section: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: ROUTES.DASHBOARD, roles: ['employee', 'manager', 'admin'] },
    ],
  },
  {
    section: 'GOALS',
    items: [
      { label: 'My Goals', icon: Target, href: ROUTES.GOALS, roles: ['employee', 'manager', 'admin'] },
      { label: 'Create Goal', icon: Plus, href: ROUTES.GOAL_CREATE, roles: ['employee', 'manager', 'admin'] },
      { label: 'Team Goals', icon: Users, href: '/team-goals', roles: ['manager', 'admin'] },
    ],
  },
  {
    section: 'WORKFLOW',
    items: [
      { label: 'Approvals', icon: CheckCircle, href: ROUTES.APPROVALS, roles: ['manager', 'admin'], showBadge: true },
      { label: 'Check-ins', icon: Calendar, href: ROUTES.CHECKINS, roles: ['employee', 'manager', 'admin'] },
    ],
  },
  {
    section: 'INSIGHTS',
    items: [
      { label: 'Analytics', icon: BarChart2, href: ROUTES.ANALYTICS, roles: ['manager', 'admin'] },
      { label: 'Audit Log', icon: Shield, href: ROUTES.AUDIT, roles: ['admin'] },
    ],
  },
]

export default function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { data: pendingApprovals = [] } = useQuery({
    queryKey: QUERY_KEYS.PENDING_APPROVALS,
    queryFn: getPendingApprovals,
    refetchInterval: 60_000,
    enabled: user?.role === 'manager' || user?.role === 'admin',
  })

  const visibleSections = useMemo(
    () =>
      allNavItems
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.roles.includes(user?.role)),
        }))
        .filter((section) => section.items.length > 0),
    [user?.role],
  )

  const initials = user?.full_name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const pendingApprovalCount = pendingApprovals.length
  const pendingApprovalLabel = pendingApprovalCount > 99 ? '99+' : pendingApprovalCount

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success('Signed out successfully')
    } catch {
      toast.error('Unable to sign out cleanly')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="text-base font-semibold text-indigo-600">AtomQuest</div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {visibleSections.map((section) => (
          <div key={section.section} className="space-y-2">
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-slate-500">{section.section}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    end={item.href === ROUTES.DASHBOARD}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900',
                        isActive && 'bg-indigo-50 font-medium text-indigo-700',
                      )
                    }
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.showBadge && pendingApprovalCount > 0 ? (
                      <Badge
                        title={`${pendingApprovalCount} approvals pending`}
                        className="min-w-6 justify-center border border-amber-200 bg-amber-50 px-2 py-0 text-xs tabular-nums text-amber-700 hover:bg-amber-50"
                      >
                        {pendingApprovalLabel}
                      </Badge>
                    ) : null}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-indigo-50 text-sm font-medium text-indigo-700">{initials || 'AQ'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{user?.full_name}</p>
                <p className="text-xs capitalize text-slate-500">{user?.role}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuItem disabled={isLoggingOut} onSelect={handleLogout}>
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Signing out...' : 'Logout'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
