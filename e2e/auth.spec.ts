import { test, expect } from '@playwright/test'
import { mockAdmin, mockUser } from './fixtures/mock-data'

test.describe('Authentication flows', () => {
  // ── TC-001 ─────────────────────────────────────────────────────────────────
  test('TC-001: Login page renders all required elements', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Casa Limpa' })).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  // ── TC-002 ─────────────────────────────────────────────────────────────────
  test('TC-002: Successful admin login redirects to /dashboard', async ({ page }) => {
    // Mock Supabase auth token endpoint
    await page.route('**/auth/v1/token**', (route) =>
      route.fulfill({
        status: 200,
        json: {
          access_token: 'test-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'test-refresh-token',
          user: { id: mockAdmin.id, email: mockAdmin.email },
        },
      })
    )
    // Mock role resolution endpoint
    await page.route('**/api/auth/me', (route) => route.fulfill({ json: mockAdmin }))

    await page.goto('/login')
    await page.locator('#email').fill('admin@example.com')
    await page.locator('#password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await page.waitForURL('**/dashboard', { timeout: 5000 })
    expect(page.url()).toContain('/dashboard')
  })

  // ── TC-003 ─────────────────────────────────────────────────────────────────
  test('TC-003: Login failure shows error alert', async ({ page }) => {
    await page.route('**/auth/v1/token**', (route) =>
      route.fulfill({
        status: 400,
        json: {
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        },
      })
    )

    await page.goto('/login')
    await page.locator('#email').fill('wrong@example.com')
    await page.locator('#password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
  })

  // ── TC-004 ─────────────────────────────────────────────────────────────────
  test('TC-004: Protected route redirects unauthenticated user to /login', async ({ page }) => {
    // Simulate an unauthenticated API response for client-side auth checks
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    )

    await page.goto('/dashboard')
    // Server-side auth (requireAdmin) will redirect before page loads
    await page.waitForURL('**/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  // ── TC-002b ────────────────────────────────────────────────────────────────
  test('TC-002b: Successful user login redirects to /today', async ({ page }) => {
    await page.route('**/auth/v1/token**', (route) =>
      route.fulfill({
        status: 200,
        json: {
          access_token: 'test-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'test-refresh-token',
          user: { id: mockUser.id, email: mockUser.email },
        },
      })
    )
    await page.route('**/api/auth/me', (route) => route.fulfill({ json: mockUser }))

    await page.goto('/login')
    await page.locator('#email').fill('maria@example.com')
    await page.locator('#password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await page.waitForURL('**/today', { timeout: 5000 })
    expect(page.url()).toContain('/today')
  })
})
