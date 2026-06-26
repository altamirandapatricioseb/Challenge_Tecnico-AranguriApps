'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { categorySchema } from '@/lib/validations/category'
import type { ActionResult, Category } from '@/types'

// Lista las categorias activas ordenadas por nombre
// Se usa para poblar los selects de productos y la pagina de categorias
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('getCategories:', error.message)
    return []
  }
  return data ?? []
}

// Crea una categoria nueva
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

  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select()
    .single()

  if (error) {
    // Codigo 23505 = violacion de unique (nombre duplicado)
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

// Soft delete: marca la categoria como inactiva en vez de borrarla. Solo admin.
// Los productos que la usaban conservan el category_id pero la categoria deja de listarse
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
