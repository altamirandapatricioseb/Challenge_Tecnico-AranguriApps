'use server'

import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types'

// Lista todas las categorias ordenadas por nombre
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('getCategories:', error.message)
    return []
  }
  return data ?? []
}