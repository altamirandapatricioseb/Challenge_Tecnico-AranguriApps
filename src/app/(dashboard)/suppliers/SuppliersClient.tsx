'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/app/DataTable'
import { FormSheet } from '@/components/app/FormSheet'
import { SupplierForm } from '@/components/app/forms/SupplierForm'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createSupplier, updateSupplier, deleteSupplier } from '@/server/actions/suppliers'
import type { SupplierFormValues } from '@/lib/validations/supplier'
import { Truck, Pencil, Trash2, Package } from 'lucide-react'
import type { SupplierWithCount } from '@/types'

interface SuppliersClientProps {
  suppliers: SupplierWithCount[]
  canWrite: boolean
  canDelete: boolean
}

export function SuppliersClient({ suppliers, canWrite, canDelete }: SuppliersClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<SupplierWithCount | null>(null)
  const [deleting, setDeleting] = useState<SupplierWithCount | null>(null)

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
      const result = await updateSupplier(editing.id ?? '', values)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Proveedor actualizado.')
        setEditing(null)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteSupplier(deleting.id ?? '')
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Proveedor eliminado.')
        setDeleting(null)
        router.refresh()
      }
    })
  }

  const columns: Column<SupplierWithCount>[] = [
    { key: 'name', header: 'Nombre', sortValue: (s) => s.name ?? '', cell: (s) => <span className="font-medium text-slate-900">{s.name}</span> },
    { key: 'contact', header: 'Contacto', sortValue: (s) => s.contact_name ?? '', cell: (s) => <span className="text-slate-600">{s.contact_name || '—'}</span> },
    { key: 'email', header: 'Email', sortValue: (s) => s.email ?? '', cell: (s) => <span className="font-data text-slate-600">{s.email || '—'}</span> },
    { key: 'phone', header: 'Teléfono', sortValue: (s) => s.phone ?? '', cell: (s) => <span className="font-data text-slate-600">{s.phone || '—'}</span> },
    {
      key: 'products', header: 'Productos', align: 'right',
      sortValue: (s) => s.product_count ?? 0,
      cell: (s) => {
        const n = s.product_count ?? 0
        return (
          <span className={`inline-flex items-center gap-1.5 font-data ${n === 0 ? 'text-slate-400' : 'text-slate-700'}`}>
            <Package className="h-3.5 w-3.5" />
            {n}
          </span>
        )
      },
    },
  ]

  if (canWrite || canDelete) {
    columns.push({
      key: 'actions', header: '', align: 'right',
      cell: (s) => (
        <div className="flex justify-end gap-1">
          {canWrite && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(s)} title="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => setDeleting(s)} title="Eliminar" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
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
        rowKey={(s) => s.id ?? ""}
        pageSize={10}
        emptyIcon={Truck}
        emptyTitle="Sin proveedores"
        emptyDescription="Agregá tu primer proveedor para asociarlo a productos."
      />

      {/* Sheet de edición: solo si puede escribir */}
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
                    name: editing.name ?? '',
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

      {/* Diálogo de confirmación de borrado: solo admin */}
      {canDelete && (
        <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
              <AlertDialogDescription>
                Vas a eliminar &quot;{deleting?.name}&quot;. El proveedor dejará de listarse pero los
                productos asociados se conservan. Esta acción se puede revertir recreándolo con el mismo nombre.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
