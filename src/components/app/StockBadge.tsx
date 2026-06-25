import { cn } from '@/lib/cn'
import { getStockStatus } from '@/lib/stock.utils'
import type { StockStatus } from '@/types'

const CONFIG: Record<StockStatus, { label: string; className: string }> = {
  critical: { label: 'Crítico', className: 'bg-red-50 text-red-700 ring-red-200' },
  low:      { label: 'Bajo',    className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  ok:       { label: 'OK',      className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

interface StockBadgeProps { currentStock: number; minStock: number; className?: string }

export function StockBadge({ currentStock, minStock, className }: StockBadgeProps) {
  const status = getStockStatus(currentStock, minStock)
  const cfg = CONFIG[status]
  return (
    <span
      data-testid="stock-badge"
      data-status={status}  // los testear sobre esto, no sobre clases CSS
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        cfg.className, className,
      )}
    >
      {cfg.label}
    </span>
  )
}
