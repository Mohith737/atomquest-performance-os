import SidebarContent from './SidebarContent'

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-60 flex-col border-r border-slate-200 bg-white lg:flex">
      <SidebarContent />
    </aside>
  )
}
