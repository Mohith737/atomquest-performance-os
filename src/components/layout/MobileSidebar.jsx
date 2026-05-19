import { Menu } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

import SidebarContent from './SidebarContent'

export default function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed left-0 top-0 z-50 p-4 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
