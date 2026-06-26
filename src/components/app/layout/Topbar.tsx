'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SidebarContent, type SidebarUser } from './Sidebar'

// Etiquetas por segmento de ruta para el titulo del topbar
const SEGMENT_LABELS: Record<string, string> = {
  products: 'Productos',
  movements: 'Movimientos',
  suppliers: 'Proveedores',
  categories: 'Categorías',
  admin: 'Usuarios',
}

function getTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  const seg = pathname.split('/')[1] ?? ''
  return SEGMENT_LABELS[seg] ?? 'InventFlow'
}

export function Topbar({ user, onLogout }: { user: SidebarUser; onLogout?: () => void }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const title = getTitle(pathname)

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-3 px-4 backdrop-blur md:px-6"
      style={{ borderBottom: '1px solid #1d2026', backgroundColor: 'rgba(12, 13, 15, 0.8)' }}
    >
      {/* Drawer de navegación (mobile) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 border-0 p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SidebarContent user={user} onNavigate={() => setOpen(false)} onLogout={onLogout} />
        </SheetContent>
      </Sheet>

      <h1 className="text-base font-semibold" style={{ color: '#f1efe9' }}>{title}</h1>
    </header>
  )
}
