import { test, expect } from './fixtures/auth.fixture'
import { mockSchedule, mockCompletedSchedule, mockUser } from './fixtures/mock-data'

test.describe('User — Today page task flows', () => {
  // ── TC-050 ─────────────────────────────────────────────────────────────────
  test('TC-050: Today page shows greeting with user first name and task list', async ({
    page,
    userPage,
  }) => {
    void userPage

    await page.route('**/api/schedules/today', (route) => route.fulfill({ json: [mockSchedule] }))
    await page.route('**/api/settings**', (route) => route.fulfill({ json: { golden_rule: '' } }))

    await page.goto('/today')

    // Greeting uses first name extracted from user.name ("Maria Silva" → "Maria")
    const firstName = mockUser.name.split(' ')[0]
    await expect(
      page.getByRole('heading', { name: new RegExp(`Bom dia, ${firstName}`) })
    ).toBeVisible()
    // Task should be listed
    await expect(page.getByText('Limpeza da Cozinha')).toBeVisible()
  })

  // ── TC-051 ─────────────────────────────────────────────────────────────────
  test('TC-051: Complete task — checkbox updates to pressed state and progress bar increases', async ({
    page,
    userPage,
  }) => {
    void userPage

    await page.route('**/api/schedules/today', (route) => route.fulfill({ json: [mockSchedule] }))
    await page.route(`**/api/schedules/${mockSchedule.id}/status`, (route) =>
      route.fulfill({
        json: { ...mockSchedule, status: 'completed', completedAt: new Date().toISOString() },
      })
    )
    await page.route('**/api/settings**', (route) => route.fulfill({ json: { golden_rule: '' } }))

    await page.goto('/today')

    // Find the completion checkbox button
    const checkboxButton = page.getByRole('button', {
      name: /Marcar "Limpeza da Cozinha" como conclu[ií]da/i,
    })
    await expect(checkboxButton).toBeVisible()
    await checkboxButton.click()

    // After completion, aria-pressed becomes true and label changes
    const completedButton = page.getByRole('button', {
      name: /Marcar "Limpeza da Cozinha" como pendente/i,
    })
    await expect(completedButton).toBeVisible()
    await expect(completedButton).toHaveAttribute('aria-pressed', 'true')

    // Progress bar should reflect 100% (1 of 1 completed)
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  // ── TC-052 ─────────────────────────────────────────────────────────────────
  test('TC-052: All tasks complete — celebration banner appears', async ({ page, userPage }) => {
    void userPage

    // Return a schedule that is already completed
    await page.route('**/api/schedules/today', (route) =>
      route.fulfill({ json: [mockCompletedSchedule] })
    )
    await page.route('**/api/settings**', (route) => route.fulfill({ json: { golden_rule: '' } }))

    await page.goto('/today')

    // Celebration banner with role="status" should be visible
    await expect(page.getByRole('status')).toContainText('Todas as tarefas concluídas')
  })

  // ── TC-053 ─────────────────────────────────────────────────────────────────
  test('TC-053: Add comment to task — textarea clears after save', async ({ page, userPage }) => {
    void userPage

    await page.route('**/api/schedules/today', (route) => route.fulfill({ json: [mockSchedule] }))
    await page.route(`**/api/schedules/${mockSchedule.id}/comments`, (route) =>
      route.fulfill({
        json: {
          id: 'comment-1',
          comment: 'Limpeza feita!',
          createdAt: new Date().toISOString(),
          user: { name: mockUser.name },
        },
      })
    )
    await page.route('**/api/settings**', (route) => route.fulfill({ json: { golden_rule: '' } }))

    await page.goto('/today')

    // Expand the comment section
    await page.getByRole('button', { name: /Coment[aá]rio/i }).click()

    // Fill the textarea
    const textarea = page.getByLabel('Novo comentário')
    await expect(textarea).toBeVisible()
    await textarea.fill('Limpeza feita!')

    // Save the comment
    await page.getByRole('button', { name: 'Salvar' }).click()

    // Textarea should clear after a successful save
    await expect(textarea).toHaveValue('')
  })

  // ── TC-054 ─────────────────────────────────────────────────────────────────
  test('TC-054: Skip task — inline confirmation shows and confirms skip', async ({
    page,
    userPage,
  }) => {
    void userPage

    await page.route('**/api/schedules/today', (route) => route.fulfill({ json: [mockSchedule] }))
    await page.route(`**/api/schedules/${mockSchedule.id}/status`, (route) =>
      route.fulfill({
        json: { ...mockSchedule, status: 'skipped' },
      })
    )
    await page.route('**/api/settings**', (route) => route.fulfill({ json: { golden_rule: '' } }))

    await page.goto('/today')

    // Click the skip (Ignorar) button
    await page.getByRole('button', { name: /Ignorar/i }).click()

    // Inline confirmation should appear
    await expect(page.getByText('Tem certeza?')).toBeVisible()
    await page.getByRole('button', { name: 'Sim' }).click()

    // The task card should collapse to the skipped state with "Ignorada" badge
    await expect(page.getByText('Ignorada')).toBeVisible()
  })

  // ── TC-055 ─────────────────────────────────────────────────────────────────
  test('TC-055: Empty today — no tasks message is displayed', async ({ page, userPage }) => {
    void userPage

    await page.route('**/api/schedules/today', (route) => route.fulfill({ json: [] }))
    await page.route('**/api/settings**', (route) => route.fulfill({ json: { golden_rule: '' } }))

    await page.goto('/today')

    await expect(page.getByText('Nenhuma tarefa para hoje!')).toBeVisible()
  })

  // ── TC-056 ─────────────────────────────────────────────────────────────────
  test('TC-056: Mobile viewport (375px) — page has no horizontal scroll', async ({
    page,
    userPage,
  }) => {
    void userPage

    await page.setViewportSize({ width: 375, height: 812 })

    await page.route('**/api/schedules/today', (route) => route.fulfill({ json: [mockSchedule] }))
    await page.route('**/api/settings**', (route) => route.fulfill({ json: { golden_rule: '' } }))

    await page.goto('/today')

    // scrollWidth must not exceed the viewport width
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })
})
