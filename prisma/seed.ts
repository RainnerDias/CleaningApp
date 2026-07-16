import { PrismaClient, FrequencyType, Priority } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Prisma 7 requires a Driver Adapter. SESSION_URL is the Supabase session-mode
// pooler URL (port 5432), which is compatible with PrismaPg.
const connectionString = process.env.SESSION_URL ?? process.env.DATABASE_URL
if (!connectionString) throw new Error('Missing SESSION_URL or DATABASE_URL')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Guard: if rooms already exist, skip — prevents duplicate inserts on re-runs.
  const existingRooms = await prisma.room.count()
  if (existingRooms > 0) {
    console.log('Database already seeded. Skipping.')
    return
  }

  // ---------------------------------------------------------------------------
  // Settings (unique on key — upsert is safe)
  // ---------------------------------------------------------------------------
  const settingRows = await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: 'golden_rule' },
      update: {},
      create: {
        key: 'golden_rule',
        value: {
          text: 'Ao limpar qualquer ambiente ou objeto: retire tudo do lugar, limpe as superfícies e só depois recoloque tudo no lugar.',
        },
        description: 'Golden Rule displayed on every cleaning task',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'schedule_days_ahead' },
      update: {},
      create: {
        key: 'schedule_days_ahead',
        value: { days: 30 },
        description: 'How many days ahead the scheduling engine generates schedules',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'default_assignment_strategy' },
      update: {},
      create: {
        key: 'default_assignment_strategy',
        value: { strategy: 'round_robin' },
        description: 'How tasks are assigned to users: round_robin or manual',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'work_days' },
      update: {},
      create: {
        key: 'work_days',
        value: { days: [1, 2, 3, 4, 5] },
        description: 'Days of week the schedule runs (0=Sun, 1=Mon, ..., 6=Sat)',
      },
    }),
  ])
  console.log(`  Settings: ${settingRows.length} records`)

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------
  const categoryData = [
    { name: 'Cozinha', color: '#F97316' },
    { name: 'Quartos', color: '#8B5CF6' },
    { name: 'Banheiros', color: '#06B6D4' },
    { name: 'Sala / Áreas comuns', color: '#10B981' },
    { name: 'Lavanderia / Serviços', color: '#3B82F6' },
    { name: 'Organização / Periódicas', color: '#F59E0B' },
  ]

  const createdCategories = await prisma.$transaction(
    categoryData.map((cat) => prisma.category.create({ data: cat }))
  )
  const categories: Record<string, string> = {}
  for (const cat of createdCategories) {
    categories[cat.name] = cat.id
  }
  console.log(`  Categories: ${createdCategories.length} records`)

  // ---------------------------------------------------------------------------
  // Rooms
  // ---------------------------------------------------------------------------
  const roomData = [
    { name: 'Cozinha', icon: 'chef-hat', color: '#F97316', displayOrder: 1 },
    { name: 'Suíte', icon: 'bed', color: '#8B5CF6', displayOrder: 2 },
    { name: 'Quarto Clarice', icon: 'bed', color: '#EC4899', displayOrder: 3 },
    { name: 'Quarto 3', icon: 'bed', color: '#A78BFA', displayOrder: 4 },
    { name: 'Sala', icon: 'sofa', color: '#10B981', displayOrder: 5 },
    { name: 'Corredor e Escada', icon: 'arrow-up', color: '#6B7280', displayOrder: 6 },
    { name: 'Escritório', icon: 'monitor', color: '#0EA5E9', displayOrder: 7 },
    { name: 'Banheiros', icon: 'bath', color: '#06B6D4', displayOrder: 8 },
    { name: 'Lavanderia', icon: 'washing-machine', color: '#3B82F6', displayOrder: 9 },
    { name: 'Despensa', icon: 'package', color: '#F59E0B', displayOrder: 10 },
    { name: 'Garagem', icon: 'car', color: '#6B7280', displayOrder: 11 },
  ]

  const createdRooms = await prisma.$transaction(
    roomData.map((room) => prisma.room.create({ data: room }))
  )
  const rooms: Record<string, string> = {}
  for (const room of createdRooms) {
    rooms[room.name] = room.id
  }
  console.log(`  Rooms: ${createdRooms.length} records`)

  // ---------------------------------------------------------------------------
  // Tasks + Frequencies
  // ---------------------------------------------------------------------------
  type TaskSeed = {
    title: string
    roomName: string
    categoryName: string
    estimatedMinutes: number
    priority: Priority
    goldenRuleApplies: boolean
    frequency: {
      type: FrequencyType
      daysOfWeek: number[]
      dayOfMonth?: number
    }
  }

  const taskData: TaskSeed[] = [
    // --- Daily ---
    {
      title: 'Plano do dia + refeições',
      roomName: 'Cozinha',
      categoryName: 'Cozinha',
      estimatedMinutes: 15,
      priority: Priority.high,
      goldenRuleApplies: false,
      frequency: { type: FrequencyType.daily, daysOfWeek: [1, 2, 3, 4, 5] },
    },
    {
      title: 'Organizar e finalizar pendências do dia',
      roomName: 'Escritório',
      categoryName: 'Organização / Periódicas',
      estimatedMinutes: 20,
      priority: Priority.medium,
      goldenRuleApplies: false,
      frequency: { type: FrequencyType.daily, daysOfWeek: [1, 2, 3, 4, 5] },
    },

    // --- Weekly ---
    {
      title: 'Limpeza da Cozinha',
      roomName: 'Cozinha',
      categoryName: 'Cozinha',
      estimatedMinutes: 60,
      priority: Priority.high,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.weekly, daysOfWeek: [1, 3] }, // Mon, Wed
    },
    {
      title: 'Lavanderia',
      roomName: 'Lavanderia',
      categoryName: 'Lavanderia / Serviços',
      estimatedMinutes: 45,
      priority: Priority.medium,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.weekly, daysOfWeek: [2, 4, 5] }, // Tue, Thu, Fri
    },
    {
      title: 'Limpeza dos Banheiros',
      roomName: 'Banheiros',
      categoryName: 'Banheiros',
      estimatedMinutes: 45,
      priority: Priority.high,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.weekly, daysOfWeek: [2] }, // Tuesday
    },
    {
      title: 'Limpeza da Suíte',
      roomName: 'Suíte',
      categoryName: 'Quartos',
      estimatedMinutes: 60,
      priority: Priority.medium,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.weekly, daysOfWeek: [1, 4] }, // Mon, Thu
    },
    {
      title: 'Limpeza do Quarto Clarice',
      roomName: 'Quarto Clarice',
      categoryName: 'Quartos',
      estimatedMinutes: 60,
      priority: Priority.medium,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.weekly, daysOfWeek: [3, 5] }, // Wed, Fri
    },
    {
      title: 'Limpeza do Quarto 3',
      roomName: 'Quarto 3',
      categoryName: 'Quartos',
      estimatedMinutes: 45,
      priority: Priority.medium,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.weekly, daysOfWeek: [2, 4] }, // Tue, Thu
    },
    {
      title: 'Limpeza da Sala',
      roomName: 'Sala',
      categoryName: 'Sala / Áreas comuns',
      estimatedMinutes: 45,
      priority: Priority.medium,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.weekly, daysOfWeek: [5] }, // Friday
    },
    {
      title: 'Limpeza do Corredor e Escada',
      roomName: 'Corredor e Escada',
      categoryName: 'Sala / Áreas comuns',
      estimatedMinutes: 30,
      priority: Priority.low,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.weekly, daysOfWeek: [4] }, // Thursday
    },
    {
      title: 'Limpeza do Escritório',
      roomName: 'Escritório',
      categoryName: 'Sala / Áreas comuns',
      estimatedMinutes: 30,
      priority: Priority.low,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.weekly, daysOfWeek: [2] }, // Tuesday
    },

    // --- Biweekly ---
    {
      title: 'Limpeza da Despensa',
      roomName: 'Despensa',
      categoryName: 'Organização / Periódicas',
      estimatedMinutes: 60,
      priority: Priority.medium,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.biweekly, daysOfWeek: [2] }, // Every other Tuesday
    },
    {
      title: 'Limpeza da Garagem',
      roomName: 'Garagem',
      categoryName: 'Organização / Periódicas',
      estimatedMinutes: 90,
      priority: Priority.low,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.biweekly, daysOfWeek: [5] }, // Every other Friday
    },

    // --- Monthly ---
    {
      title: 'Organização da Lavanderia',
      roomName: 'Lavanderia',
      categoryName: 'Lavanderia / Serviços',
      estimatedMinutes: 60,
      priority: Priority.low,
      goldenRuleApplies: true,
      frequency: { type: FrequencyType.monthly, daysOfWeek: [], dayOfMonth: 1 },
    },
  ]

  let taskCount = 0
  let frequencyCount = 0

  for (const td of taskData) {
    const roomId = rooms[td.roomName]
    const categoryId = categories[td.categoryName]

    if (!roomId) {
      console.warn(`  WARNING: Room not found: ${td.roomName}`)
      continue
    }
    if (!categoryId) {
      console.warn(`  WARNING: Category not found: ${td.categoryName}`)
      continue
    }

    const task = await prisma.task.create({
      data: {
        title: td.title,
        roomId,
        categoryId,
        estimatedMinutes: td.estimatedMinutes,
        priority: td.priority,
        goldenRuleApplies: td.goldenRuleApplies,
      },
    })
    taskCount++

    await prisma.frequency.create({
      data: {
        taskId: task.id,
        type: td.frequency.type,
        daysOfWeek: td.frequency.daysOfWeek,
        dayOfMonth: td.frequency.dayOfMonth ?? null,
      },
    })
    frequencyCount++
  }

  console.log(`  Tasks: ${taskCount} records`)
  console.log(`  Frequencies: ${frequencyCount} records`)
  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
