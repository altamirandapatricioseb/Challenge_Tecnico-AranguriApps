import { z } from 'zod'

// Schema de validacion para crear/editar un producto
export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200, 'Maximo 200 caracteres'),
  sku: z.string().max(50, 'Maximo 50 caracteres').optional().or(z.literal('')),
  description: z.string().max(1000, 'Maximo 1000 caracteres').optional().or(z.literal('')),
  category_id: z.string().uuid('Categoria invalida').optional().or(z.literal('')),
  supplier_id: z.string().uuid('Proveedor invalido').optional().or(z.literal('')),
  unit_price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  min_stock: z.coerce.number().int('Debe ser un numero entero').min(0, 'No puede ser negativo'),
  unit: z.string().min(1, 'La unidad es obligatoria').max(20, 'Maximo 20 caracteres'),
})

// Tipo inferido del schema, para usar en formularios y actions
export type ProductFormValues = z.infer<typeof productSchema>