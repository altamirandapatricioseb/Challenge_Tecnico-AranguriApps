import { z } from 'zod'

// Schema de validacion para crear/editar una categoria
export const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100, 'Maximo 100 caracteres'),
  description: z.string().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
  // Color hex de 6 digitos para el badge de la categoria
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color invalido'),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
