import type { UserRole } from '@/types'

// Devuelve true si el rol puede crear/editar/eliminar (manager o admin)
export function canWrite(role: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}