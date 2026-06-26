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

// Crea un proveedor nuevo
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