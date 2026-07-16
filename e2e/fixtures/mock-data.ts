export const mockUser = {
  id: 'user-1',
  name: 'Maria Silva',
  email: 'maria@example.com',
  role: 'user' as const,
  active: true,
  avatarUrl: null,
}

export const mockAdmin = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'admin' as const,
  active: true,
  avatarUrl: null,
}

export const mockRoom = {
  id: 'room-1',
  name: 'Cozinha',
  icon: 'chef-hat',
  color: '#F97316',
  displayOrder: 1,
  active: true,
  _count: { tasks: 3 },
}

export const mockTask = {
  id: 'task-1',
  roomId: 'room-1',
  title: 'Limpeza da Cozinha',
  estimatedMinutes: 60,
  priority: 'high',
  active: true,
  goldenRuleApplies: true,
  room: { id: 'room-1', name: 'Cozinha', color: '#F97316', icon: 'chef-hat' },
  category: null,
  frequency: { type: 'weekly', daysOfWeek: [1, 3] },
}

export const mockSchedule = {
  id: 'schedule-1',
  date: new Date().toISOString(),
  status: 'pending',
  completedAt: null,
  task: mockTask,
  user: mockUser,
  comments: [] as { id: string; comment: string; createdAt: string; user: { name: string } }[],
  photos: [] as { id: string; imageUrl: string }[],
}

export const mockCompletedSchedule = {
  ...mockSchedule,
  status: 'completed',
  completedAt: new Date().toISOString(),
}

export const mockReportRow = {
  id: 'schedule-1',
  date: new Date().toISOString(),
  status: 'completed',
  completedAt: new Date().toISOString(),
  task: {
    title: 'Limpeza da Cozinha',
    estimatedMinutes: 60,
    room: { name: 'Cozinha' },
  },
  user: { name: 'Maria Silva' },
}

export const mockReportSummary = {
  total: 1,
  completed: 1,
  pending: 0,
  skipped: 0,
  completionRate: 100,
}

export const mockAuditLogCreate = {
  id: 'log-1',
  action: 'CREATE',
  entityType: 'room',
  entityId: 'room-1',
  createdAt: new Date().toISOString(),
  user: { name: 'Admin' },
  oldValue: null,
  newValue: { name: 'Cozinha' },
}

export const mockAuditLogDelete = {
  id: 'log-2',
  action: 'DELETE',
  entityType: 'room',
  entityId: 'room-2',
  createdAt: new Date().toISOString(),
  user: { name: 'Admin' },
  oldValue: { name: 'Sala Velha' },
  newValue: null,
}
