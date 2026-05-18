import { Outlet } from 'react-router-dom'

import MobileSidebar from './MobileSidebar'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <MobileSidebar />
      <main className="flex-1 overflow-auto lg:pl-60">
        <div className="mx-auto max-w-7xl px-6 py-6 md:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
