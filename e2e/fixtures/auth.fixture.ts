import { test as base, expect } from '@playwright/test'
import { mockAdmin, mockUser } from './mock-data'

type Fixtures = {
  /** Sets up the /api/auth/me route to return an admin user. */
  adminPage: void
  /** Sets up the /api/auth/me route to return a regular user. */
  userPage: void
}

export const test = base.extend<Fixtures>({
  // Parameter is named `runFixture` to avoid react-hooks/rules-of-hooks
  // false-positive: ESLint treats any `use*` call as a React hook.
  adminPage: async ({ page }, runFixture) => {
    await page.route('**/api/auth/me', (route) => route.fulfill({ json: mockAdmin }))
    await runFixture()
  },
  userPage: async ({ page }, runFixture) => {
    await page.route('**/api/auth/me', (route) => route.fulfill({ json: mockUser }))
    await runFixture()
  },
})

export { expect }
