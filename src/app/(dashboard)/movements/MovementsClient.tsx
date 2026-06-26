'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/app/DataTable'
import { FormSheet } from '@/components/app/FormSheet'
import { MovementForm } from '@/components/app/forms/MovementForm'
import { MovementTypeBadge } from '@/components/app/MovementTypeBadge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createMovement } from '@/server/actions/movements'
import { formatDateTime } from '@/lib/format.utils'
import type { MovementFormValues } from '@/lib/validations/movement'
import { ArrowLeftRight, Download } from 'lucide-react'
import type { MovementType, MovementWithProduct, ProductWithDetails } from '@/types'

interface MovementsClientProps {
  movements: MovementWithProduct[]
  products: ProductWithDetails[]
}

export function MovementsClient({ movements, products }: MovementsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all')

  // Filtro por tipo en memoria
  const filtered = movements.filter((m) => typeFilter === 'all' || m.movement_type === typeFilter)

  async function handleCreate(values: MovementFormValues, close: () => void) {
    startTransition(async () => {
      const result = await createMovement(values)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Movimiento registrado.')
        close()
        router.refresh()
      }
    })
  }

  // Exporta los movimientos filtrados a CSV, generado en el cliente
  function exportCSV() {
    const headers = ['Fecha', 'Producto', 'SKU', 'Tipo', 'Cantidad', 'Motivo', 'Referencia']
    const rows = filtered.map((m) => [
      m.created_at ? formatDateTime(m.created_at) : '',
      m.product_name,
      m.product_sku ?? '',
      m.movement_type,
      m.quantity,
      m.reason ?? '',
      m.reference_number ?? '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `movimientos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns: Column<MovementWithProduct>[] = [
    { key: 'date', header: 'Fecha', cell: (m) => <span className="text-slate-500">{m.created_at ? formatDateTime(m.created_at) : '—'}</span> },
    {
      key: 'product', header: 'Producto',
      cell: (m) => (
        <div>
          <span className="font-medium text-slate-900">{m.product_name}</span>
          {m.product_sku && <span className="ml-2 font-data text-xs text-slate-400">{m.product_sku}</span>}
        </div>
      ),
    },
    { key: 'type', header: 'Tipo', cell: (m) => <MovementTypeBadge type={m.movement_type} /> },
    { key: 'qty', header: 'Cantidad', align: 'right', cell: (m) => <span className="font-data">{m.quantity}</span> },
    { key: 'reason', header: 'Motivo', cell: (m) => <span className="text-slate-600">{m.reason || '—'}</span> },
    { key: 'ref', header: 'Referencia', cell: (m) => <span className="font-data text-slate-500">{m.reference_number || '—'}</span> },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Movimientos</h2>
          <p className="text-sm text-slate-500">Historial de entradas, salidas y ajustes de stock.</p>
        </div>
        <FormSheet title="Registrar movimiento" triggerLabel="Registrar movimiento" triggerIcon={ArrowLeftRight}>
          {(close) => (
            <MovementForm products={products} onSubmit={(v) => handleCreate(v, close)} isLoading={isPending} />
          )}
        </FormSheet>
      </div>

      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as MovementType | 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="entry">Entradas</SelectItem>
            <SelectItem value="exit">Salidas</SelectItem>
            <SelectItem value="adjustment">Ajustes</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(m) => m.id!}
        pageSize={15}
        emptyIcon={ArrowLeftRight}
        emptyTitle="Sin movimientos"
        emptyDescription="Todavía no se registraron movimientos de stock."
      />
    </>
  )
}
