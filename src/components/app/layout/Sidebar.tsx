'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import {
  LayoutDashboard, Package, ArrowLeftRight, Truck, Tag, LogOut, ShieldCheck,
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
  { href: '/categories',  label: 'Categorías',  icon: Tag },
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
    <div className="flex h-full flex-col" style={{ backgroundColor: '#101115', color: '#9a9da4' }}>
      <div className="flex h-16 items-center gap-2 px-5" style={{ borderBottom: '1px solid #1d2026' }}>
        {/* Logo desde public/logo.png */}
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
          <Image src="/logo.png" alt="InventFlow" width={32} height={32} className="h-8 w-8 object-contain" />
        </div>
        <span className="text-base font-semibold tracking-tight" style={{ color: '#f1efe9' }}>InventFlow</span>
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
              )}
              style={
                active
                  ? { backgroundColor: '#eab308', color: '#0c0d0f' }
                  : { color: '#9a9da4' }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = '#15171c'
                  e.currentTarget.style.color = '#f1efe9'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#9a9da4'
                }
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3" style={{ borderTop: '1px solid #1d2026' }}>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left outline-none transition-colors focus-visible:ring-2"
            style={{ color: '#f1efe9' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#15171c' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs" style={{ backgroundColor: '#eab308', color: '#0c0d0f' }}>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: '#f1efe9' }}>{user.name}</p>
              <p className="truncate text-xs" style={{ color: '#8a8d94' }}>{ROLE_LABEL[user.role]}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem onClick={onLogout} className="text-red-500 focus:text-red-500">
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
