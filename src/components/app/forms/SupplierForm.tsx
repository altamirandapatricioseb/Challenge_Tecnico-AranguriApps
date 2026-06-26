'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supplierSchema, type SupplierFormValues } from '@/lib/validations/supplier'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface SupplierFormProps {
  defaultValues?: Partial<SupplierFormValues>
  onSubmit: (values: SupplierFormValues) => Promise<void>
  isLoading?: boolean
}

export function SupplierForm({ defaultValues, onSubmit, isLoading = false }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
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

      <div className="space-y-2">
        <Label htmlFor="contact_name">Persona de contacto</Label>
        <Input id="contact_name" {...register('contact_name')} disabled={isLoading} />
        {errors.contact_name && <p className="text-xs text-red-600">{errors.contact_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} disabled={isLoading} />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" {...register('phone')} disabled={isLoading} />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" {...register('address')} disabled={isLoading} />
        {errors.address && <p className="text-xs text-red-600">{errors.address.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" rows={3} {...register('notes')} disabled={isLoading} />
        {errors.notes && <p className="text-xs text-red-600">{errors.notes.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando…
          </>
        ) : (
          'Guardar proveedor'
        )}
      </Button>
    </form>
  )
}