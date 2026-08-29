import pg from 'pg'

const { Client } = pg

// Same isolated Postgres test DB admin-dashboard's own e2e suite uses
// (admin-api/docker-compose.test.yml, admin-api/.env.test). Both suites
// truncate + reseed their own tables at the start of a run, so running them
// back to back is safe; running them concurrently against the same DB is not.
export const TEST_DB_CONFIG = {
  host: 'localhost',
  port: 5433,
  user: 'zavoia_user',
  password: 'zavoia_password',
  database: 'zavoia_test_db',
}

export async function withTestDb<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new Client(TEST_DB_CONFIG)
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}
