'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import {
  LayoutDashboard, Package, ArrowLeftRight, Truck, LogOut, Boxes, ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export interface SidebarUser {
  name: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
}

interface NavItem { href: string; label: string; icon: LucideIcon; exact?: boolean; adminOnly?: boolean }

const NAV_ITEMS: NavItem[] = [
  { href: '/',            label: 'Dashboard',   icon: LayoutDashboard, exact: true },
  { href: '/products',    label: 'Productos',   icon: Package },
  { href: '/movements',   label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/suppliers',   label: 'Proveedores', icon: Truck },
  { href: '/admin/users', label: 'Usuarios',    icon: ShieldCheck, adminOnly: true },
]

const ROLE_LABEL: Record<SidebarUser['role'], string> = {
  admin: 'Administrador', manager: 'Encargado', viewer: 'Lectura',
}

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

export function SidebarContent({ user, onNavigate, onLogout }: {
  user: SidebarUser
  onNavigate?: () => void
  onLogout?: () => void
}) {
  const pathname = usePathname()
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  // El item de admin solo se muestra si el usuario es admin
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || user.role === 'admin')

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Boxes className="h-5 w-5 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight text-white">InventFlow</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left outline-none transition-colors hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-indigo-600 text-xs text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{ROLE_LABEL[user.role]}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function Sidebar({ user, onLogout }: { user: SidebarUser; onLogout?: () => void }) {
  return (
    <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col">
      <SidebarContent user={user} onLogout={onLogout} />
    </aside>
  )
}