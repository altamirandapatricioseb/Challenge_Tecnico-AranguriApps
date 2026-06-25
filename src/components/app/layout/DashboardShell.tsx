import { Sidebar, type SidebarUser } from './Sidebar'
import { Topbar } from './Topbar'

interface DashboardShellProps {
  user: SidebarUser
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="md:pl-60">
        <Topbar user={user} />
        <main className="px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
