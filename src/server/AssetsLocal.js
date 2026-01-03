import fs from 'fs-extra'
import path from 'path'
import { hashFile } from '../core/utils.js'

export class AssetsLocal {
  constructor() {
    this.dir = null
  }

  async init({ rootDir, worldDir }) {
    console.log('[assets] initializing local storage')
    this.dir = worldDir
    await fs.ensureDir(this.dir)
    const builtInDir = path.join(rootDir, 'src/world/assets')
    const exists = await fs.exists(builtInDir)
    if (exists) {
      await fs.copy(builtInDir, this.dir, { overwrite: false })
    }
  }

  async upload(file) {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const hash = await hashFile(buffer)
    const parts = file.name.split('.')
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'bin'
    if (!ext.match(/^[a-z0-9]{1,5}$/)) {
      throw new Error('Invalid file extension')
    }
    const filename = `${hash}.${ext}`
    const assetPath = path.join(this.dir, filename)
    if (!assetPath.startsWith(path.resolve(this.dir))) {
      throw new Error('Path traversal detected')
    }
    const exists = await fs.exists(assetPath)
    if (!exists) {
      await fs.writeFile(assetPath, buffer)
    }
    return { hash, filename }
  }

  async exists(filename) {
    const filePath = path.join(this.dir, filename)
    return await fs.exists(filePath)
  }

  async list() {
    const assets = new Set()
    const files = await fs.readdir(this.dir)
    for (const file of files) {
      const filePath = path.join(this.dir, file)
      const stat = await fs.stat(filePath)
      if (stat.isDirectory()) continue
      const isAsset = file.split('.')[0].length === 64
      if (isAsset) {
        assets.add(file)
      }
    }
    return assets
  }

  async delete(assetList) {
    let removed = 0
    let freed = 0
    for (const asset of assetList) {
      const fullPath = path.join(this.dir, asset)
      try {
        const stat = await fs.stat(fullPath)
        freed += stat.size
        await fs.remove(fullPath)
        removed++
      } catch (error) {
        // ignore
      }
    }
    return { success: true, count: assetList.length, removed, freed }
  }
}
