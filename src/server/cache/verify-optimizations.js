import { getDB, insert, query } from '../db.js'

async function verify() {
  console.log('[Verify] Database verification\n')

  const db = await getDB('./test-world')

  console.log('=== 1. Direct SQL Operations ===')
  console.log('Creating test data...')

  insert('users', {
    id: 'user-1',
    name: 'User One',
    email: 'user1@test.com',
    createdAt: Date.now(),
  })

  insert('users', {
    id: 'user-2',
    name: 'User Two',
    email: 'user2@test.com',
    createdAt: Date.now(),
  })

  insert('blueprints', {
    id: 'bp-1',
    data: JSON.stringify({ name: 'Blueprint 1', type: 'app' }),
    createdAt: Date.now(),
  })

  insert('entities', {
    id: 'entity-1',
    worldId: 'world-1',
    data: JSON.stringify({ name: 'Entity 1' }),
    createdAt: Date.now(),
  })

  console.log('\n=== 2. Query Operations ===')
  console.log('Running queries...')

  const users = query(`SELECT * FROM users`)
  console.log(`Found ${users.length} users`)
  console.log(JSON.stringify(users, null, 2))

  const blueprints = query(`SELECT * FROM blueprints`)
  console.log(`Found ${blueprints.length} blueprints`)

  const entities = query(`SELECT * FROM entities`)
  console.log(`Found ${entities.length} entities`)

  console.log('\n=== 3. Database Indexes ===')
  const indexes = query(`SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND tbl_name IN ('users', 'blueprints', 'entities', 'config', 'files')`)
  console.log(`Total indexes: ${indexes.length}`)
  const indexesByTable = {}
  for (const idx of indexes) {
    if (!indexesByTable[idx.tbl_name]) indexesByTable[idx.tbl_name] = []
    indexesByTable[idx.tbl_name].push(idx.name)
  }
  console.log('Indexes by table:', JSON.stringify(indexesByTable, null, 2))

  console.log('\n=== 4. Cleanup ===')
  console.log('Deleting test data...')
  db.exec(`DELETE FROM users WHERE id = ?`, ['user-1'])
  db.exec(`DELETE FROM users WHERE id = ?`, ['user-2'])
  db.exec(`DELETE FROM blueprints WHERE id = ?`, ['bp-1'])
  db.exec(`DELETE FROM entities WHERE id = ?`, ['entity-1'])

  console.log('\n=== VERIFICATION COMPLETE ===')
  process.exit(0)
}

verify().catch(e => {
  console.error('Verification failed:', e)
  process.exit(1)
})
