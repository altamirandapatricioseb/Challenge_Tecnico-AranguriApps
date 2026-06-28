'use client'

import { useState, useMemo } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState } from './EmptyState'
import { cn } from '@/lib/cn'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown, Inbox, type LucideIcon } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  align?: 'left' | 'right' | 'center'
  headerClassName?: string
  cellClassName?: string
  // Valor por el que ordenar esta columna. Si no se define, la columna no es ordenable.
  sortValue?: (row: T) => string | number
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  isLoading?: boolean
  pageSize?: number
  onRowClick?: (row: T) => void
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const

// Estados de orden: null (original) -> asc -> desc -> null
type SortDir = 'asc' | 'desc' | null

export function DataTable<T>({
  columns, data, rowKey, isLoading = false, pageSize = 10, onRowClick,
  emptyIcon = Inbox, emptyTitle = 'Sin datos', emptyDescription = 'No hay registros para mostrar.',
}: DataTableProps<T>) {
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  // Maneja el ciclo de orden al clickear un header: asc -> desc -> original
  function handleSort(col: Column<T>) {
    if (!col.sortValue) return // columna no ordenable
    if (sortKey !== col.key) {
      setSortKey(col.key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortKey(null)
      setSortDir(null)
    } else {
      setSortDir('asc')
    }
    setPage(0) // al reordenar volvemos a la primera pagina
  }

  // Aplica el orden actual sobre los datos; si no hay orden, respeta el original
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortValue) return data

    // Multiplicamos el comparador por la direccion en vez de reversear:
    // asi el orden desc tambien es estable (no rompe el orden de los empates)
    const dir = sortDir === 'desc' ? -1 : 1
    const sorted = [...data].sort((a, b) => {
      const va = col.sortValue!(a)
      const vb = col.sortValue!(b)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'es', { numeric: true }) * dir
    })
    return sorted
  }, [data, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * pageSize
  const pageData = sortedData.slice(start, start + pageSize)

  // Loading: esqueleto con la misma estructura de columnas
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              {columns.map((c) => (
                <TableHead key={c.key} className={cn(alignClass[c.align ?? 'left'], c.headerClassName)}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: pageSize }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c.key}><Skeleton className="h-5 w-full max-w-[120px]" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Vacío
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 p-2">
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              {columns.map((c) => {
                const sortable = !!c.sortValue
                const isSorted = sortKey === c.key
                return (
                  <TableHead
                    key={c.key}
                    onClick={() => handleSort(c)}
                    // Accesibilidad: aria-sort refleja el estado, y permitimos
                    // ordenar con teclado (Enter / Espacio) cuando la columna es ordenable
                    aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                    tabIndex={sortable ? 0 : undefined}
                    onKeyDown={sortable ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSort(c)
                      }
                    } : undefined}
                    className={cn(
                      'font-medium text-slate-600 transition-colors duration-150',
                      alignClass[c.align ?? 'left'],
                      sortable && 'cursor-pointer select-none hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50',
                      c.headerClassName,
                    )}
                  >
                    <span className={cn('inline-flex items-center gap-1', c.align === 'right' && 'flex-row-reverse')}>
                      {c.header}
                      {sortable && (
                        isSorted
                          ? (sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5 transition-transform duration-200" /> : <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />)
                          : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300 transition-colors duration-150 group-hover:text-slate-400" />
                      )}
                    </span>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                // Transicion suave de fondo al pasar el mouse; si la fila es clickeable,
                // ademas resalta con el color de acento y se "ilumina" el borde izquierdo
                className={cn(
                  'transition-colors duration-150 hover:bg-slate-50/80 motion-reduce:transition-none',
                  onRowClick && 'cursor-pointer hover:bg-amber-50/50 hover:shadow-[inset_3px_0_0_0] hover:shadow-amber-400',
                )}
              >
                {columns.map((c) => (
                  <TableCell key={c.key} className={cn(alignClass[c.align ?? 'left'], c.cellClassName)}>
                    {c.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Mostrando {start + 1}–{Math.min(start + pageSize, sortedData.length)} de {sortedData.length}</span>
          <div className="flex items-center gap-1">
            {/* Usamos safePage (no page) como base para que los botones funcionen
                aun si el data se achica desde el padre y deja a page desincronizado */}
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-data">{safePage + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))} disabled={safePage >= totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
