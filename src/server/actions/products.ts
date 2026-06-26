'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { productSchema } from '@/lib/validations/product'
import type { ActionResult, Product, ProductWithDetails } from '@/types'

// Filtros opcionales para el listado de productos
type ProductFilters = {
  search?: string
  categoryId?: string
  lowStock?: boolean
}

// Lista productos activos con datos de categoria y proveedor, con filtros opcionales
export async function getProducts(filters?: ProductFilters): Promise<ProductWithDetails[]> {
  const supabase = await createClient()

  let query = supabase
    .from('products_with_details')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }
  if (filters?.search) {
    // Busca por nombre o sku 
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) {
    console.error('getProducts:', error.message)
    return []
  }

  let result = data ?? []
  // El filtro de stock bajo se aplica en memoria porque compara dos columnas
  if (filters?.lowStock) {
    // Los campos de la vista pueden ser null; tratamos null como 0 para comparar
     result = result.filter((p) => (p.current_stock ?? 0) <= (p.min_stock ?? 0))
  }
  return result
}

// Obtiene un producto por id con todos sus detalles
export async function getProductById(id: string): Promise<ProductWithDetails | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products_with_details')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('getProductById:', error.message)
    return null
  }
  return data
}

// Crea un producto nuevo. Valida con Zod y exige rol manager o superior
export async function createProduct(formData: unknown): Promise<ActionResult<Product>> {
  await requireRole('manager')

  const parsed = productSchema.safeParse(formData)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos invalidos.' }
  }

  const supabase = await createClient()
  // Los campos opcionales vacios se convierten a null para la DB
  const payload = {
    ...parsed.data,
    sku: parsed.data.sku || null,
    description: parsed.data.description || null,
    category_id: parsed.data.category_id || null,
    supplier_id: parsed.data.supplier_id || null,
  }

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select()
    .single()

  if (error) {
    // Codigo 23505 = violacion de unique (sku duplicado)
    if (error.code === '23505') {
      return { data: null, error: 'Ya existe un producto con ese SKU.' }
    }
    return { data: null, error: 'No se pudo crear el producto.' }
  }

  revalidatePath('/products')
  return { data, error: null }
}

// Actualiza un producto existente. No toca current_stock (eso lo manejan los movimientos)
export async function updateProduct(id: string, formData: unknown): Promise<ActionResult<Product>> {
  await requireRole('manager')

  const parsed = productSchema.safeParse(formData)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos invalidos.' }
  }

  const supabase = await createClient()
  const payload = {
    ...parsed.data,
    sku: parsed.data.sku || null,
    description: parsed.data.description || null,
    category_id: parsed.data.category_id || null,
    supplier_id: parsed.data.supplier_id || null,
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'Ya existe un producto con ese SKU.' }
    }
    return { data: null, error: 'No se pudo actualizar el producto.' }
  }

  revalidatePath('/products')
  revalidatePath(`/products/${id}`)
  return { data, error: null }
}

// Soft delete: marca el producto como inactivo en vez de borrarlo
export async function deactivateProduct(id: string): Promise<ActionResult> {
  await requireRole('manager')
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    return { data: null, error: 'No se pudo desactivar el producto.' }
  }

  revalidatePath('/products')
  return { data: null, error: null }
}