export type * from './database.types'
import type { Database } from './database.types'

// Enums del dominio, definidos aca para no depender de como los exporte el archivo generado
export type UserRole     = 'admin' | 'manager' | 'viewer'
export type MovementType = 'entry' | 'exit' | 'adjustment'

// Aliases de Row types
export type Profile       = Database['public']['Tables']['profiles']['Row']
export type Category      = Database['public']['Tables']['categories']['Row']
export type Supplier      = Database['public']['Tables']['suppliers']['Row']
export type Product       = Database['public']['Tables']['products']['Row']
export type StockMovement = Database['public']['Tables']['stock_movements']['Row']

// Aliases de Insert/Update types
export type ProfileUpdate   = Database['public']['Tables']['profiles']['Update'] // para gestion de roles desde el panel admin
export type CategoryInsert  = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate  = Database['public']['Tables']['categories']['Update']
export type SupplierInsert  = Database['public']['Tables']['suppliers']['Insert']
export type SupplierUpdate  = Database['public']['Tables']['suppliers']['Update']
export type ProductInsert   = Database['public']['Tables']['products']['Insert']
export type ProductUpdate   = Database['public']['Tables']['products']['Update']
export type MovementInsert  = Database['public']['Tables']['stock_movements']['Insert']

// View types
export type ProductWithDetails   = Database['public']['Views']['products_with_details']['Row']
export type StockAlert           = Database['public']['Views']['low_stock_products']['Row']
export type MovementWithProduct  = Database['public']['Views']['movements_with_product']['Row']
export type MovementDailySummary = Database['public']['Views']['movement_daily_summary']['Row']
export type CategoryStockSummary = Database['public']['Views']['category_stock_summary']['Row']
export type AdminUserOverview    = Database['public']['Views']['admin_users_overview']['Row']

// Domain types

// Estado visual del stock de un producto
export type StockStatus = 'critical' | 'low' | 'ok'

// KPIs para el widget superior del dashboard
export type DashboardKPIs = {
  total_products:        number
  low_stock_count:       number
  total_movements_today: number
  stock_value:           number // ARS: SUM(current_stock * unit_price)
}

// Respuesta generica de Server Actions
export type ActionResult<T = null> =
  | { data: T;    error: null }
  | { data: null; error: string }
