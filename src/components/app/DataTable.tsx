'use client'

import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState } from './EmptyState'
import { cn } from '@/lib/cn'
import { ChevronLeft, ChevronRight, Inbox, type LucideIcon } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  align?: 'left' | 'right' | 'center'
  headerClassName?: string
  cellClassName?: string
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

export function DataTable<T>({
  columns, data, rowKey, isLoading = false, pageSize = 10, onRowClick,
  emptyIcon = Inbox, emptyTitle = 'Sin datos', emptyDescription = 'No hay registros para mostrar.',
}: DataTableProps<T>) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * pageSize
  const pageData = data.slice(start, start + pageSize)

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
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn('font-medium text-slate-600', alignClass[c.align ?? 'left'], c.headerClassName)}
                >
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('hover:bg-slate-50/80', onRowClick && 'cursor-pointer')}
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
          <span>Mostrando {start + 1}–{Math.min(start + pageSize, data.length)} de {data.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-data">{safePage + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
