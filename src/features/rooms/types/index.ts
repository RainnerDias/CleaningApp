export interface Room {
  id: string
  name: string
  icon: string
  color: string
  displayOrder: number
  active: boolean
  createdAt: Date
  updatedAt: Date
  _count?: { tasks: number }
}

export interface CreateRoomInput {
  name: string
  icon: string
  color: string
  displayOrder?: number
}

export interface UpdateRoomInput extends Partial<CreateRoomInput> {
  active?: boolean
}
