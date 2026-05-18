import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

import SidebarContent from './SidebarContent'

export default function MobileSidebar() {
  return (
    <div className="fixed left-4 top-4 z-40 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-xl border-slate-200 bg-white">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-slate-200 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </div>
  )
}
