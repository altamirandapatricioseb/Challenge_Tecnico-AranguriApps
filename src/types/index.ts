
export type * from './database.types'
import type { Database, MovementType, UserRole } from './database.types'

// ── row  ──────────────────────────────────────
export type Profile       = Database['public']['Tables']['profiles']['Row']
export type Category      = Database['public']['Tables']['categories']['Row']
export type Supplier      = Database['public']['Tables']['suppliers']['Row']
export type Product       = Database['public']['Tables']['products']['Row']
export type StockMovement = Database['public']['Tables']['stock_movements']['Row']

// ── insert/update ───────────────────────────
export type ProfileUpdate   = Database['public']['Tables']['profiles']['Update']  // para gestión de roles desde el panel admin
export type CategoryInsert  = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate  = Database['public']['Tables']['categories']['Update']
export type SupplierInsert  = Database['public']['Tables']['suppliers']['Insert']
export type SupplierUpdate  = Database['public']['Tables']['suppliers']['Update']
export type ProductInsert   = Database['public']['Tables']['products']['Insert']
export type ProductUpdate   = Database['public']['Tables']['products']['Update']
export type MovementInsert  = Database['public']['Tables']['stock_movements']['Insert']

// ── view  ────────────────────────────────────────────────
export type ProductWithDetails   = Database['public']['Views']['products_with_details']['Row']
export type StockAlert           = Database['public']['Views']['low_stock_products']['Row']
export type MovementWithProduct  = Database['public']['Views']['movements_with_product']['Row']
export type MovementDailySummary = Database['public']['Views']['movement_daily_summary']['Row']
export type CategoryStockSummary = Database['public']['Views']['category_stock_summary']['Row']

// ── domain  ──────────────────────────────────────────────

// estado del stock  
export type StockStatus = 'critical' | 'low' | 'ok'

// KPI 
export type DashboardKPIs = {
  total_products:        number
  low_stock_count:       number
  total_movements_today: number
  stock_value:           number   //  SUM(current_stock * unit_price)
}


export type ActionResult<T = null> =
  | { data: T;    error: null }
  | { data: null; error: string }

// Re-export enums 
export type { MovementType, UserRole }
