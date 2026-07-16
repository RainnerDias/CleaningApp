'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoriesTable } from './CategoriesTable'
import { CategoryDialog } from './CategoryDialog'
import { DeleteCategoryDialog } from './DeleteCategoryDialog'
import { useCategories } from '../hooks/useCategories'
import type { Category } from '../types'

interface CategoriesPageClientProps {
  /** Server-fetched categories used as TanStack Query initial data */
  initialCategories: Category[]
}

/**
 * Client shell for the Categories admin page.
 * Manages dialog open/close state and delegates data operations to hooks.
 */
export function CategoriesPageClient({ initialCategories }: CategoriesPageClientProps) {
  const { data: categories = [], isLoading } = useCategories(initialCategories)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
  }

  const handleDelete = (category: Category) => {
    setDeletingCategory(category)
  }

  const handleEditOpenChange = (open: boolean) => {
    if (!open) setEditingCategory(null)
  }

  const handleDeleteOpenChange = (open: boolean) => {
    if (!open) setDeletingCategory(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie as categorias para classificar as tarefas de limpeza.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" />
          Nova Categoria
        </Button>
      </div>

      {/* Categories table */}
      <CategoriesTable
        categories={categories}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Create dialog */}
      <CategoryDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} category={null} />

      {/* Edit dialog */}
      <CategoryDialog
        open={!!editingCategory}
        onOpenChange={handleEditOpenChange}
        category={editingCategory}
      />

      {/* Delete confirmation dialog */}
      <DeleteCategoryDialog
        open={!!deletingCategory}
        onOpenChange={handleDeleteOpenChange}
        category={deletingCategory}
      />
    </div>
  )
}
