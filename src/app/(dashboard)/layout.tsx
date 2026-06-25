import { DashboardShell } from '@/components/app/layout/DashboardShell'
 
// usuario simulado para previsualizar la UI sin autenticación este layout pasa a ser async y obtiene el usuario real con getUser().
const MOCK_USER = {
  name: 'Patricio Altamiranda',
  email: 'patricio@test.app',
  role: 'admin' as const,
}
 
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell user={MOCK_USER}>{children}</DashboardShell>
}
 