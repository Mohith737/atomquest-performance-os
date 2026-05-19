import { Outlet } from 'react-router-dom'

import MobileSidebar from './MobileSidebar'
import Sidebar from './Sidebar'
import CommandPalette from '@/components/shared/CommandPalette'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <MobileSidebar />
      <main className="flex-1 overflow-auto lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-20 sm:px-6 md:px-8 lg:py-6">
          <div className="mb-4 flex justify-end">
            <CommandPalette />
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
