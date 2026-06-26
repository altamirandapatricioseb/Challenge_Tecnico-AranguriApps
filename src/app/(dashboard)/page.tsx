import { Package, AlertTriangle, ArrowLeftRight, DollarSign } from 'lucide-react'
import { KpiCard } from '@/components/app/KpiCard'
import { DataTable, type Column } from '@/components/app/DataTable'
import { MovementTypeBadge } from '@/components/app/MovementTypeBadge'
import { MovementsChart } from '@/components/app/charts/MovementsChart'
import { CategoryChart } from '@/components/app/charts/CategoryChart'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDateTime } from '@/lib/format.utils'
import { getProfile } from '@/lib/auth'
import {
  getDashboardKPIs,
  getRecentMovements,
  getMovementChartData,
  getCategoryDistribution,
  getStockAlerts,
} from '@/server/actions/dashboard'
import type { MovementWithProduct, StockAlert } from '@/types'

// Saludo segun la hora del dia
function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default async function DashboardPage() {
  // Traemos todo en paralelo
  const [profile, kpis, recentMovements, chartData, categoryDist, alerts] = await Promise.all([
    getProfile(),
    getDashboardKPIs(),
    getRecentMovements(5),
    getMovementChartData(30),
    getCategoryDistribution(),
    getStockAlerts(),
  ])

  const firstName = (profile?.full_name || 'Usuario').split(' ')[0]

  const recentColumns: Column<MovementWithProduct>[] = [
    { key: 'date', header: 'Fecha', cell: (m) => <span className="text-slate-500">{m.created_at ? formatDateTime(m.created_at) : '—'}</span> },
    { key: 'product', header: 'Producto', cell: (m) => <span className="font-medium text-slate-900">{m.product_name}</span> },
    { key: 'type', header: 'Tipo', cell: (m) => <MovementTypeBadge type={m.movement_type} /> },
    { key: 'qty', header: 'Cantidad', align: 'right', cell: (m) => <span className="font-data">{m.quantity}</span> },
  ]

  const alertColumns: Column<StockAlert>[] = [
    { key: 'name', header: 'Producto', cell: (a) => <span className="font-medium text-slate-900">{a.name}</span> },
    { key: 'sku', header: 'SKU', cell: (a) => <span className="font-data text-slate-500">{a.sku || '—'}</span> },
    { key: 'stock', header: 'Stock', align: 'right', cell: (a) => <span className="font-data text-red-600">{a.current_stock}</span> },
    { key: 'min', header: 'Mínimo', align: 'right', cell: (a) => <span className="font-data text-slate-500">{a.min_stock}</span> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{getGreeting()}, {firstName}</h2>
        <p className="text-sm text-slate-500">Resumen general del inventario.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Productos activos" value={kpis.total_products} icon={Package} hint="Total en catálogo" />
        <KpiCard title="Stock crítico/bajo" value={kpis.low_stock_count} icon={AlertTriangle} hint="En o bajo el mínimo" />
        <KpiCard title="Movimientos hoy" value={kpis.total_movements_today} icon={ArrowLeftRight} hint="Registrados hoy" />
        <KpiCard title="Valor de stock" value={formatCurrency(kpis.stock_value)} icon={DollarSign} hint="Inventario valorizado" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Movimientos (últimos 30 días)</h3>
          <MovementsChart data={chartData} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Distribución por categoría</h3>
          <CategoryChart data={categoryDist} />
        </Card>
      </div>

      {/* Tablas: ultimos movimientos + alertas de stock */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Últimos movimientos</h3>
          <DataTable
            columns={recentColumns}
            data={recentMovements}
            rowKey={(m) => m.id!}
            pageSize={5}
            emptyIcon={ArrowLeftRight}
            emptyTitle="Sin movimientos"
            emptyDescription="Todavía no se registraron movimientos."
          />
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Alertas de stock</h3>
          <DataTable
            columns={alertColumns}
            data={alerts}
            rowKey={(a) => a.id!}
            pageSize={5}
            emptyIcon={Package}
            emptyTitle="Todo en orden"
            emptyDescription="No hay productos con stock crítico o bajo."
          />
        </div>
      </div>
    </div>
  )
}
