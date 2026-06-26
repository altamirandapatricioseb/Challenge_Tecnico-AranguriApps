'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { EmptyState } from '@/components/app/EmptyState'
import { formatCurrency } from '@/lib/format.utils'
import { PieChart as PieChartIcon } from 'lucide-react'
import type { CategoryStockSummary } from '@/types'

interface CategoryChartProps {
  data: CategoryStockSummary[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  // Solo categorias con productos; las vacias no aportan al grafico
  const withProducts = data.filter((d) => (d.product_count ?? 0) > 0)

  if (withProducts.length === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="Sin datos"
        description="Asigná categorías a tus productos para ver la distribución."
      />
    )
  }

  const chartData = withProducts.map((d) => ({
    name: d.category_name ?? 'Sin categoría',
    value: d.product_count ?? 0,
    color: d.category_color ?? '#94a3b8',
    stockValue: d.stock_value ?? 0,
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
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#fff',
              }}
              formatter={(value, name) => [`${value} productos`, String(name)]}
            />
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
            <span className="font-data text-slate-500">{formatCurrency(entry.stockValue)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
