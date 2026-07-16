import { test, expect } from './fixtures/auth.fixture'
import { mockSchedule } from './fixtures/mock-data'

// NOTE: The calendar page is currently implemented as an EmptyState component.
// TC-040 and TC-041 describe the intended full implementation (FullCalendar +
// schedule generation). These tests will not pass against the current EmptyState
// build but are written against the planned UI to drive future implementation.

test.describe('Admin — Calendar and schedule generation', () => {
  // ── TC-040 ─────────────────────────────────────────────────────────────────
  test('TC-040: Calendar page renders the calendar view', async ({ page, adminPage }) => {
    void adminPage

    await page.route('**/api/schedules**', (route) => route.fulfill({ json: [] }))

    await page.goto('/calendar')

    // Page should render without error
    await expect(page.locator('body')).toBeVisible()
    // The calendar or its container should be present
    await expect(
      page.locator('.fc, [data-testid="calendar"]').or(page.getByRole('main'))
    ).toBeVisible()
  })

  // ── TC-041 ─────────────────────────────────────────────────────────────────
  test('TC-041: Generate schedules button calls POST /api/schedules/generate and shows success toast', async ({
    page,
    adminPage,
  }) => {
    void adminPage

    await page.route('**/api/schedules**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: [] })
      }
      return route.continue()
    })
    await page.route('**/api/schedules/generate', (route) =>
      route.fulfill({
        json: { generated: 15, skipped: 0, errors: 0 },
      })
    )

    await page.goto('/calendar')

    const generateButton = page.getByRole('button', { name: /Gerar Agendamentos/i })
    await expect(generateButton).toBeVisible()

    const [request] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/api/schedules/generate') && req.method() === 'POST'
      ),
      generateButton.click(),
    ])

    expect(request.url()).toContain('/api/schedules/generate')

    // Success toast/message should appear with generated count
    await expect(page.getByText(/15.*agendamentos/i)).toBeVisible()
  })

  // ── TC-042 ─────────────────────────────────────────────────────────────────
  test('TC-042: Click on calendar date opens day detail panel', async ({ page, adminPage }) => {
    void adminPage

    await page.route('**/api/schedules**', (route) => route.fulfill({ json: [mockSchedule] }))

    await page.goto('/calendar')

    // Click on a date cell in the FullCalendar grid
    const dateCell = page.locator('.fc-daygrid-day, [data-date]').first()
    await expect(dateCell).toBeVisible()
    await dateCell.click()

    // A panel or dialog showing day details should appear
    const dayPanel = page.locator('[role="dialog"], [data-testid="day-detail"]')
    await expect(dayPanel).toBeVisible()
  })

  // ── TC-043 ─────────────────────────────────────────────────────────────────
  test('TC-043: Mark schedule complete from calendar updates status badge', async ({
    page,
    adminPage,
  }) => {
    void adminPage

    await page.route('**/api/schedules**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: [mockSchedule] })
      }
      return route.continue()
    })
    await page.route(`**/api/schedules/${mockSchedule.id}/status`, (route) =>
      route.fulfill({
        json: { ...mockSchedule, status: 'completed', completedAt: new Date().toISOString() },
      })
    )

    await page.goto('/calendar')

    // Open day detail panel
    const dateCell = page.locator('.fc-daygrid-day, [data-date]').first()
    await dateCell.click()

    // Mark the schedule as complete
    const completeButton = page.getByRole('button', {
      name: /Conclu[ií]r|Marcar como conclu[ií]do/i,
    })
    await expect(completeButton).toBeVisible()
    await completeButton.click()

    // Status badge should update to "completed"
    await expect(page.getByText(/Conclu[ií]da/i)).toBeVisible()
  })
})
