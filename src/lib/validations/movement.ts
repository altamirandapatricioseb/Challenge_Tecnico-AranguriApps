import { z } from 'zod'

// Schema de validacion para registrar un movimiento de stock
// Sin z.coerce: la conversion a number se hace en el form con valueAsNumber
export const movementSchema = z.object({
  // min(1) en vez de uuid(): los ids vienen de la DB y ya estan garantizados por las FK.
  // El uuid() estricto rechazaba ids del seed que no cumplen el formato v4 exacto.
  product_id: z.string().min(1, 'Seleccioná un producto'),
  movement_type: z.enum(['entry', 'exit', 'adjustment'], {
    message: 'Tipo de movimiento invalido',
  }),
  quantity: z.number({ message: 'Debe ser un numero' }).int('Debe ser un numero entero').min(0, 'No puede ser negativo'),
  reason: z.string().max(200, 'Maximo 200 caracteres').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Maximo 1000 caracteres').optional().or(z.literal('')),
  unit_price: z.number({ message: 'Debe ser un numero' }).min(0, 'No puede ser negativo').optional(),
  reference_number: z.string().max(50, 'Maximo 50 caracteres').optional().or(z.literal('')),
})
  // Para entry y exit la cantidad debe ser mayor a cero; adjustment puede ser cero
  .refine((data) => data.movement_type === 'adjustment' || data.quantity > 0, {
    message: 'La cantidad debe ser mayor a cero para entradas y salidas',
    path: ['quantity'],
  })

export type MovementFormValues = z.infer<typeof movementSchema>
