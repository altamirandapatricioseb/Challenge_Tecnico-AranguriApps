'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import type { ActionResult, AdminUserOverview, ProfileUpdate, UserRole } from '@/types'

// Lista todos los usuarios desde la vista admin_users_overview
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