export interface Category {
  id: string
  name: string
  color: string
  createdAt: Date
  updatedAt: Date
  _count?: { tasks: number }
}

export interface CreateCategoryInput {
  name: string
  color: string
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}
