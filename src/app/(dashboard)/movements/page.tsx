import { getMovements } from '@/server/actions/movements'
import { getProducts } from '@/server/actions/products'
import { MovementsClient } from './MovementsClient'

export default async function MovementsPage() {
  const [movements, products] = await Promise.all([
    getMovements(),
    getProducts(),
  ])

  return (
    <div className="space-y-6">
      <MovementsClient movements={movements} products={products} />
    </div>
  )
}
