'use client'

import { useState, type ReactNode } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Plus, type LucideIcon } from 'lucide-react'

interface FormSheetProps {
  title: string
  triggerLabel: string
  triggerIcon?: LucideIcon
  // render recibe una funcion para cerrar el sheet desde adentro
  children: (close: () => void) => ReactNode
}

export function FormSheet({ title, triggerLabel, triggerIcon: Icon = Plus, children }: FormSheetProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Icon className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 px-4">{children(close)}</div>
      </SheetContent>
    </Sheet>
  )
}
