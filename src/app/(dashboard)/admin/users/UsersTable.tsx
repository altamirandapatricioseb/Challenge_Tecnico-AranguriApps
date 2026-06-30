'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/app/DataTable'
import { RoleSelect } from '@/components/app/forms/RoleSelect'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deactivateUser } from '@/server/actions/users'
import { formatDate } from '@/lib/format.utils'
import { Users, Trash2 } from 'lucide-react'
import type { AdminUserOverview } from '@/types'

interface UsersTableProps {
  users: AdminUserOverview[]
  currentUserId: string // para deshabilitar el select y el borrado de la propia fila
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleting, setDeleting] = useState<AdminUserOverview | null>(null)

  function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deactivateUser(deleting.id ?? '')
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Usuario eliminado.')
        setDeleting(null)
        router.refresh()
      }
    })
  }

  const columns: Column<AdminUserOverview>[] = [
    {
      key: 'email', header: 'Email', sortValue: (u) => u.email ?? '',
      cell: (u) => <span className="font-data text-slate-700">{u.email ?? '—'}</span>,
    },
    {
      key: 'full_name', header: 'Nombre', sortValue: (u) => u.full_name ?? '',
      cell: (u) => <span className="text-slate-900">{u.full_name || '—'}</span>,
    },
    {
      key: 'created_at', header: 'Registrado', sortValue: (u) => u.created_at ?? '',
      cell: (u) => <span className="text-slate-500">{u.created_at ? formatDate(u.created_at) : '—'}</span>,
    },
    {
      key: 'role', header: 'Rol', sortValue: (u) => u.role ?? '',
      cell: (u) => (
        <RoleSelect
          userId={u.id ?? ''}
          currentRole={u.role}
          disabled={u.id === currentUserId}
        />
      ),
    },
    {
      key: 'actions', header: '', align: 'right',
      cell: (u) => (
        <div className="flex justify-end">
          {/* No se puede eliminar la propia cuenta: ocultamos el boton en esa fila */}
          {u.id !== currentUserId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleting(u)}
              title="Eliminar usuario"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        rowKey={(u) => u.id ?? ''}
        pageSize={10}
        emptyIcon={Users}
        emptyTitle="Sin usuarios"
        emptyDescription="Todavia no hay usuarios registrados."
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar a &quot;{deleting?.full_name || deleting?.email}&quot;. El usuario no
              podrá volver a iniciar sesión y dejará de figurar en el listado. Su historial de
              movimientos se conserva. Esta acción no se puede deshacer desde la interfaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}