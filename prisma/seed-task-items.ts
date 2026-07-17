import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Prisma 7 requires a Driver Adapter. SESSION_URL is the Supabase session-mode
// pooler URL (port 5432), which is compatible with PrismaPg.
const connectionString = process.env.SESSION_URL ?? process.env.DATABASE_URL
if (!connectionString) throw new Error('Missing SESSION_URL or DATABASE_URL')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Task-item definitions keyed by [preferredTitle, roomName]
// ---------------------------------------------------------------------------
type ItemDef = { title: string; note?: string }

type TaskGroup = {
  roomName: string
  preferredTitle: string
  items: ItemDef[]
}

const taskGroups: TaskGroup[] = [
  {
    roomName: 'Cozinha',
    preferredTitle: 'Limpeza da Cozinha',
    items: [
      { title: 'Porta cozinha' },
      { title: 'Azulejo cozinha' },
      { title: 'Forno' },
      { title: 'Microondas' },
      { title: 'Espaço do café' },
      { title: 'Móvel do café e em cima do móvel de café' },
      { title: 'Geladeira dentro e em cima' },
      { title: 'Pia', note: 'sempre jogar cloro ativo e deixar de molho para tirar o limo' },
      { title: 'Janela cozinha e pedra de mármore' },
      { title: 'Móvel aéreo dos copos e pratos (dentro e em cima)' },
      { title: 'Móvel de baixo principalmente parte das panelas' },
    ],
  },
  {
    roomName: 'Despensa',
    preferredTitle: 'Limpeza da Despensa',
    items: [
      { title: 'Organizar e limpar prateleiras e chão' },
      { title: 'Limpar freezer por fora e em cima' },
      { title: 'Rainner descongelar o freezer', note: 'a cada 6 meses' },
      { title: 'Lavanderia organizar e limpar', note: 'lembrete: sempre tirar a tomada' },
      { title: 'Limpar portas lavanderia, cozinha, despensa' },
      { title: 'Limpar torneiras', note: 'ficam verde' },
      { title: 'Banheiro social' },
    ],
  },
  {
    roomName: 'Sala',
    preferredTitle: 'Limpeza da Sala',
    items: [
      { title: 'Janelas + mármore + tela mosquiteiro' },
      { title: 'Seteira + mármore' },
      { title: 'Prateleira cozinha/sala (limpar em cima também)' },
      { title: 'Prateleira sala' },
      { title: 'Ventilador' },
      { title: 'Rack sala limpar' },
      { title: 'Rack sala organizar' },
      { title: 'Puxar o sofá para limpar' },
      { title: 'Sapateira limpar por dentro e organizar' },
    ],
  },
  {
    roomName: 'Garagem',
    preferredTitle: 'Limpeza da Garagem',
    items: [
      { title: 'Mesa organizar e limpar' },
      { title: 'Garagem limpar/varrer/organizar' },
      { title: 'Garagem lavar' },
    ],
  },
  {
    roomName: 'Corredor e Escada',
    preferredTitle: 'Limpeza do Corredor e Escada',
    items: [
      // Escada first, then Corredor
      { title: 'Limpar escadas' },
      { title: 'Limpar janela da escada + mármore' },
      { title: 'Limpar corredor' },
    ],
  },
  {
    roomName: 'Suíte',
    preferredTitle: 'Limpeza da Suíte',
    items: [
      // Suite Banheiro
      { title: 'Limpar prateleiras/organizar' },
      { title: 'Limpar box — cloro ativo molho antes de lavar' },
      { title: 'Limpar box — vinagre, detergente' },
      { title: 'Nicho tirar todas as coisas e limpar (sempre)' },
      { title: 'Limpar azulejos (com cloro)' },
      { title: 'Armário limpar e organizar' },
      { title: 'Limpar espelho' },
      { title: 'Limpar torneira', note: 'fica verde' },
      { title: 'Limpar janela + mármore' },
      // Suite Quarto
      { title: 'Limpar guarda-roupa por fora' },
      { title: 'Limpar parte aberta do guarda-roupa toda área de madeira' },
      { title: 'Limpar criados mudos principalmente os vãos' },
      { title: 'Limpar cômoda' },
      { title: 'Limpar janela' },
      { title: 'Limpar ventilador' },
      { title: 'Limpar prateleiras' },
      { title: 'Limpar cabeceira/painel da cama' },
      { title: 'Puxar cama para limpar' },
      { title: 'Organizar guarda-roupas' },
      { title: 'Organizar cômoda' },
      { title: 'Rainner limpar ar-condicionado', note: '1x por semana' },
    ],
  },
  {
    roomName: 'Banheiros',
    preferredTitle: 'Limpeza dos Banheiros',
    items: [
      // Banheiro crianças
      { title: 'Banheiro sempre deixar de molho antes com cloro ativo' },
      { title: 'Deixar o box com a mistura de Catarina' },
      { title: 'Limpar box' },
      { title: 'Limpar e organizar armário' },
      { title: 'Limpar torneira' },
      { title: 'Limpar janela + mármore' },
      { title: 'Limpar nicho' },
    ],
  },
  {
    roomName: 'Escritório',
    preferredTitle: 'Limpeza do Escritório',
    items: [
      { title: 'Limpar mesas' },
      { title: 'Limpar móvel do canto e varrer em volta' },
      { title: 'Limpar ao lado da cômoda' },
      { title: 'Limpar cômoda' },
      { title: 'Limpar guarda-roupa por fora' },
      { title: 'Limpar rodas das cadeiras' },
      { title: 'Ventilador' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Seeding task items...\n')

  let totalCreated = 0

  for (const group of taskGroups) {
    // Find the room (case-insensitive)
    const room = await prisma.room.findFirst({
      where: {
        name: {
          equals: group.roomName,
          mode: 'insensitive',
        },
      },
    })

    if (!room) {
      console.warn(`  SKIP: Room not found — "${group.roomName}"`)
      continue
    }

    // Prefer the task with the specified title; fall back to any task in the room
    let task = await prisma.task.findFirst({
      where: {
        roomId: room.id,
        title: {
          equals: group.preferredTitle,
          mode: 'insensitive',
        },
      },
    })

    if (!task) {
      // Fallback: first task in the room
      task = await prisma.task.findFirst({
        where: { roomId: room.id },
        orderBy: { createdAt: 'asc' },
      })
    }

    if (!task) {
      console.warn(`  SKIP: No task found for room "${group.roomName}"`)
      continue
    }

    // Guard: skip if the task already has items
    const existingCount = await prisma.taskItem.count({
      where: { taskId: task.id },
    })

    if (existingCount > 0) {
      console.log(
        `  SKIP: Task "${task.title}" (room: ${group.roomName}) already has ${existingCount} item(s)`
      )
      continue
    }

    // Insert items in order
    await prisma.$transaction(
      group.items.map((item, index) =>
        prisma.taskItem.create({
          data: {
            taskId: task!.id,
            title: item.title,
            note: item.note ?? null,
            displayOrder: index,
          },
        })
      )
    )

    console.log(
      `  CREATED: ${group.items.length} item(s) for task "${task.title}" (room: ${group.roomName})`
    )
    totalCreated += group.items.length
  }

  console.log(`\nDone. Total task items created: ${totalCreated}`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
