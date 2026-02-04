import { createAssets } from './assets.js'
import { StructuredLogger } from '../core/utils/logging/index.js'

const logger = new StructuredLogger('Cleaner')

export async function cleanOrphanedAssets(db, config, dryRun = true) {
  logger.info('Scanning for orphaned assets', { context: 'Asset cleanup' })

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

  logger.info('Asset scan complete', { orphaned: orphaned.length, total: allAssets.size })

  if (dryRun) {
    logger.info('Dry-run mode - no assets deleted', { context: 'Asset cleanup' })
    return { success: true, orphaned, dryRun: true }
  }

  const result = await assets.delete(orphaned)
  logger.info('Assets deleted', { removed: result.removed, freed: result.freed })
  return result
}
