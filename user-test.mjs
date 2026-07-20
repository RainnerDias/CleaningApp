import { chromium } from '@playwright/test'

const BASE = 'https://cleaning-fbc6orpr2-rainner.vercel.app'
const ADMIN_EMAIL = 'diasrainner@gmail.com'
const ADMIN_PASS = 'App@2026'
const USER_EMAIL = 'rainnerskt@hotmail.com.br'
const USER_PASS = 'App@2026'

const results = []
const log = (label, status, detail = '') => {
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '~'
  console.log(`${icon} [${status}] ${label}${detail ? ' — ' + detail : ''}`)
  results.push({ label, status, detail })
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(4000)
  return page.url()
}

const browser = await chromium.launch({ headless: true })

// ─── STEP 1: Admin generates schedules ───────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  STEP 1 — GENERATE SCHEDULES (ADMIN)')
console.log('══════════════════════════')

const adminCtx = await browser.newContext()
const adminPage = await adminCtx.newPage()

const adminUrl = await login(adminPage, ADMIN_EMAIL, ADMIN_PASS)
log('Admin login', adminUrl.includes('/dashboard') ? 'PASS' : 'FAIL', adminUrl)

if (adminUrl.includes('/dashboard')) {
  const genResult = await adminPage.evaluate(async (base) => {
    const r = await fetch(`${base}/api/schedules/generate`, { method: 'POST' })
    return { status: r.status, body: await r.text() }
  }, BASE)
  console.log(`\nSchedule generation: HTTP ${genResult.status}`)
  console.log(`Response: ${genResult.body.slice(0, 300)}`)
  log('Schedules generated', genResult.status === 200 || genResult.status === 201 ? 'PASS' : 'WARN',
    `HTTP ${genResult.status}`)
}

await adminCtx.close()

// ─── STEP 2: User login ───────────────────────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  STEP 2 — USER LOGIN')
console.log('══════════════════════════')

const userCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await userCtx.newPage()

const apiErrors = []
page.on('response', async res => {
  if (res.url().includes('/api/') && res.status() >= 400) {
    const body = await res.text().catch(() => '')
    apiErrors.push(`${res.status()} ${res.url().split('?')[0]} — ${body.slice(0, 150)}`)
  }
})
page.on('pageerror', err => apiErrors.push('[page-error] ' + err.message))

const userUrl = await login(page, USER_EMAIL, USER_PASS)
log('User login', userUrl.includes('/today') || userUrl.includes('/dashboard') ? 'PASS' : 'FAIL', userUrl)

if (!userUrl.includes('/today') && !userUrl.includes('/dashboard')) {
  const alert = await page.$('[role="alert"]')
  if (alert) console.log('Alert:', await alert.innerText())
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300))
  console.log('Body:', bodyText)
}

// ─── STEP 3: Today view ───────────────────────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  STEP 3 — TODAY VIEW')
console.log('══════════════════════════')
apiErrors.length = 0

await page.goto(`${BASE}/today`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)
const todayText = await page.evaluate(() => document.body.innerText)

log('Today page loads', page.url().includes('/today') ? 'PASS' : 'FAIL', page.url())
log('Greeting visible', todayText.includes('Bom dia') || todayText.includes('Boa') ? 'PASS' : 'FAIL')

const hasTasks = todayText.includes('tarefa') || todayText.match(/\d+ tarefa/)
const hasEmptyState = todayText.includes('Nenhuma tarefa') || todayText.includes('nenhuma tarefa')
log('Today content',
  hasTasks ? 'PASS' : hasEmptyState ? 'WARN' : 'WARN',
  hasTasks ? 'tasks visible' : hasEmptyState ? 'no tasks today (may be expected)' : todayText.slice(0, 100).replace(/\n/g, ' '))

// Count tasks if any
const taskCount = (todayText.match(/checkbox|taref/gi) || []).length
console.log(`  Task indicators found: ${taskCount}`)
console.log(`  Page preview: ${todayText.slice(0, 200).replace(/\n/g, ' | ')}`)

if (apiErrors.length) {
  console.log('  API errors:', apiErrors.join(', '))
  apiErrors.length = 0
}

// ─── STEP 4: Try completing a task (if any) ──────────────────────────────────
console.log('\n══════════════════════════')
console.log('  STEP 4 — TASK INTERACTION')
console.log('══════════════════════════')

const checkbox = await page.$('button[role="checkbox"], button[aria-label*="Marcar"], button.rounded-full')
if (checkbox) {
  log('Task checkbox found', 'PASS')
  const beforeText = await page.evaluate(() => document.body.innerText.slice(0, 100))
  await checkbox.click()
  await page.waitForTimeout(2000)
  const afterText = await page.evaluate(() => document.body.innerText.slice(0, 100))
  log('Task click responded', beforeText !== afterText ? 'PASS' : 'WARN', 'UI updated after click')
} else {
  log('Task checkbox found', 'WARN', 'no tasks visible — schedules may not exist for this user today')
}

// ─── STEP 5: Week view ────────────────────────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  STEP 5 — WEEK VIEW')
console.log('══════════════════════════')
apiErrors.length = 0

await page.goto(`${BASE}/week`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)
const weekText = await page.evaluate(() => document.body.innerText)
log('Week page loads', page.url().includes('/week') ? 'PASS' : 'FAIL')
log('Week content', weekText.length > 80 ? 'PASS' : 'WARN', weekText.slice(0, 100).replace(/\n/g, ' '))

// ─── STEP 6: Profile & password change ───────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  STEP 6 — PROFILE')
console.log('══════════════════════════')

await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const profileText = await page.evaluate(() => document.body.innerText)
log('Profile page loads', page.url().includes('/profile') ? 'PASS' : 'FAIL')
log('User email visible', profileText.includes(USER_EMAIL) ? 'PASS' : 'WARN',
  profileText.includes(USER_EMAIL) ? '' : `email not found. Content: ${profileText.slice(0, 150).replace(/\n/g, ' ')}`)
log('Password change section', profileText.includes('Alterar senha') || profileText.includes('senha') ? 'PASS' : 'WARN')

// ─── STEP 7: Admin-only routes blocked ───────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  STEP 7 — ADMIN ROUTES BLOCKED')
console.log('══════════════════════════')

await page.goto(`${BASE}/rooms`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const roomsUrl = page.url()
log('User cannot access /rooms', !roomsUrl.includes('/rooms') || roomsUrl.includes('/login') ? 'PASS' : 'FAIL',
  `redirected to: ${roomsUrl}`)

await page.goto(`${BASE}/users`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const usersUrl = page.url()
log('User cannot access /users', !usersUrl.includes('/users') || usersUrl.includes('/login') ? 'PASS' : 'FAIL',
  `redirected to: ${usersUrl}`)

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  SUMMARY')
console.log('══════════════════════════')
const pass = results.filter(r => r.status === 'PASS').length
const fail = results.filter(r => r.status === 'FAIL').length
const warn = results.filter(r => r.status === 'WARN').length
console.log(`PASS: ${pass}  FAIL: ${fail}  WARN: ${warn}  TOTAL: ${results.length}`)
if (fail > 0) { console.log('\n── FAILURES ──'); results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ✗ ${r.label} — ${r.detail}`)) }
if (warn > 0) { console.log('\n── WARNINGS ──'); results.filter(r => r.status === 'WARN').forEach(r => console.log(`  ~ ${r.label} — ${r.detail}`)) }

await browser.close()
