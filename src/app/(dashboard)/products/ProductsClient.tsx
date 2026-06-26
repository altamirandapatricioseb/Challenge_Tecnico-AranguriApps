'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/app/DataTable'
import { FormSheet } from '@/components/app/FormSheet'
import { ProductForm } from '@/components/app/forms/ProductForm'
import { MovementForm } from '@/components/app/forms/MovementForm'
import { StockBadge } from '@/components/app/StockBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { createProduct, updateProduct } from '@/server/actions/products'
import { createMovement } from '@/server/actions/movements'
import { formatCurrency } from '@/lib/format.utils'
import { getStockStatus } from '@/lib/stock.utils'
import type { ProductFormValues } from '@/lib/validations/product'
import type { MovementFormValues } from '@/lib/validations/movement'
import { Package, Pencil, ArrowLeftRight, Search } from 'lucide-react'
import type { Category, ProductWithDetails, Supplier, StockStatus } from '@/types'

interface ProductsClientProps {
  products: ProductWithDetails[]
  categories: Category[]
  suppliers: Supplier[]
}

// Peso numerico de cada estado para ordenar: critico primero, ok ultimo
const STATUS_RANK: Record<StockStatus, number> = { critical: 0, low: 1, ok: 2 }

export function ProductsClient({ products, categories, suppliers }: ProductsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ProductWithDetails | null>(null)
  const [movementFor, setMovementFor] = useState<ProductWithDetails | null>(null)

  // Filtro de busqueda en memoria por nombre o sku
  const filtered = products.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
  })

  async function handleCreate(values: ProductFormValues, close: () => void) {
    startTransition(async () => {
      const result = await createProduct(values)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Producto creado.')
        close()
        router.refresh()
      }
    })
  }

  async function handleUpdate(values: ProductFormValues) {
    if (!editing) return
    startTransition(async () => {
      const result = await updateProduct(editing.id!, values)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Producto actualizado.')
        setEditing(null)
        router.refresh()
      }
    })
  }

  async function handleMovement(values: MovementFormValues) {
    startTransition(async () => {
      const result = await createMovement(values)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Movimiento registrado.')
        setMovementFor(null)
        router.refresh()
      }
    })
  }

  const columns: Column<ProductWithDetails>[] = [
    { key: 'sku', header: 'SKU', sortValue: (p) => p.sku ?? '', cell: (p) => <span className="font-data text-slate-500">{p.sku || '—'}</span> },
    { key: 'name', header: 'Producto', sortValue: (p) => p.name ?? '', cell: (p) => <span className="font-medium text-slate-900">{p.name}</span> },
    {
      key: 'category', header: 'Categoría', sortValue: (p) => p.category_name ?? '',
      cell: (p) => p.category_name ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.category_color ?? '#94a3b8' }} />
          {p.category_name}
        </span>
      ) : <span className="text-slate-400">—</span>,
    },
    { key: 'stock', header: 'Stock', align: 'right', sortValue: (p) => p.current_stock ?? 0, cell: (p) => <span className="font-data">{p.current_stock} {p.unit}</span> },
    {
      key: 'status', header: 'Estado',
      // Ordena por el estado calculado (critico->bajo->ok), no por el stock crudo,
      // porque el estado depende de la relacion current_stock vs min_stock
      sortValue: (p) => STATUS_RANK[getStockStatus(p.current_stock ?? 0, p.min_stock ?? 0)],
      cell: (p) => <StockBadge currentStock={p.current_stock ?? 0} minStock={p.min_stock ?? 0} />,
    },
    { key: 'price', header: 'Precio', align: 'right', sortValue: (p) => p.unit_price ?? 0, cell: (p) => <span className="font-data">{formatCurrency(p.unit_price ?? 0)}</span> },
    { key: 'supplier', header: 'Proveedor', sortValue: (p) => p.supplier_name ?? '', cell: (p) => <span className="text-slate-600">{p.supplier_name || '—'}</span> },
    {
      key: 'actions', header: '', align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setMovementFor(p)} title="Registrar movimiento">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(p)} title="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Productos</h2>
          <p className="text-sm text-slate-500">Catálogo de productos del inventario.</p>
        </div>
        <FormSheet title="Nuevo producto" triggerLabel="Nuevo producto" triggerIcon={Package}>
          {(close) => (
            <ProductForm
              categories={categories}
              suppliers={suppliers}
              onSubmit={(v) => handleCreate(v, close)}
              isLoading={isPending}
            />
          )}
        </FormSheet>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por nombre o SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id!}
        pageSize={10}
        emptyIcon={Package}
        emptyTitle="Sin productos"
        emptyDescription="Agregá tu primer producto al inventario."
      />

      {/* Sheet de edición */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle>Editar producto</SheetTitle></SheetHeader>
          <div className="mt-6 px-4">
            {editing && (
              <ProductForm
                categories={categories}
                suppliers={suppliers}
                defaultValues={{
                  name: editing.name ?? '',
                  sku: editing.sku ?? '',
                  description: editing.description ?? '',
                  category_id: editing.category_id ?? '',
                  supplier_id: editing.supplier_id ?? '',
                  unit_price: editing.unit_price ?? 0,
                  min_stock: editing.min_stock ?? 0,
                  unit: editing.unit ?? 'unidad',
                }}
                onSubmit={handleUpdate}
                isLoading={isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de movimiento rápido, pre-cargado con el producto */}
      <Sheet open={!!movementFor} onOpenChange={(o) => !o && setMovementFor(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle>Registrar movimiento</SheetTitle></SheetHeader>
          <div className="mt-6 px-4">
            {movementFor && (
              <MovementForm
                products={products}
                defaultValues={{ product_id: movementFor.id ?? '' }}
                onSubmit={handleMovement}
                isLoading={isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
