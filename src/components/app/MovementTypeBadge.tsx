import { cn } from '@/lib/cn'
import { ArrowDown, ArrowUp, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import type { MovementType } from '@/types'

const CONFIG: Record<MovementType, { label: string; Icon: LucideIcon; className: string }> = {
  entry:      { label: 'Entrada', Icon: ArrowUp,           className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  exit:       { label: 'Salida',  Icon: ArrowDown,         className: 'bg-red-50 text-red-700 ring-red-200' },
  adjustment: { label: 'Ajuste',  Icon: SlidersHorizontal, className: 'bg-blue-50 text-blue-700 ring-blue-200' },
}

// Acepta string generico (como lo tipan las vistas) o null/undefined.
// Valida internamente que sea un MovementType conocido antes de renderizar
interface MovementTypeBadgeProps { type: string | null | undefined; className?: string }

// Type guard: confirma que un string sea uno de los tipos validos
function isMovementType(value: string): value is MovementType {
  return value === 'entry' || value === 'exit' || value === 'adjustment'
}

export function MovementTypeBadge({ type, className }: MovementTypeBadgeProps) {
  // Si no hay tipo o no es uno valido, mostramos un guion
  if (!type || !isMovementType(type)) {
    return <span className="text-slate-400">—</span>
  }

  const { label, Icon, className: cls } = CONFIG[type]
  return (
    <span
      data-testid="movement-type-badge"
      data-type={type}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        cls, className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
