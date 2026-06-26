'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { EmptyState } from '@/components/app/EmptyState'
import { LineChart as LineChartIcon } from 'lucide-react'
import type { MovementDailySummary } from '@/types'

interface MovementsChartProps {
  data: MovementDailySummary[]
}

// Formatea la fecha ISO a "12 jun" para el eje X
function formatAxisDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(d)
}

export function MovementsChart({ data }: MovementsChartProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="Sin movimientos"
        description="Cuando registres movimientos vas a ver la tendencia acá."
      />
    )
  }

  // Adaptamos la data al formato del chart, con la fecha ya formateada
  const chartData = data.map((d) => ({
    date: formatAxisDate(d.date),
    Entradas: d.entries,
    Salidas: d.exits,
    Ajustes: d.adjustments,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f172a',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#fff',
          }}
          labelStyle={{ color: '#cbd5e1', marginBottom: 4 }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: 8 }} />
        <Line type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Salidas" stroke="#ef4444" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Ajustes" stroke="#3b82f6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
