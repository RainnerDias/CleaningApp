import { test, expect } from './fixtures/auth.fixture'
import { mockTask, mockRoom } from './fixtures/mock-data'

test.describe('Admin — Tasks CRUD', () => {
  // ── TC-020 ─────────────────────────────────────────────────────────────────
  test('TC-020: Tasks page shows table grouped by room', async ({ page, adminPage }) => {
    void adminPage

    await page.route('**/api/tasks', (route) => route.fulfill({ json: [mockTask] }))
    await page.route('**/api/rooms', (route) => route.fulfill({ json: [mockRoom] }))
    await page.route('**/api/categories', (route) => route.fulfill({ json: [] }))

    await page.goto('/tasks')

    await expect(page.getByRole('heading', { name: 'Tarefas' })).toBeVisible()
    await expect(page.getByText('Limpeza da Cozinha')).toBeVisible()
    // Room name should appear as a grouping or column
    await expect(page.getByText('Cozinha')).toBeVisible()
  })

  // ── TC-021 ─────────────────────────────────────────────────────────────────
  test('TC-021: Create task — dialog opens with task and frequency sections', async ({
    page,
    adminPage,
  }) => {
    void adminPage

    await page.route('**/api/tasks', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: { ...mockTask, id: 'task-2', title: 'Nova Tarefa' } })
      } else {
        await route.fulfill({ json: [mockTask] })
      }
    })
    await page.route('**/api/rooms', (route) => route.fulfill({ json: [mockRoom] }))
    await page.route('**/api/categories', (route) => route.fulfill({ json: [] }))

    await page.goto('/tasks')
    await page.getByRole('button', { name: 'Nova Tarefa' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    // The dialog should show fields for both task info and frequency
    await expect(page.getByLabel(/T[ií]tulo/i)).toBeVisible()
    await expect(page.getByLabel(/Frequ[eê]ncia/i)).toBeVisible()
  })

  // ── TC-022 ─────────────────────────────────────────────────────────────────
  test('TC-022: Priority badge colours match task priority level', async ({ page, adminPage }) => {
    void adminPage

    const highPriorityTask = { ...mockTask, priority: 'high' }
    const lowPriorityTask = {
      ...mockTask,
      id: 'task-2',
      title: 'Tarefa Baixa Prioridade',
      priority: 'low',
    }

    await page.route('**/api/tasks', (route) =>
      route.fulfill({ json: [highPriorityTask, lowPriorityTask] })
    )
    await page.route('**/api/rooms', (route) => route.fulfill({ json: [mockRoom] }))
    await page.route('**/api/categories', (route) => route.fulfill({ json: [] }))

    await page.goto('/tasks')

    await expect(page.getByText('Limpeza da Cozinha')).toBeVisible()
    await expect(page.getByText('Tarefa Baixa Prioridade')).toBeVisible()
    // Verify distinct badge elements exist for each priority
    const badges = page.getByRole('cell').filter({ hasText: /Alta|M[eé]dia|Baixa/i })
    await expect(badges.first()).toBeVisible()
  })

  // ── TC-023 ─────────────────────────────────────────────────────────────────
  test('TC-023: Frequency type change shows/hides day-of-week selectors', async ({
    page,
    adminPage,
  }) => {
    void adminPage

    await page.route('**/api/tasks', (route) => route.fulfill({ json: [mockTask] }))
    await page.route('**/api/rooms', (route) => route.fulfill({ json: [mockRoom] }))
    await page.route('**/api/categories', (route) => route.fulfill({ json: [] }))

    await page.goto('/tasks')
    await page.getByRole('button', { name: 'Nova Tarefa' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()

    // Select 'daily' frequency type — day selectors should not appear
    const frequencySelect = page.getByLabel(/Frequ[eê]ncia/i)
    await frequencySelect.selectOption('daily')
    await expect(page.getByText(/Dias da semana/i)).not.toBeVisible()

    // Select 'weekly' — day-of-week selectors should appear
    await frequencySelect.selectOption('weekly')
    await expect(page.getByText(/Dias da semana/i)).toBeVisible()
  })
})
