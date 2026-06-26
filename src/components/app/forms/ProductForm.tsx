'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, type ProductFormValues } from '@/lib/validations/product'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { Category, Supplier } from '@/types'

interface ProductFormProps {
  categories: Category[]
  suppliers: Supplier[]
  defaultValues?: Partial<ProductFormValues>
  onSubmit: (values: ProductFormValues) => Promise<void>
  isLoading?: boolean
}

export function ProductForm({
  categories, suppliers, defaultValues, onSubmit, isLoading = false,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      category_id: '',
      supplier_id: '',
      unit_price: 0,
      min_stock: 5,
      unit: 'unidad',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" {...register('name')} disabled={isLoading} />
        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register('sku')} disabled={isLoading} className="font-data" />
          {errors.sku && <p className="text-xs text-red-600">{errors.sku.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unidad *</Label>
          <Input id="unit" {...register('unit')} disabled={isLoading} />
          {errors.unit && <p className="text-xs text-red-600">{errors.unit.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Controller
            control={control}
            name="category_id"
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Proveedor</Label>
          <Controller
            control={control}
            name="supplier_id"
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="unit_price">Precio unitario *</Label>
          <Input id="unit_price" type="number" step="0.01" {...register('unit_price', { valueAsNumber: true })} disabled={isLoading} className="font-data" />
          {errors.unit_price && <p className="text-xs text-red-600">{errors.unit_price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_stock">Stock mínimo *</Label>
          <Input id="min_stock" type="number" {...register('min_stock', { valueAsNumber: true })} disabled={isLoading} className="font-data" />
          {errors.min_stock && <p className="text-xs text-red-600">{errors.min_stock.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" rows={3} {...register('description')} disabled={isLoading} />
        {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando…
          </>
        ) : (
          'Guardar producto'
        )}
      </Button>
    </form>
  )
}