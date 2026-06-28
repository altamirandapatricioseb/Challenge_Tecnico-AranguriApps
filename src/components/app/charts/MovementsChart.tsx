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

// Cantidad de dias que muestra el grafico
const DAYS_WINDOW = 7

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
  const local = new Date(y, m - 1, d) // mediodia local, sin riesgo de cruce de dia
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(local)
}

export function MovementsChart({ data }: MovementsChartProps) {
  // Armamos los ultimos N dias (incluyendo hoy) como claves YYYY-MM-DD en horario AR.
  // Asi el grafico siempre muestra el rango completo, con ceros en los dias sin movimientos.
  const today = new Date()
  const days: string[] = []
  for (let i = DAYS_WINDOW - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(toArgentinaKey(d))
  }

  // Indexamos la data real de la vista por su fecha (que ya viene en dia argentino)
  const byDate = new Map<string, MovementDailySummary>()
  for (const row of data) {
    if (row.date) byDate.set(row.date, row)
  }

  // Cruzamos: cada dia del rango toma su data o queda en cero
  const chartData = days.map((key) => {
    const row = byDate.get(key)
    return {
      date: formatKeyLabel(key),
      Entradas: row?.entries ?? 0,
      Salidas: row?.exits ?? 0,
      Ajustes: row?.adjustments ?? 0,
    }
  })

  // Si en toda la ventana no hubo ni un movimiento, mostramos el empty state
  const hasAnyMovement = chartData.some(
    (d) => d.Entradas > 0 || d.Salidas > 0 || d.Ajustes > 0
  )
  if (!hasAnyMovement) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="Sin movimientos recientes"
        description={`No se registraron movimientos en los últimos ${DAYS_WINDOW} días.`}
      />
    )
  }

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
        <Line type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Salidas" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Ajustes" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}