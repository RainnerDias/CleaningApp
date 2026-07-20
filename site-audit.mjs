import { chromium } from '@playwright/test'

const BASE = 'https://cleaning-fbc6orpr2-rainner.vercel.app'
const EMAIL = 'diasrainner@gmail.com'
const PASSWORD = 'App@2026'

const results = []
const log = (label, status, detail = '') => {
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '~'
  console.log(`${icon} [${status}] ${label}${detail ? ' — ' + detail : ''}`)
  results.push({ label, status, detail })
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()

const pageErrors = []
page.on('pageerror', err => pageErrors.push(err.message))

async function visit(path) {
  pageErrors.length = 0
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
}

function hasContent(text) {
  return text.length > 80 && !text.includes('404') && !text.includes('This page could not be found')
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  AUTH')
console.log('══════════════════════════')
await visit('/login')
log('Login page loads', page.url().includes('/login') ? 'PASS' : 'FAIL', page.url())

await page.fill('#email', EMAIL)
await page.fill('#password', PASSWORD)
await page.click('button[type="submit"]')
await page.waitForTimeout(4000)
const loggedIn = page.url().includes('/dashboard') || page.url().includes('/today')
log('Login → dashboard', loggedIn ? 'PASS' : 'FAIL', page.url())

// ─── ADMIN ROUTES ────────────────────────────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  ADMIN PAGES')
console.log('══════════════════════════')
const adminRoutes = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/rooms', label: 'Rooms' },
  { path: '/tasks', label: 'Tasks' },
  { path: '/users', label: 'Users' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/categories', label: 'Categories' },
  { path: '/reports', label: 'Reports' },
  { path: '/audit-logs', label: 'Audit Logs' },
  { path: '/settings', label: 'Settings' },
]

for (const { path, label } of adminRoutes) {
  await visit(path)
  const url = page.url()
  const text = await page.evaluate(() => document.body.innerText)
  const redirected = !url.includes(path)
  const is404 = text.includes('404') || text.includes('This page could not be found')
  const hasErr = pageErrors.length > 0

  if (redirected) {
    log(label, 'FAIL', `redirected to ${url}`)
  } else if (is404) {
    log(label, 'FAIL', '404 — page does not exist or not-found rendered')
  } else if (hasErr) {
    log(label, 'WARN', pageErrors[0].slice(0, 120))
  } else if (!hasContent(text)) {
    log(label, 'WARN', `short/unexpected content: ${text.slice(0, 80).replace(/\n/g, ' ')}`)
  } else {
    log(label, 'PASS', text.slice(0, 60).replace(/\n/g, ' '))
  }
}

// ─── USER ROUTES ─────────────────────────────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  USER PAGES')
console.log('══════════════════════════')
const userRoutes = [
  { path: '/today', label: 'Today' },
  { path: '/week', label: 'Week' },
  { path: '/month', label: 'Month' },
  { path: '/history', label: 'History' },
  { path: '/profile', label: 'Profile' },
]

for (const { path, label } of userRoutes) {
  await visit(path)
  const url = page.url()
  const text = await page.evaluate(() => document.body.innerText)
  const redirected = !url.includes(path)
  const is404 = text.includes('404') || text.includes('This page could not be found')
  const hasErr = pageErrors.length > 0

  if (redirected) {
    log(label, 'FAIL', `redirected to ${url}`)
  } else if (is404) {
    log(label, 'FAIL', '404 — page does not exist')
  } else if (hasErr) {
    log(label, 'WARN', pageErrors[0].slice(0, 120))
  } else if (!hasContent(text)) {
    log(label, 'WARN', `short/unexpected content: ${text.slice(0, 80).replace(/\n/g, ' ')}`)
  } else {
    log(label, 'PASS', text.slice(0, 60).replace(/\n/g, ' '))
  }
}

// ─── SPECIFIC FUNCTIONALITY ──────────────────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  FUNCTIONALITY')
console.log('══════════════════════════')

// Dashboard stats
await visit('/dashboard')
const dashText = await page.evaluate(() => document.body.innerText)
log('Dashboard has numeric stats', /\d+/.test(dashText) ? 'PASS' : 'WARN')
log('Dashboard no loading spinner stuck', !dashText.toLowerCase().includes('carregando') ? 'PASS' : 'WARN')

// Rooms — list or empty state
await visit('/rooms')
const roomsText = await page.evaluate(() => document.body.innerText)
const hasAddBtn = await page.$('button:has-text("Adicionar"), button:has-text("Nova"), button:has-text("Criar"), button:has-text("Novo")')
log('Rooms: add button present', hasAddBtn ? 'PASS' : 'FAIL', hasAddBtn ? '' : 'no create button found')
log('Rooms: list or empty state', hasContent(roomsText) ? 'PASS' : 'WARN', roomsText.slice(0, 80).replace(/\n/g, ' '))

// Users — admin visible
await visit('/users')
const usersText = await page.evaluate(() => document.body.innerText)
log('Users: admin row visible', usersText.includes('Rainner') || usersText.includes('diasrainner') ? 'PASS' : 'WARN',
  usersText.slice(0, 100).replace(/\n/g, ' '))

// Calendar renders
await visit('/calendar')
const calText = await page.evaluate(() => document.body.innerText)
log('Calendar: date content visible', /julio|julho|jul|2026|\d{1,2}/.test(calText) ? 'PASS' : 'WARN',
  calText.slice(0, 80).replace(/\n/g, ' '))

// Today empty state (no schedules seeded)
await visit('/today')
const todayText = await page.evaluate(() => document.body.innerText)
log('Today: greeting visible', todayText.includes('Bom dia') || todayText.includes('Boa') ? 'PASS' : 'WARN',
  todayText.slice(0, 80).replace(/\n/g, ' '))

// Mobile horizontal scroll
await page.goto(`${BASE}/today`, { waitUntil: 'networkidle' })
const hScrollToday = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
log('Mobile: no horizontal scroll on /today', !hScrollToday ? 'PASS' : 'FAIL')

await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
const hScrollDash = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
log('Mobile: no horizontal scroll on /dashboard', !hScrollDash ? 'PASS' : 'FAIL')

// Forgot password page
await visit('/forgot-password')
log('Forgot password page', page.url().includes('/forgot-password') ? 'PASS' : 'FAIL', page.url())

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════')
console.log('  SUMMARY')
console.log('══════════════════════════')
const pass = results.filter(r => r.status === 'PASS').length
const fail = results.filter(r => r.status === 'FAIL').length
const warn = results.filter(r => r.status === 'WARN').length
console.log(`PASS: ${pass}  FAIL: ${fail}  WARN: ${warn}  TOTAL: ${results.length}`)

if (fail > 0) {
  console.log('\n── FAILURES ──')
  results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ✗ ${r.label} — ${r.detail}`))
}
if (warn > 0) {
  console.log('\n── WARNINGS ──')
  results.filter(r => r.status === 'WARN').forEach(r => console.log(`  ~ ${r.label} — ${r.detail}`))
}

await browser.close()
