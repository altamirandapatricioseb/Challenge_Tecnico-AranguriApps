import { getMovements } from '@/server/actions/movements'
import { getProducts } from '@/server/actions/products'
import { getUserRole } from '@/lib/auth'
import { canWrite } from '@/lib/permissions'
import { MovementsClient } from './MovementsClient'

export default async function MovementsPage() {
  const [movements, products, role] = await Promise.all([
    getMovements(),
    getProducts(),
    getUserRole(),
  ])

  return (
    <div className="space-y-6">
      <MovementsClient movements={movements} products={products} canWrite={canWrite(role)} />
    </div>
  )
}
