import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/types'
import type { User } from '@supabase/supabase-js'

// Obtiene el usuario autenticado actual, o null si no hay sesion
export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Exige sesion: si no hay usuario, redirige a login
export async function requireUser(): Promise<User> {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

// Obtiene el perfil del usuario actual. Usa maybeSingle para tolerar el caso
// en que el trigger de creacion de perfil aun no termino (no rompe, devuelve null)
export async function getProfile(): Promise<Profile | null> {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return data
}

// Devuelve el rol del usuario actual, con 'viewer' como default seguro.
// El cast es seguro: la columna role en la DB solo admite los valores de UserRole
export async function getUserRole(): Promise<UserRole> {
  const profile = await getProfile()
  return (profile?.role as UserRole) ?? 'viewer'
}

// Exige que el usuario tenga AL MENOS el rol indicado (jerarquia de permisos).
// Si no cumple, redirige. Devuelve el user y su rol para uso posterior
const ROLE_RANK: Record<UserRole, number> = { viewer: 0, manager: 1, admin: 2 }

export async function requireRole(minRole: UserRole): Promise<{ user: User; role: UserRole }> {
  const user = await requireUser()
  const role = await getUserRole()

  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    redirect('/') // no tiene permisos suficientes, lo mandamos al dashboard
  }

  return { user, role }
}
