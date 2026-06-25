import { Sidebar, type SidebarUser } from './Sidebar'
import { Topbar } from './Topbar'
import { signOut } from '@/server/actions/auth'

interface DashboardShellProps {
  user: SidebarUser
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* signOut es una Server Action; se invoca desde el dropdown de la sidebar */}
      <Sidebar user={user} onLogout={signOut} />
      <div className="md:pl-60">
        <Topbar user={user} onLogout={signOut} />
        <main className="px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}