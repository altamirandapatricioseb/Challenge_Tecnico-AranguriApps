import { z } from 'zod'

// Schema de validacion para crear/editar un producto
// Sin z.coerce: los inputs numericos se convierten a number en el form con valueAsNumber
export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200, 'Maximo 200 caracteres'),
  sku: z.string().max(50, 'Maximo 50 caracteres').optional().or(z.literal('')),
  description: z.string().max(1000, 'Maximo 1000 caracteres').optional().or(z.literal('')),
  category_id: z.string().uuid('Categoria invalida').optional().or(z.literal('')),
  supplier_id: z.string().uuid('Proveedor invalido').optional().or(z.literal('')),
  unit_price: z.number({ message: 'Debe ser un numero' }).min(0, 'El precio no puede ser negativo'),
  min_stock: z.number({ message: 'Debe ser un numero' }).int('Debe ser un numero entero').min(0, 'No puede ser negativo'),
  unit: z.string().min(1, 'La unidad es obligatoria').max(20, 'Maximo 20 caracteres'),
})

export type ProductFormValues = z.infer<typeof productSchema>