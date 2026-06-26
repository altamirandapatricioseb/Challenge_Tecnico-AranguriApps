import { Package, AlertTriangle, ArrowLeftRight, DollarSign } from 'lucide-react'
import { KpiCard } from '@/components/app/KpiCard'
import { MovementsChart } from '@/components/app/charts/MovementsChart'
import { CategoryChart } from '@/components/app/charts/CategoryChart'
import { DashboardTables } from './DashboardTables'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format.utils'
import { getProfile } from '@/lib/auth'
import {
  getDashboardKPIs,
  getRecentMovements,
  getMovementChartData,
  getCategoryDistribution,
  getStockAlerts,
} from '@/server/actions/dashboard'

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

      {/* Tablas: ultimos movimientos + alertas (en client component por las funciones de columna) */}
      <DashboardTables recentMovements={recentMovements} alerts={alerts} />
    </div>
  )
}
