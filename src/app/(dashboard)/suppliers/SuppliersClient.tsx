'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/app/DataTable'
import { FormSheet } from '@/components/app/FormSheet'
import { SupplierForm } from '@/components/app/forms/SupplierForm'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { createSupplier, updateSupplier } from '@/server/actions/suppliers'
import type { SupplierFormValues } from '@/lib/validations/supplier'
import { Truck, Pencil } from 'lucide-react'
import type { Supplier } from '@/types'

interface SuppliersClientProps {
  suppliers: Supplier[]
  canWrite: boolean
}

export function SuppliersClient({ suppliers, canWrite }: SuppliersClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<Supplier | null>(null)

  async function handleCreate(values: SupplierFormValues, close: () => void) {
    startTransition(async () => {
      const result = await createSupplier(values)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Proveedor creado.')
        close()
        router.refresh()
      }
    })
  }

  async function handleUpdate(values: SupplierFormValues) {
    if (!editing) return
    startTransition(async () => {
      const result = await updateSupplier(editing.id, values)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Proveedor actualizado.')
        setEditing(null)
        router.refresh()
      }
    })
  }

  const columns: Column<Supplier>[] = [
    { key: 'name', header: 'Nombre', sortValue: (s) => s.name, cell: (s) => <span className="font-medium text-slate-900">{s.name}</span> },
    { key: 'contact', header: 'Contacto', sortValue: (s) => s.contact_name ?? '', cell: (s) => <span className="text-slate-600">{s.contact_name || '—'}</span> },
    { key: 'email', header: 'Email', sortValue: (s) => s.email ?? '', cell: (s) => <span className="font-data text-slate-600">{s.email || '—'}</span> },
    { key: 'phone', header: 'Teléfono', sortValue: (s) => s.phone ?? '', cell: (s) => <span className="font-data text-slate-600">{s.phone || '—'}</span> },
  ]

  // Columna de acciones solo si puede escribir
  if (canWrite) {
    columns.push({
      key: 'actions', header: '', align: 'right',
      cell: (s) => (
        <Button variant="ghost" size="sm" onClick={() => setEditing(s)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Proveedores</h2>
          <p className="text-sm text-slate-500">Gestioná los proveedores del inventario.</p>
        </div>
        {canWrite && (
          <FormSheet title="Nuevo proveedor" triggerLabel="Nuevo proveedor" triggerIcon={Truck}>
            {(close) => (
              <SupplierForm onSubmit={(v) => handleCreate(v, close)} isLoading={isPending} />
            )}
          </FormSheet>
        )}
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        rowKey={(s) => s.id}
        pageSize={10}
        emptyIcon={Truck}
        emptyTitle="Sin proveedores"
        emptyDescription="Agregá tu primer proveedor para asociarlo a productos."
      />

      {canWrite && (
        <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Editar proveedor</SheetTitle>
            </SheetHeader>
            <div className="mt-6 px-4">
              {editing && (
                <SupplierForm
                  defaultValues={{
                    name: editing.name,
                    contact_name: editing.contact_name ?? '',
                    email: editing.email ?? '',
                    phone: editing.phone ?? '',
                    address: editing.address ?? '',
                    notes: editing.notes ?? '',
                  }}
                  onSubmit={handleUpdate}
                  isLoading={isPending}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
