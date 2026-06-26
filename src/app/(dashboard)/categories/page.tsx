import { getCategories } from '@/server/actions/categories'
import { getUserRole } from '@/lib/auth'
import { canWrite } from '@/lib/permissions'
import { CategoriesClient } from './CategoriesClient'

export default async function CategoriesPage() {
  const [categories, role] = await Promise.all([
    getCategories(),
    getUserRole(),
  ])

  return (
    <div className="space-y-6">
      <CategoriesClient
        categories={categories}
        canWrite={canWrite(role)}
        canDelete={role === 'admin'} // eliminar categorias solo para admin
      />
    </div>
  )
}
