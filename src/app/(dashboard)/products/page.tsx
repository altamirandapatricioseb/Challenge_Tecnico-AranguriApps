import { getProducts } from '@/server/actions/products'
import { getCategories } from '@/server/actions/categories'
import { getSuppliers } from '@/server/actions/suppliers'
import { getUserRole } from '@/lib/auth'
import { canWrite } from '@/lib/permissions'
import { ProductsClient } from './ProductsClient'

export default async function ProductsPage() {
  // Traemos datos y rol en paralelo
  const [products, categories, suppliers, role] = await Promise.all([
    getProducts(),
    getCategories(),
    getSuppliers(),
    getUserRole(),
  ])

  return (
    <div className="space-y-6">
      <ProductsClient
        products={products}
        categories={categories}
        suppliers={suppliers}
        canWrite={canWrite(role)}
      />
    </div>
  )
}
