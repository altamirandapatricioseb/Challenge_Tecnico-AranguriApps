'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema, type CategoryFormValues } from '@/lib/validations/category'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface CategoryFormProps {
  defaultValues?: Partial<CategoryFormValues>
  onSubmit: (values: CategoryFormValues) => Promise<void>
  isLoading?: boolean
}

// Colores sugeridos para elegir rapido (los mismos tonos del sistema)
const PRESET_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6']

export function CategoryForm({ defaultValues, onSubmit, isLoading = false }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#6366f1',
      ...defaultValues,
    },
  })

  const currentColor = watch('color')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" {...register('name')} disabled={isLoading} />
        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Color *</Label>
        <div className="flex items-center gap-2">
          {/* Input de color nativo + hex editable */}
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setValue('color', e.target.value)}
            disabled={isLoading}
            className="h-9 w-12 cursor-pointer rounded border border-slate-200"
          />
          <Input {...register('color')} disabled={isLoading} className="font-data w-32" />
        </div>
        {/* Colores preestablecidos para elegir rapido */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              className="h-6 w-6 rounded-full ring-2 ring-offset-1 ring-transparent hover:ring-slate-300"
              style={{ backgroundColor: c }}
              aria-label={`Elegir color ${c}`}
            />
          ))}
        </div>
        {errors.color && <p className="text-xs text-red-600">{errors.color.message}</p>}
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
          'Guardar categoría'
        )}
      </Button>
    </form>
  )
}
