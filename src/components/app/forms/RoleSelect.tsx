'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { updateUserRole } from '@/server/actions/users'
import type { UserRole } from '@/types'

// Acepta string generico (como lo tipan las vistas) o null; valida internamente
interface RoleSelectProps {
  userId: string
  currentRole: string | null | undefined
  disabled?: boolean
}

// Etiquetas en español para cada rol
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'viewer',  label: 'Lectura' },
  { value: 'manager', label: 'Encargado' },
  { value: 'admin',   label: 'Administrador' },
]

// Type guard: confirma que un string sea un rol valido
function isUserRole(value: string | null | undefined): value is UserRole {
  return value === 'viewer' || value === 'manager' || value === 'admin'
}

export function RoleSelect({ userId, currentRole, disabled = false }: RoleSelectProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Si el rol no es valido, caemos a 'viewer' como default seguro para el select
  const safeRole: UserRole = isUserRole(currentRole) ? currentRole : 'viewer'

  function handleChange(newRole: string) {
    if (!isUserRole(newRole) || newRole === safeRole) return
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Rol actualizado.')
        router.refresh()
      }
    })
  }

  return (
    <Select value={safeRole} onValueChange={handleChange} disabled={disabled || isPending}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
