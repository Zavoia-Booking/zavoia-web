import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Client } from 'pg'
import { TEST_DB_CONFIG } from './fixtures/test-db'

// Playwright loads this file as CommonJS (no "type": "module" in
// package.json) — __dirname is the ambient CJS global, not an ESM import.
const ADMIN_API_DIR = resolve(__dirname, '..', '..', 'admin-api')
const DEMO_SEED_SQL = resolve(ADMIN_API_DIR, 'scripts', 'seed-demo-4-businesses.sql')

/**
 * Runs once per `playwright test` invocation, before any project/worker starts.
 *
 * 1. Truncates every marketplace-relevant table via admin-api's own
 *    `truncate:e2e` script (shared with admin-dashboard's e2e suite — same
 *    test DB, same table list, extended here with review/favorite/map tables).
 * 2. Re-seeds the standard 4-business demo dataset (Atelier Glow, Barber
 *    Bros, Zen Spa, Smile Dental) so every spec starts from the same known
 *    businesses/locations/services/staff without hand-rolling fixtures.
 *    Owner login: andrei.sandica.94+demo@gmail.com / Parola123!
 *    (see e2e/fixtures/seed.ts for the exact slugs/uuids this creates).
 *
 * Per-suite deltas (booking_settings rows, price overrides, calendar
 * blocks, appointments in a specific status, etc.) are seeded by individual
 * specs via e2e/fixtures/seed.ts — this file only establishes the shared
 * baseline.
 */
async function globalSetup(): Promise<void> {
  execSync('yarn truncate:e2e', {
    cwd: ADMIN_API_DIR,
    stdio: 'inherit',
  })

  const sql = readFileSync(DEMO_SEED_SQL, 'utf8')
  const client = new Client(TEST_DB_CONFIG)
  await client.connect()
  try {
    await client.query(sql)
    console.log('[global-setup] Demo seed (4 businesses) loaded into the test DB')
  } finally {
    await client.end()
  }
}

export default globalSetup
