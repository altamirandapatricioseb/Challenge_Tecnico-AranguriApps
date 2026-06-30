'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import type { ActionResult, AdminUserOverview, ProfileUpdate, UserRole } from '@/types'

// Lista los usuarios activos desde la vista admin_users_overview.
// La vista ya filtra is_active = true, asi que los eliminados no aparecen.
export async function getUsers(): Promise<AdminUserOverview[]> {
  await requireRole('admin')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('admin_users_overview')
    .select('*')

  if (error) {
    console.error('getUsers:', error.message)
    return []
  }
  return data ?? []
}

// Cambia el rol de un usuario por su id
export async function updateUserRole(userId: string, newRole: UserRole): Promise<ActionResult> {
  const { user } = await requireRole('admin')

  // Un admin no puede cambiarse el rol a si mismo (evita auto-degradarse y quedar sin admins)
  if (user.id === userId) {
    return { data: null, error: 'No podes cambiar tu propio rol.' }
  }

  const supabase = await createClient()

  // Tipamos el payload explicitamente para que el inferidor de Supabase no lo resuelva como never
  const payload: ProfileUpdate = { role: newRole }

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)

  if (error) {
    return { data: null, error: 'No se pudo actualizar el rol.' }
  }

  revalidatePath('/admin/users')
  return { data: null, error: null }
}

// Elimina (desactiva) un usuario por soft delete: is_active = false.
// El usuario desactivado no puede volver a iniciar sesion ni usar el sistema.
export async function deactivateUser(userId: string): Promise<ActionResult> {
  const { user } = await requireRole('admin')

  // Proteccion 1: un admin no puede eliminarse a si mismo
  if (user.id === userId) {
    return { data: null, error: 'No podes eliminar tu propia cuenta.' }
  }

  const supabase = await createClient()

  // Proteccion 2: no dejar el sistema sin administradores.
  // Si el usuario a eliminar es admin, verificamos que quede al menos otro admin activo.
  const { data: target } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (target?.role === 'admin') {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('is_active', true)

    // count incluye al que estamos por eliminar; si es 1 o menos, es el ultimo admin
    if ((count ?? 0) <= 1) {
      return { data: null, error: 'No podes eliminar al ultimo administrador activo.' }
    }
  }

  // Soft delete: marcamos el perfil como inactivo
  const payload: ProfileUpdate = { is_active: false }

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)

  if (error) {
    return { data: null, error: 'No se pudo eliminar el usuario.' }
  }

  revalidatePath('/admin/users')
  return { data: null, error: null }
}
