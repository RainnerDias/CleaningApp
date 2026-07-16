import { requireAdmin } from '@/features/auth/services/authService'
import { categoryService } from '@/features/categories/services/categoryService'
import { CategoriesPageClient } from '@/features/categories/components/CategoriesPageClient'
import type { Category } from '@/features/categories/types'

/**
 * Admin Categories page — server component.
 * Validates admin access, fetches initial data, and renders the client shell.
 */
export default async function CategoriesPage() {
  await requireAdmin()
  const categories = await categoryService.getAll()

  return <CategoriesPageClient initialCategories={categories as Category[]} />
}
