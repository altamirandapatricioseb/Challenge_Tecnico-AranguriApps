'use client'

import { useState, useTransition } from 'react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { updateUserRole } from '@/server/actions/users'
import { toast } from 'sonner'
import type { UserRole } from '@/types'

interface RoleSelectProps {
  userId: string
  currentRole: UserRole
  disabled?: boolean // true para la fila del propio admin
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Encargado',
  viewer: 'Lectura',
}

export function RoleSelect({ userId, currentRole, disabled = false }: RoleSelectProps) {
  const [role, setRole] = useState<UserRole>(currentRole)
  const [isPending, startTransition] = useTransition()

  function handleChange(newRole: string) {
    const previous = role
    setRole(newRole as UserRole) 

    startTransition(async () => {
      const result = await updateUserRole(userId, newRole as UserRole)
      if (result.error) {
        setRole(previous) // si falla, revertir r
        toast.error(result.error)
      } else {
        toast.success('Rol actualizado.')
      }
    })
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={disabled || isPending}>
      <SelectTrigger className="h-8 w-40" data-testid="role-select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
        <SelectItem value="manager">{ROLE_LABELS.manager}</SelectItem>
        <SelectItem value="viewer">{ROLE_LABELS.viewer}</SelectItem>
      </SelectContent>
    </Select>
  )
}