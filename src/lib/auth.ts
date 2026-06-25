import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/types'

// Jerarquia de permisos: admin incluye manager incluye viewer
const ROLE_RANK: Record<UserRole, number> = { viewer: 0, manager: 1, admin: 2 }


export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Retorna el usuario o redirige a /login si no hay sesión. */
export async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}


export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle() // devuelve null si todavía no existe el row (evita race condition con el trigger handle_new_user que crea el profile al registrarse)

  return data
}

// Retorna el rol del usuario actual; 'viewer' por defecto
export async function getUserRole(): Promise<UserRole> {
  const profile = await getProfile()
  return profile?.role ?? 'viewer'
}

//Exige que el usuario tenga AL MENOS el rol indicado 
export async function requireRole(minRole: UserRole) {
  const user = await requireUser()
  const role = await getUserRole()
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    redirect('/')
  }
  return { user, role }
}