'use client'

import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { movementSchema, type MovementFormValues } from '@/lib/validations/movement'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertTriangle } from 'lucide-react'
import type { ProductWithDetails } from '@/types'

interface MovementFormProps {
  products: ProductWithDetails[]
  defaultValues?: Partial<MovementFormValues>
  onSubmit: (values: MovementFormValues) => Promise<void>
  isLoading?: boolean
}

export function MovementForm({
  products, defaultValues, onSubmit, isLoading = false,
}: MovementFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      product_id: '',
      movement_type: 'entry',
      quantity: 1,
      reason: '',
      notes: '',
      reference_number: '',
      ...defaultValues,
    },
  })

  // Observamos producto y tipo para mostrar avisos de stock en vivo
  const selectedProductId = useWatch({ control, name: 'product_id' })
  const movementType = useWatch({ control, name: 'movement_type' })
  const quantity = useWatch({ control, name: 'quantity' })

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const currentStock = selectedProduct?.current_stock ?? 0

  // Aviso de stock insuficiente para salidas (solo informativo; la action revalida)
  const insufficientStock =
    movementType === 'exit' && selectedProduct && Number(quantity) > currentStock

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Producto *</Label>
        <Controller
          control={control}
          name="product_id"
          render={({ field }) => (
            <Select value={field.value || ''} onValueChange={field.onChange} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id ?? ''} value={p.id ?? ''}>
                    {p.name} {p.sku ? `(${p.sku})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.product_id && <p className="text-xs text-red-600">{errors.product_id.message}</p>}
        {selectedProduct && (
          <p className="text-xs text-slate-500">
            Stock actual: <span className="font-data font-medium">{currentStock}</span> {selectedProduct.unit}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Controller
            control={control}
            name="movement_type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entrada</SelectItem>
                  <SelectItem value="exit">Salida</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad *</Label>
          <Input id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} disabled={isLoading} className="font-data" />
          {errors.quantity && <p className="text-xs text-red-600">{errors.quantity.message}</p>}
        </div>
      </div>

      {movementType === 'adjustment' && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          El ajuste fija el stock al valor indicado (conteo físico), no suma ni resta.
        </p>
      )}

      {insufficientStock && (
        <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Stock insuficiente: hay {currentStock}, intentás retirar {quantity}.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo</Label>
        <Input id="reason" {...register('reason')} disabled={isLoading} placeholder="Compra, venta, conteo…" />
        {errors.reason && <p className="text-xs text-red-600">{errors.reason.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference_number">N° de referencia</Label>
        <Input id="reference_number" {...register('reference_number')} disabled={isLoading} placeholder="Remito, factura…" className="font-data" />
        {errors.reference_number && <p className="text-xs text-red-600">{errors.reference_number.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" rows={2} {...register('notes')} disabled={isLoading} />
        {errors.notes && <p className="text-xs text-red-600">{errors.notes.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registrando…
          </>
        ) : (
          'Registrar movimiento'
        )}
      </Button>
    </form>
  )
}
