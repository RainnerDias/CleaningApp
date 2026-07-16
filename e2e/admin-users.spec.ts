import { test, expect } from './fixtures/auth.fixture'
import { mockAdmin, mockUser } from './fixtures/mock-data'

test.describe('Admin — Users management', () => {
  // ── TC-030 ─────────────────────────────────────────────────────────────────
  test('TC-030: Users page shows table with role badges', async ({ page, adminPage }) => {
    void adminPage

    await page.route('**/api/users', (route) => route.fulfill({ json: [mockAdmin, mockUser] }))

    await page.goto('/users')

    await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible()
    await expect(page.getByText('Maria Silva')).toBeVisible()
    await expect(page.getByText('Admin')).toBeVisible()
    // Role badges should be visible
    await expect(page.getByText('admin').first()).toBeVisible()
    await expect(page.getByText('user').first()).toBeVisible()
  })

  // ── TC-031 ─────────────────────────────────────────────────────────────────
  test('TC-031: Invite user dialog — email validation on empty submit', async ({
    page,
    adminPage,
  }) => {
    void adminPage

    await page.route('**/api/users', (route) => route.fulfill({ json: [mockAdmin, mockUser] }))

    await page.goto('/users')
    await page.getByRole('button', { name: 'Convidar Usuário' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Convidar Usuário' })).toBeVisible()

    // Submit without filling required fields
    await page.getByRole('button', { name: 'Enviar convite' }).click()

    // Validation errors should appear
    await expect(page.getByRole('alert').first()).toBeVisible()
  })

  // ── TC-031b ────────────────────────────────────────────────────────────────
  test('TC-031b: Invite user dialog — invalid email format shows validation error', async ({
    page,
    adminPage,
  }) => {
    void adminPage

    await page.route('**/api/users', (route) => route.fulfill({ json: [mockAdmin, mockUser] }))

    await page.goto('/users')
    await page.getByRole('button', { name: 'Convidar Usuário' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()

    await page.locator('#invite-name').fill('João Silva')
    await page.locator('#invite-email').fill('not-an-email')
    await page.getByRole('button', { name: 'Enviar convite' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
  })

  // ── TC-032 ─────────────────────────────────────────────────────────────────
  test('TC-032: Disable user — confirmation dialog has destructive action button', async ({
    page,
    adminPage,
  }) => {
    void adminPage

    await page.route('**/api/users', (route) => route.fulfill({ json: [mockAdmin, mockUser] }))
    await page.route('**/api/users/user-1', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({ json: { ...mockUser, active: false } })
      } else {
        await route.fulfill({ json: mockUser })
      }
    })

    await page.goto('/users')

    // The disable/enable toggle button should exist for the user row
    const disableButton = page.getByRole('button', { name: /Desativar|Ativar/i }).first()
    await expect(disableButton).toBeVisible()
    await disableButton.click()

    // Confirmation dialog should appear
    await expect(page.getByRole('alertdialog')).toBeVisible()
    // The destructive confirm button should be visible
    const confirmButton = page.getByRole('alertdialog').getByRole('button', {
      name: /Desativar|Confirmar/i,
    })
    await expect(confirmButton).toBeVisible()
  })

  // ── TC-033 ─────────────────────────────────────────────────────────────────
  test('TC-033: Edit user — email field is read-only', async ({ page, adminPage }) => {
    void adminPage

    await page.route('**/api/users', (route) => route.fulfill({ json: [mockAdmin, mockUser] }))

    await page.goto('/users')
    await page
      .getByRole('button', { name: /Editar/i })
      .first()
      .click()

    await expect(page.getByRole('dialog')).toBeVisible()

    // Email input should be present but disabled/read-only
    const emailInput = page.getByRole('dialog').locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    // Email cannot be edited — assert readonly or disabled attribute
    const isReadonlyOrDisabled = await emailInput.evaluate((el) => {
      const input = el as HTMLInputElement
      return input.readOnly || input.disabled
    })
    expect(isReadonlyOrDisabled).toBe(true)
  })
})
