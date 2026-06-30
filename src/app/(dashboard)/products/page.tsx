import { getProducts } from '@/server/actions/products'
import { getCategories } from '@/server/actions/categories'
import { getSuppliers } from '@/server/actions/suppliers'
import { getUserRole } from '@/lib/auth'
import { canWrite } from '@/lib/permissions'
import { ProductsClient } from './ProductsClient'
import type { Category, CategoryWithCount, Supplier, SupplierWithCount } from '@/types'

// Adapta CategoryWithCount (vista, columnas nullable) a Category (tabla base, no-null).
function toCategory(c: CategoryWithCount): Category | null {
  if (c.id === null || c.name === null || c.color === null || c.is_active === null || c.created_at === null) {
    return null
  }
  return {
    id: c.id,
    name: c.name,
    color: c.color,
    description: c.description,
    is_active: c.is_active,
    created_at: c.created_at,
  }
}

// Idem para SupplierWithCount -> Supplier
function toSupplier(s: SupplierWithCount): Supplier | null {
  if (s.id === null || s.name === null || s.is_active === null || s.created_at === null || s.updated_at === null) {
    return null
  }
  return {
    id: s.id,
    name: s.name,
    contact_name: s.contact_name,
    email: s.email,
    phone: s.phone,
    address: s.address,
    notes: s.notes,
    is_active: s.is_active,
    created_at: s.created_at,
    updated_at: s.updated_at,
  }
}

export default async function ProductsPage() {
  const [products, rawCategories, rawSuppliers, role] = await Promise.all([
    getProducts(),
    getCategories(),
    getSuppliers(),
    getUserRole(),
  ])

  const categories = rawCategories.map(toCategory).filter((c): c is Category => c !== null)
  const suppliers = rawSuppliers.map(toSupplier).filter((s): s is Supplier => s !== null)

  return (
    <div className="space-y-6">
      <ProductsClient
        products={products}
        categories={categories}
        suppliers={suppliers}
        canWrite={canWrite(role)}
        canDelete={role === 'admin'} // eliminar solo admin
      />
    </div>
  )
}
