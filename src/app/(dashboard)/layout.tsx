import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/app/layout/DashboardShell'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile()

  const sidebarUser = {
    name: profile?.full_name || user.email?.split('@')[0] || 'Usuario',
    email: user.email ?? '',
    role: profile?.role ?? 'viewer',
  }

  return <DashboardShell user={sidebarUser}>{children}</DashboardShell>
}