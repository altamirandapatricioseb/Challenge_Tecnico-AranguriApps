import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  delta?: number   // variación % vs período anterior (verde si >=0, rojo si <0)
  hint?: string    // texto alternativo 
  isLoading?: boolean
  index?: number   // posicion en la grilla, para escalonar la animacion de entrada
}

export function KpiCard({ title, value, icon: Icon, delta, hint, isLoading = false, index = 0 }: KpiCardProps) {
  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="mt-4 h-8 w-28" />
        <Skeleton className="mt-2 h-4 w-20" />
      </Card>
    )
  }

  const hasDelta = typeof delta === 'number'
  const positive = (delta ?? 0) >= 0

  return (
    <Card
      data-testid="kpi-card"
      className="group/kpi animate-kpi-in cursor-default p-5 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 hover:ring-amber-500/40 motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-transform duration-200 group-hover/kpi:scale-110 motion-reduce:transition-none motion-reduce:group-hover/kpi:scale-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 font-data text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hasDelta ? (
        <p className={cn('mt-1 flex items-center gap-1 text-xs font-medium', positive ? 'text-emerald-600' : 'text-red-600')}>
          {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(delta!).toFixed(1)}%
          <span className="font-normal text-slate-400">vs. mes anterior</span>
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </Card>
  )
}
