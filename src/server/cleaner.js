import { createAssets } from './assets.js'

export async function cleanOrphanedAssets(db, config, dryRun = true) {
  console.log('[cleaner] scanning for orphaned assets')

  const assets = createAssets(config)
  await assets.init(config)

  const referencedAssets = new Set()

  const tables = ['users', 'blueprints', 'entities', 'config']
  for (const table of tables) {
    try {
      const rows = await db.raw(`SELECT * FROM ${table}`).all()
      for (const row of rows) {
        const json = JSON.stringify(row)
        const hashes = json.match(/[a-f0-9]{64}\.[a-z]+/g) || []
        for (const hash of hashes) {
          referencedAssets.add(hash)
        }
      }
    } catch (error) {
      // table may not exist
    }
  }

  const allAssets = await assets.list()
  const orphaned = Array.from(allAssets).filter(asset => !referencedAssets.has(asset))

  console.log(`[cleaner] found ${orphaned.length} orphaned assets out of ${allAssets.size} total`)

  if (dryRun) {
    console.log('[cleaner] dry-run mode - no assets deleted')
    return { success: true, orphaned, dryRun: true }
  }

  const result = await assets.delete(orphaned)
  console.log(`[cleaner] deleted ${result.removed} assets (${result.freed} bytes freed)`)
  return result
}
