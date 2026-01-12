import { AssetsLocal } from './AssetsLocal.js'
import { AssetsS3 } from './AssetsS3.js'

export function createAssets(config) {
  const storage = process.env.ASSETS === 's3' ? new AssetsS3() : new AssetsLocal()
  return storage
}
