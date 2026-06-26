import { getProducts } from '@/server/actions/products'
import { getCategories } from '@/server/actions/categories'
import { getSuppliers } from '@/server/actions/suppliers'
import { ProductsClient } from './ProductsClient'

export default async function ProductsPage() {
  // Traemos todo en paralelo para no encadenar awaits
  const [products, categories, suppliers] = await Promise.all([
    getProducts(),
    getCategories(),
    getSuppliers(),
  ])

  return (
    <div className="space-y-6">
      <ProductsClient products={products} categories={categories} suppliers={suppliers} />
    </div>
  )
}
