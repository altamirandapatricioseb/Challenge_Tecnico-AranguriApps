'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/app/DataTable'
import { FormSheet } from '@/components/app/FormSheet'
import { CategoryForm } from '@/components/app/forms/CategoryForm'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createCategory, updateCategory, deleteCategory } from '@/server/actions/categories'
import type { CategoryFormValues } from '@/lib/validations/category'
import { Tag, Pencil, Trash2, Package } from 'lucide-react'
import type { CategoryWithCount } from '@/types'

interface CategoriesClientProps {
  categories: CategoryWithCount[]
  canWrite: boolean   // manager o admin: crear y editar
  canDelete: boolean  // solo admin: eliminar
}

export function CategoriesClient({ categories, canWrite, canDelete }: CategoriesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<CategoryWithCount | null>(null)
  const [deleting, setDeleting] = useState<CategoryWithCount | null>(null)

  async function handleCreate(values: CategoryFormValues, close: () => void) {
    startTransition(async () => {
      const result = await createCategory(values)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Categoría creada.')
        close()
        router.refresh()
      }
    })
  }

  async function handleUpdate(values: CategoryFormValues) {
    if (!editing) return
    startTransition(async () => {
      const result = await updateCategory(editing.id ?? '', values)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Categoría actualizada.')
        setEditing(null)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteCategory(deleting.id ?? '')
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Categoría eliminada.')
        setDeleting(null)
        router.refresh()
      }
    })
  }

  const columns: Column<CategoryWithCount>[] = [
    {
      key: 'name', header: 'Nombre', sortValue: (c) => c.name ?? '',
      cell: (c) => (
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color ?? '#94a3b8' }} />
          <span className="font-medium text-slate-900">{c.name}</span>
        </span>
      ),
    },
    { key: 'description', header: 'Descripción', sortValue: (c) => c.description ?? '', cell: (c) => <span className="text-slate-600">{c.description || '—'}</span> },
    {
      key: 'products', header: 'Productos', align: 'right',
      sortValue: (c) => c.product_count ?? 0,
      cell: (c) => {
        const n = c.product_count ?? 0
        return (
          <span className={`inline-flex items-center gap-1.5 font-data ${n === 0 ? 'text-slate-400' : 'text-slate-700'}`}>
            <Package className="h-3.5 w-3.5" />
            {n}
          </span>
        )
      },
    },
    { key: 'color', header: 'Color', sortValue: (c) => c.color ?? '', cell: (c) => <span className="font-data text-slate-500">{c.color}</span> },
  ]

  // Acciones segun permisos: editar (canWrite) y eliminar (canDelete)
  if (canWrite || canDelete) {
    columns.push({
      key: 'actions', header: '', align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          {canWrite && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(c)} title="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => setDeleting(c)} title="Eliminar" className="text-red-600 hover:text-red-700">
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
          <h2 className="text-xl font-semibold text-slate-900">Categorías</h2>
          <p className="text-sm text-slate-500">Organizá tus productos por categoría.</p>
        </div>
        {canWrite && (
          <FormSheet title="Nueva categoría" triggerLabel="Nueva categoría" triggerIcon={Tag}>
            {(close) => (
              <CategoryForm onSubmit={(v) => handleCreate(v, close)} isLoading={isPending} />
            )}
          </FormSheet>
        )}
      </div>

      <DataTable
        columns={columns}
        data={categories}
        rowKey={(c) => c.id ?? ""}
        pageSize={10}
        emptyIcon={Tag}
        emptyTitle="Sin categorías"
        emptyDescription="Creá tu primera categoría para organizar los productos."
      />

      {/* Sheet de edición */}
      {canWrite && (
        <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Editar categoría</SheetTitle>
            </SheetHeader>
            <div className="mt-6 px-4">
              {editing && (
                <CategoryForm
                  defaultValues={{
                    name: editing.name ?? '',
                    description: editing.description ?? '',
                    color: editing.color ?? '#6366f1',
                  }}
                  onSubmit={handleUpdate}
                  isLoading={isPending}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Diálogo de confirmación de borrado */}
      {canDelete && (
        <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
              <AlertDialogDescription>
                Vas a eliminar la categoría &quot;{deleting?.name}&quot;. Los productos que la usen
                quedarán sin categoría, pero no se eliminarán. Esta acción no se puede deshacer.
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
