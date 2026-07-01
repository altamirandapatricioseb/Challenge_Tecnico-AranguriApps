import { Package, AlertTriangle, ArrowLeftRight, DollarSign } from 'lucide-react'
import Link from 'next/link'
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

// El dashboard siempre trae datos frescos: nada de cache estatico.
// Asi los KPIs, el grafico y las tablas reflejan el estado real en cada visita.
export const dynamic = 'force-dynamic'

// Saludo segun la hora del dia
function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default async function DashboardPage() {
  // Traemos todo en paralelo. El grafico pide 90 dias (el rango maximo del selector);
  // el componente recorta a 7/30/90 segun lo que elija el usuario, sin volver a consultar.
  const [profile, kpis, recentMovements, chartData, categoryDist, alerts] = await Promise.all([
    getProfile(),
    getDashboardKPIs(),
    getRecentMovements(5),
    getMovementChartData(90),
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
        <KpiCard index={0} title="Productos activos" value={kpis.total_products} icon={Package} hint="Total en catálogo" />
        <KpiCard index={1} title="Stock crítico/bajo" value={kpis.low_stock_count} icon={AlertTriangle} hint="En o bajo el mínimo" />
        <KpiCard index={2} title="Movimientos hoy" value={kpis.total_movements_today} icon={ArrowLeftRight} hint="Registrados hoy" />
        <KpiCard index={3} title="Valor de stock" value={formatCurrency(kpis.stock_value)} icon={DollarSign} hint="Inventario valorizado" />
      </div>

      {/* Charts: ambas cards son clickeables y navegan a su seccion */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link
          href="/movements"
          className="group block lg:col-span-2 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Card className="h-full p-5 transition group-hover:border-amber-500/60 group-hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Movimientos</h3>
              <span className="text-xs text-slate-400 transition group-hover:text-amber-600">Ver movimientos →</span>
            </div>
            <MovementsChart data={chartData} />
          </Card>
        </Link>
        <Link
          href="/categories"
          className="group block rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Card className="h-full p-5 transition group-hover:border-amber-500/60 group-hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Distribución por categoría</h3>
              <span className="text-xs text-slate-400 transition group-hover:text-amber-600">Ver categorías →</span>
            </div>
            <CategoryChart data={categoryDist} />
          </Card>
        </Link>
      </div>

      {/* Tablas: ultimos movimientos + alertas (en client component por las funciones de columna) */}
      <DashboardTables recentMovements={recentMovements} alerts={alerts} />
    </div>
  )
}
