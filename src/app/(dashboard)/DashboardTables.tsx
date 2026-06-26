'use client'

import { DataTable, type Column } from '@/components/app/DataTable'
import { MovementTypeBadge } from '@/components/app/MovementTypeBadge'
import { formatDateTime } from '@/lib/format.utils'
import { ArrowLeftRight, Package } from 'lucide-react'
import type { MovementWithProduct, StockAlert } from '@/types'

interface DashboardTablesProps {
  recentMovements: MovementWithProduct[]
  alerts: StockAlert[]
}

export function DashboardTables({ recentMovements, alerts }: DashboardTablesProps) {
  const recentColumns: Column<MovementWithProduct>[] = [
    { key: 'date', header: 'Fecha', sortValue: (m) => m.created_at ?? '', cell: (m) => <span className="text-slate-500">{m.created_at ? formatDateTime(m.created_at) : '—'}</span> },
    { key: 'product', header: 'Producto', sortValue: (m) => m.product_name ?? '', cell: (m) => <span className="font-medium text-slate-900">{m.product_name}</span> },
    { key: 'type', header: 'Tipo', sortValue: (m) => m.movement_type ?? '', cell: (m) => <MovementTypeBadge type={m.movement_type} /> },
    { key: 'qty', header: 'Cantidad', align: 'right', sortValue: (m) => m.quantity ?? 0, cell: (m) => <span className="font-data">{m.quantity}</span> },
  ]

  const alertColumns: Column<StockAlert>[] = [
    { key: 'name', header: 'Producto', sortValue: (a) => a.name ?? '', cell: (a) => <span className="font-medium text-slate-900">{a.name}</span> },
    { key: 'sku', header: 'SKU', sortValue: (a) => a.sku ?? '', cell: (a) => <span className="font-data text-slate-500">{a.sku || '—'}</span> },
    { key: 'stock', header: 'Stock', align: 'right', sortValue: (a) => a.current_stock ?? 0, cell: (a) => <span className="font-data text-red-600">{a.current_stock}</span> },
    { key: 'min', header: 'Mínimo', align: 'right', sortValue: (a) => a.min_stock ?? 0, cell: (a) => <span className="font-data text-slate-500">{a.min_stock}</span> },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Últimos movimientos</h3>
        <DataTable
          columns={recentColumns}
          data={recentMovements}
          rowKey={(m) => m.id!}
          pageSize={5}
          emptyIcon={ArrowLeftRight}
          emptyTitle="Sin movimientos"
          emptyDescription="Todavía no se registraron movimientos."
        />
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Alertas de stock</h3>
        <DataTable
          columns={alertColumns}
          data={alerts}
          rowKey={(a) => a.id!}
          pageSize={5}
          emptyIcon={Package}
          emptyTitle="Todo en orden"
          emptyDescription="No hay productos con stock crítico o bajo."
        />
      </div>
    </div>
  )
}
