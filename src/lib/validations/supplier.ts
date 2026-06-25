import { z } from 'zod'

// Schema de validacion para crear/editar un proveedor
export const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200, 'Maximo 200 caracteres'),
  contact_name: z.string().max(200, 'Maximo 200 caracteres').optional().or(z.literal('')),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  phone: z.string().max(50, 'Maximo 50 caracteres').optional().or(z.literal('')),
  address: z.string().max(300, 'Maximo 300 caracteres').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Maximo 1000 caracteres').optional().or(z.literal('')),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>