'use client'

import { DataTable, type Column } from '@/components/app/DataTable'
import { RoleSelect } from '@/components/app/forms/RoleSelect'
import { formatDate } from '@/lib/format.utils'
import { Users } from 'lucide-react'
import type { AdminUserOverview } from '@/types'

interface UsersTableProps {
  users: AdminUserOverview[]
  currentUserId: string // para deshabilitar el select de la propia fila
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const columns: Column<AdminUserOverview>[] = [
    {
      key: 'email',
      header: 'Email',
      cell: (u) => <span className="font-data text-slate-700">{u.email ?? '—'}</span>,
    },
    {
      key: 'full_name',
      header: 'Nombre',
      cell: (u) => <span className="text-slate-900">{u.full_name || '—'}</span>,
    },
    {
      key: 'created_at',
      header: 'Registrado',
      cell: (u) => <span className="text-slate-500">{u.created_at ? formatDate(u.created_at) : '—'}</span>,
    },
    {
      key: 'role',
      header: 'Rol',
      cell: (u) => (
        <RoleSelect
          userId={u.id ?? ''}
          currentRole={u.role}
          disabled={u.id === currentUserId}
        />
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={users}
      rowKey={(u) => u.id ?? ''}
      pageSize={10}
      emptyIcon={Users}
      emptyTitle="Sin usuarios"
      emptyDescription="Todavia no hay usuarios registrados."
    />
  )
}
