import { requireRole } from '@/lib/auth'
import { getUsers } from '@/server/actions/users'
import { UsersTable } from './UsersTable'

export default async function AdminUsersPage() {
  // Solo admin entra; si un viewer/manager intenta, requireRole lo redirige a /
  const { user } = await requireRole('admin')
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Gestión de usuarios</h2>
        <p className="text-sm text-slate-500">
          Asigná roles a los usuarios del sistema. El email identifica a cada uno de forma única.
        </p>
      </div>

      <UsersTable users={users} currentUserId={user.id} />
    </div>
  )
}