import { getDB, closeDB } from '../db.js'

async function verify() {
  console.log('[Verify] Database verification\n')

  const db = await getDB('./test-world')

  console.log('=== 1. Direct SQL Operations ===')
  console.log('Creating test data...')

  await db.exec('INSERT INTO users (id, name, email, createdAt) VALUES (?, ?, ?, ?)', [
    'user-1',
    'User One',
    'user1@test.com',
    Date.now(),
  ])

  await db.exec('INSERT INTO users (id, name, email, createdAt) VALUES (?, ?, ?, ?)', [
    'user-2',
    'User Two',
    'user2@test.com',
    Date.now(),
  ])

  await db.exec('INSERT INTO blueprints (id, data, createdAt) VALUES (?, ?, ?)', [
    'bp-1',
    JSON.stringify({ name: 'Blueprint 1', type: 'app' }),
    Date.now(),
  ])

  await db.exec('INSERT INTO entities (id, worldId, data, createdAt) VALUES (?, ?, ?, ?)', [
    'entity-1',
    'world-1',
    JSON.stringify({ name: 'Entity 1' }),
    Date.now(),
  ])

  console.log('\n=== 2. Query Operations ===')
  console.log('Running queries...')

  const users = await db.query(`SELECT * FROM users`)
  console.log(`Found ${users.length} users`)
  console.log(JSON.stringify(users, null, 2))

  const blueprints = await db.query(`SELECT * FROM blueprints`)
  console.log(`Found ${blueprints.length} blueprints`)

  const entities = await db.query(`SELECT * FROM entities`)
  console.log(`Found ${entities.length} entities`)

  console.log('\n=== 3. Cleanup ===')
  console.log('Deleting test data...')
  await db.exec(`DELETE FROM users WHERE id = ?`, ['user-1'])
  await db.exec(`DELETE FROM users WHERE id = ?`, ['user-2'])
  await db.exec(`DELETE FROM blueprints WHERE id = ?`, ['bp-1'])
  await db.exec(`DELETE FROM entities WHERE id = ?`, ['entity-1'])

  await closeDB()

  console.log('\n=== VERIFICATION COMPLETE ===')
  process.exit(0)
}

verify().catch(e => {
  console.error('Verification failed:', e)
  process.exit(1)
})
