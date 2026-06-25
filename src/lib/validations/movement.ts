import { z } from 'zod'

// Schema de validacion para registrar un movimiento de stock
export const movementSchema = z.object({
  product_id: z.string().uuid('Producto invalido'),
  movement_type: z.enum(['entry', 'exit', 'adjustment'], {
    message: 'Tipo de movimiento invalido',
  }),
  quantity: z.coerce.number().int('Debe ser un numero entero').min(0, 'No puede ser negativo'),
  reason: z.string().max(200, 'Maximo 200 caracteres').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Maximo 1000 caracteres').optional().or(z.literal('')),
  unit_price: z.coerce.number().min(0, 'No puede ser negativo').optional(),
  reference_number: z.string().max(50, 'Maximo 50 caracteres').optional().or(z.literal('')),
})
  // Para entry y exit la cantidad debe ser mayor a cero; adjustment puede ser cero
  .refine((data) => data.movement_type === 'adjustment' || data.quantity > 0, {
    message: 'La cantidad debe ser mayor a cero para entradas y salidas',
    path: ['quantity'],
  })

export type MovementFormValues = z.infer<typeof movementSchema>