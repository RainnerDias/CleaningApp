'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'
import type { Category } from '../types'

interface CategoriesTableProps {
  categories: Category[]
  isLoading?: boolean
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

/**
 * Data table for listing categories with search, color swatch, task count,
 * and edit / delete action buttons.
 */
export function CategoriesTable({
  categories,
  isLoading = false,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  const [search, setSearch] = useState('')

  if (isLoading) {
    return <DataTableSkeleton rows={3} columns={4} />
  }

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        type="search"
        placeholder="Buscar categoria..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
        aria-label="Buscar categoria por nome"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium w-12">Cor</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Tarefas</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  {search
                    ? 'Nenhuma categoria encontrada para a busca.'
                    : 'Nenhuma categoria cadastrada.'}
                </td>
              </tr>
            ) : (
              filtered.map((category, index) => (
                <tr
                  key={category.id}
                  className={
                    index < filtered.length - 1
                      ? 'border-b border-border hover:bg-muted/20 transition-colors'
                      : 'hover:bg-muted/20 transition-colors'
                  }
                >
                  {/* Color swatch */}
                  <td className="px-4 py-3">
                    <div
                      className="size-8 rounded-full border border-border/50 flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                      aria-label={`Cor: ${category.color}`}
                    />
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 font-medium">{category.name}</td>

                  {/* Task count */}
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {category._count?.tasks ?? 0}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(category)}
                        aria-label={`Editar categoria ${category.name}`}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDelete(category)}
                        aria-label={`Excluir categoria ${category.name}`}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
