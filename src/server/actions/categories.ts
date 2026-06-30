'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { categorySchema } from '@/lib/validations/category'
import type { ActionResult, Category, CategoryWithCount } from '@/types'

// Lista las categorias activas con su cantidad de productos activos asociados,
// ordenadas por nombre. Lee de la vista categories_with_counts (el conteo lo hace la DB).
export async function getCategories(): Promise<CategoryWithCount[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories_with_counts')
    .select('*')
    .order('name')

  if (error) {
    console.error('getCategories:', error.message)
    return []
  }
  return data ?? []
}

// Crea una categoria. Si ya existe una inactiva con el mismo nombre la reactiva
export async function createCategory(formData: unknown): Promise<ActionResult<Category>> {
  await requireRole('manager')

  const parsed = categorySchema.safeParse(formData)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos invalidos.' }
  }

  const supabase = await createClient()
  const payload = {
    ...parsed.data,
    description: parsed.data.description || null,
  }

  //  sin distinguir mayusculas
  const { data: existing } = await supabase
    .from('categories')
    .select('id, is_active')
    .ilike('name', payload.name)
    .maybeSingle()

  if (existing) {
    if (existing.is_active) {
      // Ya existe y esta activa: es un duplicado real
      return { data: null, error: 'Ya existe una categoria con ese nombre.' }
    }
    // Existe pero inactiva: la reactivamos y actualizamos sus datos
    const { data, error } = await supabase
      .from('categories')
      .update({ ...payload, is_active: true })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return { data: null, error: 'No se pudo crear la categoria.' }
    }
    revalidatePath('/categories')
    revalidatePath('/products')
    return { data, error: null }
  }

  // No existe: insertamos nueva
  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'Ya existe una categoria con ese nombre.' }
    }
    return { data: null, error: 'No se pudo crear la categoria.' }
  }

  revalidatePath('/categories')
  revalidatePath('/products')
  return { data, error: null }
}

// Actualiza una categoria existente
export async function updateCategory(id: string, formData: unknown): Promise<ActionResult<Category>> {
  await requireRole('manager')

  const parsed = categorySchema.safeParse(formData)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos invalidos.' }
  }

  const supabase = await createClient()
  const payload = {
    ...parsed.data,
    description: parsed.data.description || null,
  }

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'Ya existe una categoria con ese nombre.' }
    }
    return { data: null, error: 'No se pudo actualizar la categoria.' }
  }

  revalidatePath('/categories')
  revalidatePath('/products')
  return { data, error: null }
}

// Soft delete: marca la categoria como inactiva. Solo admin
export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    return { data: null, error: 'No se pudo eliminar la categoria.' }
  }

  revalidatePath('/categories')
  revalidatePath('/products')
  return { data: null, error: null }
}
