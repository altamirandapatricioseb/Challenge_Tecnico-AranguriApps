'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { movementSchema } from '@/lib/validations/movement'
import { canFulfillExit } from '@/lib/stock.utils'
import type { ActionResult, MovementType, MovementWithProduct, StockMovement } from '@/types'

// Filtros opcionales para el listado de movimientos
type MovementFilters = {
  productId?: string
  type?: MovementType
  dateFrom?: string
  dateTo?: string
}

// Lista movimientos con datos del producto, mas recientes primero
export async function getMovements(filters?: MovementFilters): Promise<MovementWithProduct[]> {
  const supabase = await createClient()

  let query = supabase
    .from('movements_with_product')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.productId) {
    query = query.eq('product_id', filters.productId)
  }
  if (filters?.type) {
    query = query.eq('movement_type', filters.type)
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const { data, error } = await query
  if (error) {
    console.error('getMovements:', error.message)
    return []
  }
  return data ?? []
}

// Registra un movimiento de stock. El trigger de la DB actualiza current_stock
export async function createMovement(formData: unknown): Promise<ActionResult<StockMovement>> {
  const { user } = await requireRole('manager')

  const parsed = movementSchema.safeParse(formData)
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos invalidos.' }
  }

  const supabase = await createClient()

  // Para salidas: validamos stock disponible antes de insertar, para dar un error amigable
  // El trigger de la DB tambien lo valida, pero asi evitamos el error crudo de Postgres
  if (parsed.data.movement_type === 'exit') {
    const { data: product } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', parsed.data.product_id)
      .maybeSingle()

    if (product && !canFulfillExit(product.current_stock, parsed.data.quantity)) {
      return {
        data: null,
        error: `Stock insuficiente. Disponible: ${product.current_stock}, solicitado: ${parsed.data.quantity}.`,
      }
    }
  }

  const payload = {
    ...parsed.data,
    reason: parsed.data.reason || null,
    notes: parsed.data.notes || null,
    reference_number: parsed.data.reference_number || null,
    created_by: user.id, // inyectamos el usuario de la sesion, no viene del cliente
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .insert(payload)
    .select()
    .single()

  if (error) {
    // El trigger lanza P0001 si el stock es insuficiente (defensa en profundidad)
    if (error.message.includes('Stock insuficiente')) {
      return { data: null, error: 'Stock insuficiente para esta salida.' }
    }
    return { data: null, error: 'No se pudo registrar el movimiento.' }
  }

  // Un movimiento afecta el stock, asi que revalidamos las vistas que lo muestran
  revalidatePath('/movements')
  revalidatePath('/products')
  revalidatePath('/')
  return { data, error: null }
}
