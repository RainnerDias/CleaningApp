import { test, expect } from './fixtures/auth.fixture'
import { mockSchedule, mockCompletedSchedule } from './fixtures/mock-data'

test.describe('User — History page', () => {
  // ── TC-060 ─────────────────────────────────────────────────────────────────
  test('TC-060: History page shows filter controls', async ({ page, userPage }) => {
    void userPage

    await page.route('**/api/schedules**', (route) =>
      route.fulfill({ json: [mockSchedule, mockCompletedSchedule] })
    )

    await page.goto('/history')

    // Page heading should be visible
    await expect(page.getByRole('heading', { name: /Hist[oó]rico/i })).toBeVisible()

    // Date range inputs should be present
    await expect(page.locator('input[type="date"]').first()).toBeVisible()

    // Status filter dropdown should be present with the default "all" option
    const statusSelect = page.getByRole('combobox').first()
    await expect(statusSelect).toBeVisible()
    await expect(statusSelect).toContainText('Todos os status')
  })

  // ── TC-061 ─────────────────────────────────────────────────────────────────
  test('TC-061: Apply status filter — API is called with status query param', async ({
    page,
    userPage,
  }) => {
    void userPage

    // Default load
    await page.route('**/api/schedules**', (route) =>
      route.fulfill({ json: [mockSchedule, mockCompletedSchedule] })
    )

    await page.goto('/history')

    // Intercept the filtered request to verify the status param is sent
    let filteredUrl = ''
    await page.route('**/api/schedules**', (route) => {
      filteredUrl = route.request().url()
      return route.fulfill({ json: [mockCompletedSchedule] })
    })

    // Select 'completed' status in the filter
    const statusSelect = page.getByRole('combobox').first()
    await statusSelect.selectOption('completed')

    // Apply the filter (button or auto-apply)
    const applyButton = page.getByRole('button', { name: /Filtrar|Aplicar/i })
    if (await applyButton.isVisible()) {
      await applyButton.click()
    }

    // Wait for the filtered request
    await page.waitForResponse((res) => res.url().includes('/api/schedules'))

    expect(filteredUrl).toContain('status=completed')
  })

  // ── TC-062 ─────────────────────────────────────────────────────────────────
  test('TC-062: Pagination — next page button advances the page', async ({ page, userPage }) => {
    void userPage

    // First page
    await page.route('**/api/schedules**', (route) => {
      const url = new URL(route.request().url())
      const pageParam = url.searchParams.get('page') ?? '1'
      const schedules = pageParam === '2' ? [mockCompletedSchedule] : [mockSchedule]
      return route.fulfill({
        json: {
          data: schedules,
          total: 40,
          totalPages: 2,
          page: Number(pageParam),
        },
      })
    })

    await page.goto('/history')

    // Next page button should be available when totalPages > 1
    const nextButton = page.getByRole('button', { name: /Pr[oó]xima/i })
    await expect(nextButton).toBeVisible()
    await nextButton.click()

    // After clicking next, page indicator updates
    await expect(page.getByText(/P[aá]gina 2/i)).toBeVisible()
  })
})
