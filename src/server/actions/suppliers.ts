'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { supplierSchema } from '@/lib/validations/supplier'
import type { ActionResult, Supplier } from '@/types'

// Lista proveedores activos ordenados por nombre
export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('getSuppliers:', error.message)
    return []
  }
  return data ?? []
}

// Crea un proveedor. Si existe uno inactivo con el mismo nombre lo reactiva
export async function createSupplier(formData: unknown): Promise<ActionResult<Supplier>> {
  await requireRole('manager')

  const parsed = supplierSchema.safeParse(formData)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos invalidos.' }
  }

  const supabase = await createClient()
  const payload = {
    ...parsed.data,
    contact_name: parsed.data.contact_name || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
  }

  // Buscamos un proveedor existente (activo o no) con ese nombre, case-insensitive
  const { data: existing } = await supabase
    .from('suppliers')
    .select('id, is_active')
    .ilike('name', payload.name)
    .maybeSingle()

  if (existing) {
    if (existing.is_active) {
      return { data: null, error: 'Ya existe un proveedor con ese nombre.' }
    }
    // Existe inactivo: lo reactivamos con los datos nuevos
    const { data, error } = await supabase
      .from('suppliers')
      .update({ ...payload, is_active: true })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return { data: null, error: 'No se pudo crear el proveedor.' }
    }
    revalidatePath('/suppliers')
    return { data, error: null }
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return { data: null, error: 'No se pudo crear el proveedor.' }
  }

  revalidatePath('/suppliers')
  return { data, error: null }
}

// Actualiza un proveedor existente
export async function updateSupplier(id: string, formData: unknown): Promise<ActionResult<Supplier>> {
  await requireRole('manager')

  const parsed = supplierSchema.safeParse(formData)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos invalidos.' }
  }

  const supabase = await createClient()
  const payload = {
    ...parsed.data,
    contact_name: parsed.data.contact_name || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
  }

  const { data, error } = await supabase
    .from('suppliers')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: 'No se pudo actualizar el proveedor.' }
  }

  revalidatePath('/suppliers')
  return { data, error: null }
}

// Soft delete: marca el proveedor como inactivo. Solo admin
export async function deleteSupplier(id: string): Promise<ActionResult> {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    return { data: null, error: 'No se pudo eliminar el proveedor.' }
  }

  revalidatePath('/suppliers')
  return { data: null, error: null }
}
