'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ExcelJS from 'exceljs'
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
  canWrite: boolean
}

// Etiquetas legibles de cada tipo para el Excel
const TYPE_LABELS: Record<MovementType, string> = {
  entry: 'Entrada',
  exit: 'Salida',
  adjustment: 'Ajuste',
}

// Devuelve la etiqueta del tipo, o cadena vacia si viniera null
function typeLabel(type: MovementType | null): string {
  return type ? TYPE_LABELS[type] : ''
}

export function MovementsClient({ movements, products, canWrite }: MovementsClientProps) {
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

  // Exporta los movimientos filtrados a un Excel con formato (tonos de azul)
  async function exportExcel() {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'InventFlow'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Movimientos', {
      views: [{ state: 'frozen', ySplit: 1 }], // congela la fila de encabezado
    })

    // Definicion de columnas con ancho
    sheet.columns = [
      { header: 'Fecha', key: 'date', width: 22 },
      { header: 'Producto', key: 'product', width: 32 },
      { header: 'SKU', key: 'sku', width: 14 },
      { header: 'Tipo', key: 'type', width: 12 },
      { header: 'Cantidad', key: 'quantity', width: 12 },
      { header: 'Motivo', key: 'reason', width: 28 },
      { header: 'Referencia', key: 'reference', width: 18 },
    ]

    // Estilo del encabezado: fondo azul oscuro, texto blanco, negrita
    const headerRow = sheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 }
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF1E40AF' } } }
    })
    headerRow.height = 22

    // Filas de datos
    filtered.forEach((m, i) => {
      const row = sheet.addRow({
        date: m.created_at ? formatDateTime(m.created_at) : '',
        product: m.product_name,
        sku: m.product_sku ?? '',
        type: typeLabel(m.movement_type),
        quantity: m.quantity,
        reason: m.reason ?? '',
        reference: m.reference_number ?? '',
      })

      // Zebra striping: filas pares con un azul muy claro
      if (i % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }
        })
      }

      // Centramos la cantidad y el tipo
      row.getCell('quantity').alignment = { horizontal: 'center' }
      row.getCell('type').alignment = { horizontal: 'center' }
    })

    // Genera el archivo y dispara la descarga
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `movimientos_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns: Column<MovementWithProduct>[] = [
    { key: 'date', header: 'Fecha', sortValue: (m) => m.created_at ?? '', cell: (m) => <span className="text-slate-500">{m.created_at ? formatDateTime(m.created_at) : '—'}</span> },
    {
      key: 'product', header: 'Producto', sortValue: (m) => m.product_name ?? '',
      cell: (m) => (
        <div>
          <span className="font-medium text-slate-900">{m.product_name}</span>
          {m.product_sku && <span className="ml-2 font-data text-xs text-slate-400">{m.product_sku}</span>}
        </div>
      ),
    },
    { key: 'type', header: 'Tipo', sortValue: (m) => m.movement_type ?? '', cell: (m) => <MovementTypeBadge type={m.movement_type} /> },
    { key: 'qty', header: 'Cantidad', align: 'right', sortValue: (m) => m.quantity ?? 0, cell: (m) => <span className="font-data">{m.quantity}</span> },
    { key: 'reason', header: 'Motivo', sortValue: (m) => m.reason ?? '', cell: (m) => <span className="text-slate-600">{m.reason || '—'}</span> },
    { key: 'ref', header: 'Referencia', sortValue: (m) => m.reference_number ?? '', cell: (m) => <span className="font-data text-slate-500">{m.reference_number || '—'}</span> },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Movimientos</h2>
          <p className="text-sm text-slate-500">Historial de entradas, salidas y ajustes de stock.</p>
        </div>
        {canWrite && (
          <FormSheet title="Registrar movimiento" triggerLabel="Registrar movimiento" triggerIcon={ArrowLeftRight}>
            {(close) => (
              <MovementForm products={products} onSubmit={(v) => handleCreate(v, close)} isLoading={isPending} />
            )}
          </FormSheet>
        )}
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

        <Button variant="outline" size="sm" onClick={exportExcel} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
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
