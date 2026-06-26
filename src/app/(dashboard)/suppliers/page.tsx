import { getSuppliers } from '@/server/actions/suppliers'
import { getUserRole } from '@/lib/auth'
import { canWrite } from '@/lib/permissions'
import { SuppliersClient } from './SuppliersClient'

export default async function SuppliersPage() {
  const [suppliers, role] = await Promise.all([
    getSuppliers(),
    getUserRole(),
  ])

  return (
    <div className="space-y-6">
      <SuppliersClient suppliers={suppliers} canWrite={canWrite(role)} />
    </div>
  )
}
