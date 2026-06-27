'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { EmptyState } from '@/components/app/EmptyState'
import { formatCurrency } from '@/lib/format.utils'
import { PieChart as PieChartIcon } from 'lucide-react'
import type { CategoryStockSummary } from '@/types'

interface CategoryChartProps {
  data: CategoryStockSummary[]
}

// Tooltip custom: muestra el valor monetario como dato principal y la cantidad de productos debajo
function CategoryTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: { name: string; value: number; productCount: number } }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0].payload
  return (
    <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#fff' }}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{item.name}</p>
      <p>{formatCurrency(item.value)}</p>
      <p style={{ color: '#cbd5e1' }}>{item.productCount} {item.productCount === 1 ? 'producto' : 'productos'}</p>
    </div>
  )
}

export function CategoryChart({ data }: CategoryChartProps) {
  // Solo categorias con valor de stock; las que no aportan valor no van al grafico
  const withValue = data.filter((d) => (d.stock_value ?? 0) > 0)

  if (withValue.length === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="Sin datos"
        description="Cargá stock en tus productos para ver la distribución de valor por categoría."
      />
    )
  }

  // El grafico mide valor monetario: las porciones representan cuanta plata hay en cada categoria
  const chartData = withValue.map((d) => ({
    name: d.category_name ?? 'Sin categoría',
    value: d.stock_value ?? 0,
    color: d.category_color ?? '#94a3b8',
    productCount: d.product_count ?? 0,
  }))

  return (
    <div className="space-y-4">
      {/* El chart con alto fijo y ancho completo, centrado */}
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CategoryTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda debajo del chart, con nombre y valor de stock por categoria */}
      <div className="space-y-2">
        {chartData.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-700">{entry.name}</span>
            </span>
            <span className="font-data text-slate-500">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}