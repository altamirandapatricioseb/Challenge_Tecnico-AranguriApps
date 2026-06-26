
import { getSuppliers } from '@/server/actions/suppliers'
import { SuppliersClient } from './SuppliersClient'

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()

  return (
    <div className="space-y-6">
      <SuppliersClient suppliers={suppliers} />
    </div>
  )
}
