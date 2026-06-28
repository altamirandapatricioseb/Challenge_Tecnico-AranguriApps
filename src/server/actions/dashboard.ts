'use server'
 
import { createClient } from '@/lib/supabase/server'
import type {
  CategoryStockSummary,
  DashboardKPIs,
  MovementDailySummary,
  MovementWithProduct,
  StockAlert,
} from '@/types'
 
// Calcula los KPIs del dashboard en una sola pasada
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const supabase = await createClient()
 
  // Traemos productos activos para contar y calcular valor de stock
  const { data: products } = await supabase
    .from('products')
    .select('current_stock, min_stock, unit_price')
    .eq('is_active', true)
 
  const list = products ?? []
  const total_products = list.length
  const low_stock_count = list.filter((p) => p.current_stock <= p.min_stock).length
  const stock_value = list.reduce((acc, p) => acc + p.current_stock * p.unit_price, 0)
 
  // Movimientos de hoy: desde la medianoche en horario local
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('stock_movements')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString())
 
  return {
    total_products,
    low_stock_count,
    total_movements_today: count ?? 0,
    stock_value,
  }
}
 
// Ultimos movimientos para la tabla del dashboard
export async function getRecentMovements(limit = 5): Promise<MovementWithProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('movements_with_product')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
 
  if (error) {
    console.error('getRecentMovements:', error.message)
    return []
  }
  return data ?? []
}
 
// Datos del chart de movimientos por dia, ultimos N dias.
// La vista movement_daily_summary ya agrupa por dia en horario de Argentina.
// Pedimos un margen extra de dias para que el corte (calculado contra el dia
// argentino) nunca deje afuera el dia del borde por diferencia de zona horaria.
// El componente del grafico se queda con la ventana exacta que muestra.
export async function getMovementChartData(days = 7): Promise<MovementDailySummary[]> {
  const supabase = await createClient()
 
  // Fecha de corte en horario de Argentina (no UTC), con margen de seguridad
  const marginDays = days + 3
  const argentinaToday = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
 
  // Construimos la fecha de corte restando los dias sobre el dia argentino
  const [y, m, d] = argentinaToday.split('-').map(Number)
  const cutoff = new Date(y, m - 1, d)
  cutoff.setDate(cutoff.getDate() - marginDays)
  const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`
 
  const { data, error } = await supabase
    .from('movement_daily_summary')
    .select('*')
    .gte('date', cutoffKey)
    .order('date')
 
  if (error) {
    console.error('getMovementChartData:', error.message)
    return []
  }
  return data ?? []
}
 
// Distribucion de productos y valor por categoria para el pie chart
export async function getCategoryDistribution(): Promise<CategoryStockSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('category_stock_summary')
    .select('*')
 
  if (error) {
    console.error('getCategoryDistribution:', error.message)
    return []
  }
  return data ?? []
}
 
// Productos en o bajo el minimo, para la tabla de alertas
export async function getStockAlerts(): Promise<StockAlert[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('low_stock_products')
    .select('*')
 
  if (error) {
    console.error('getStockAlerts:', error.message)
    return []
  }
  return data ?? []
}
 