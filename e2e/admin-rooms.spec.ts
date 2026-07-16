import { test, expect } from './fixtures/auth.fixture'
import { mockRoom } from './fixtures/mock-data'

test.describe('Admin — Rooms CRUD', () => {
  // ── TC-010 ─────────────────────────────────────────────────────────────────
  test('TC-010: Rooms page shows table with room data', async ({ page, adminPage }) => {
    void adminPage

    await page.route('**/api/rooms', (route) => route.fulfill({ json: [mockRoom] }))

    await page.goto('/rooms')

    await expect(page.getByRole('heading', { name: 'Salas' })).toBeVisible()
    await expect(page.getByText('Cozinha')).toBeVisible()
    // Task count column shows the _count.tasks value
    await expect(page.getByText('3')).toBeVisible()
  })

  // ── TC-011 ─────────────────────────────────────────────────────────────────
  test('TC-011: Create room — dialog opens and form submits successfully', async ({
    page,
    adminPage,
  }) => {
    void adminPage

    await page.route('**/api/rooms', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          json: { ...mockRoom, id: 'room-2', name: 'Banheiro', color: '#06B6D4' },
        })
      } else {
        await route.fulfill({ json: [mockRoom] })
      }
    })

    await page.goto('/rooms')
    await page.getByRole('button', { name: 'Nova Sala' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Criar Sala' })).toBeVisible()

    await page.locator('#room-name').fill('Banheiro')
    await page.locator('#room-icon').fill('🚿')

    await page.getByRole('button', { name: 'Criar sala' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  // ── TC-012 ─────────────────────────────────────────────────────────────────
  test('TC-012: Edit room — dialog prefills with existing room data', async ({
    page,
    adminPage,
  }) => {
    void adminPage

    await page.route('**/api/rooms', (route) => route.fulfill({ json: [mockRoom] }))

    await page.goto('/rooms')
    await page.getByRole('button', { name: 'Editar sala Cozinha' }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Editar Sala' })).toBeVisible()
    await expect(page.locator('#room-name')).toHaveValue('Cozinha')
  })

  // ── TC-013 ─────────────────────────────────────────────────────────────────
  test('TC-013: Delete room — confirmation dialog appears and confirms deletion', async ({
    page,
    adminPage,
  }) => {
    void adminPage

    await page.route('**/api/rooms', (route) => route.fulfill({ json: [mockRoom] }))
    await page.route('**/api/rooms/room-1', (route) => route.fulfill({ json: { success: true } }))

    await page.goto('/rooms')
    await page.getByRole('button', { name: 'Excluir sala Cozinha' }).click()

    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText(/Tem certeza que deseja excluir/)).toBeVisible()
    await expect(page.getByText(/"Cozinha"/)).toBeVisible()

    await page.getByRole('button', { name: 'Excluir sala' }).click()

    await expect(page.getByRole('alertdialog')).not.toBeVisible()
  })
})
