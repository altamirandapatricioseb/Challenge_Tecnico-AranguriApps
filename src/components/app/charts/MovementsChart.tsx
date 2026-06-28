'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { EmptyState } from '@/components/app/EmptyState'
import { LineChart as LineChartIcon } from 'lucide-react'
import type { MovementDailySummary } from '@/types'

interface MovementsChartProps {
  data: MovementDailySummary[]
}

// Opciones de rango que puede elegir el usuario (en dias)
const RANGE_OPTIONS = [7, 30, 90] as const
type RangeOption = (typeof RANGE_OPTIONS)[number]
const DEFAULT_RANGE: RangeOption = 30

// Convierte un Date a la clave 'YYYY-MM-DD' en horario de Argentina.
// Usamos en-CA porque produce el formato ISO (YYYY-MM-DD) directo.
function toArgentinaKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

// Formatea una clave 'YYYY-MM-DD' a etiqueta corta '12 jun' SIN reinterpretar zona.
// Parseamos los numeros a mano y construimos la fecha en horario local fijo para
// evitar el corrimiento de dia que provoca new Date('YYYY-MM-DD') (lo toma como UTC).
function formatKeyLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const local = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(local)
}

export function MovementsChart({ data }: MovementsChartProps) {
  const [range, setRange] = useState<RangeOption>(DEFAULT_RANGE)

  // Indexamos la data real de la vista por su fecha (que ya viene en dia argentino)
  const byDate = new Map<string, MovementDailySummary>()
  for (const row of data) {
    if (row.date) byDate.set(row.date, row)
  }

  // Armamos los ultimos N dias (segun el rango elegido) como claves YYYY-MM-DD en
  // horario AR. Asi el grafico muestra el rango completo, con ceros en los dias sin
  // movimientos, y siempre se ve parejo.
  const today = new Date()
  const days: string[] = []
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(toArgentinaKey(d))
  }

  const chartData = days.map((key) => {
    const row = byDate.get(key)
    return {
      date: formatKeyLabel(key),
      Entradas: row?.entries ?? 0,
      Salidas: row?.exits ?? 0,
      Ajustes: row?.adjustments ?? 0,
    }
  })

  const hasAnyMovement = chartData.some(
    (d) => d.Entradas > 0 || d.Salidas > 0 || d.Ajustes > 0
  )

  // En rangos largos, mostrar un punto por dia satura: solo ponemos puntos en 7 dias
  const showDots = range <= 7

  // El selector frena la propagacion para no disparar el Link que envuelve la card
  function handleRange(e: React.MouseEvent, value: RangeOption) {
    e.preventDefault()
    e.stopPropagation()
    setRange(value)
  }

  return (
    <div className="space-y-3">
      {/* Selector de rango */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={(e) => handleRange(e, opt)}
              className={
                'rounded-md px-2.5 py-1 text-xs font-medium transition ' +
                (range === opt
                  ? 'bg-amber-500 text-slate-900'
                  : 'text-slate-500 hover:text-slate-800')
              }
            >
              {opt}d
            </button>
          ))}
        </div>
      </div>

      {!hasAnyMovement ? (
        <EmptyState
          icon={LineChartIcon}
          title="Sin movimientos recientes"
          description={`No se registraron movimientos en los últimos ${range} días.`}
        />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} minTickGap={20} />
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
            <Line type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={2} dot={showDots ? { r: 3 } : false} />
            <Line type="monotone" dataKey="Salidas" stroke="#ef4444" strokeWidth={2} dot={showDots ? { r: 3 } : false} />
            <Line type="monotone" dataKey="Ajustes" stroke="#3b82f6" strokeWidth={2} dot={showDots ? { r: 3 } : false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
