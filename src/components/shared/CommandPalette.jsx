import { Command } from 'cmdk'
import { BarChart2, CheckCircle, LayoutDashboard, LogOut, Plus, Search, Shield, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAVIGATION_COMMANDS = [
  { label: 'Go to Dashboard', description: 'Open execution overview', icon: LayoutDashboard, href: ROUTES.DASHBOARD, roles: ['employee', 'manager', 'admin'] },
  { label: 'Create Goal', description: 'Define a quarterly objective', icon: Plus, href: ROUTES.GOAL_CREATE, roles: ['employee', 'manager', 'admin'] },
  { label: 'My Goals', description: 'Review your goals', icon: Target, href: ROUTES.GOALS, roles: ['employee', 'manager', 'admin'] },
  { label: 'Approvals', description: 'Review submitted goals', icon: CheckCircle, href: ROUTES.APPROVALS, roles: ['manager', 'admin'] },
  { label: 'Analytics', description: 'Open leadership metrics', icon: BarChart2, href: ROUTES.ANALYTICS, roles: ['manager', 'admin'] },
  { label: 'Audit Log', description: 'Inspect system trail', icon: Shield, href: ROUTES.AUDIT, roles: ['admin'] },
]

export default function CommandPalette() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const visibleCommands = useMemo(
    () => NAVIGATION_COMMANDS.filter((command) => command.roles.includes(user?.role)),
    [user?.role],
  )

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function closePalette() {
    setOpen(false)
    setSearch('')
  }

  function runNavigation(href) {
    closePalette()
    if (href !== location.pathname) {
      navigate(href)
    }
  }

  async function runLogout() {
    closePalette()
    try {
      await logout()
      toast.success('Signed out successfully')
    } catch {
      toast.error('Unable to sign out cleanly')
    }
  }

  return (
    <>
      <button
        className="hidden h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 md:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span>Command</span>
        <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium leading-none text-slate-500">
          Ctrl K
        </kbd>
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) setSearch('')
        }}
      >
        <DialogContent className="top-[20%] max-w-lg overflow-hidden border-slate-200 p-0 shadow-2xl sm:rounded-xl">
          <Command className="bg-white">
            <div className="flex items-center border-b border-slate-200 px-4">
              <Search className="mr-3 h-4 w-4 text-slate-400" />
              <Command.Input
                autoFocus
                value={search}
                onValueChange={setSearch}
                placeholder="Search actions..."
                className="h-12 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <Command.List className="max-h-[360px] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-sm text-slate-500">No matching actions.</Command.Empty>
              <Command.Group heading="Navigation" className="text-xs font-medium text-slate-500 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {visibleCommands.map((command) => {
                  const Icon = command.icon
                  const isCurrent = command.href === location.pathname

                  return (
                    <Command.Item
                      key={command.label}
                      value={`${command.label} ${command.description}`}
                      onSelect={() => runNavigation(command.href)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors',
                        'aria-selected:bg-slate-100 aria-selected:text-slate-900',
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{command.label}</p>
                        <p className="truncate text-xs text-slate-500">{command.description}</p>
                      </div>
                      {isCurrent ? <span className="text-xs font-medium text-slate-400">Current</span> : null}
                    </Command.Item>
                  )
                })}
              </Command.Group>
              <Command.Group heading="Session" className="text-xs font-medium text-slate-500 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                <Command.Item
                  value="Logout sign out session"
                  onSelect={runLogout}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors aria-selected:bg-slate-100 aria-selected:text-slate-900"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Logout</p>
                    <p className="text-xs text-slate-500">End current session</p>
                  </div>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
