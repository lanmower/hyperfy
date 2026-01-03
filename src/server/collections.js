import fs from 'fs-extra'
import path from 'path'
import { importApp } from '../core/extras/appTools.js'

const validatePath = (basePath, targetPath) => {
  const resolved = path.resolve(targetPath)
  const resolvedBase = path.resolve(basePath)
  return resolved.startsWith(resolvedBase)
}

export async function initCollections({ collectionsDir, assetsDir }) {
  let folderNames = fs.readdirSync(collectionsDir)
  folderNames.sort((a, b) => {
    if (a === 'default') return -1
    if (b === 'default') return 1
    return a.localeCompare(b)
  })
  const collections = []
  for (const folderName of folderNames) {
    if (!folderName.match(/^[a-zA-Z0-9_-]+$/)) continue
    const folderPath = path.join(collectionsDir, folderName)
    if (!validatePath(collectionsDir, folderPath)) continue
    const stats = fs.statSync(folderPath)
    if (!stats.isDirectory()) continue
    const manifestPath = path.join(folderPath, 'manifest.json')
    if (!fs.existsSync(manifestPath)) continue
    const manifest = fs.readJsonSync(manifestPath)
    const blueprints = []
    for (const appFilename of manifest.apps) {
      if (!appFilename.match(/^[a-zA-Z0-9_.-]+$/)) continue
      const appPath = path.join(folderPath, appFilename)
      if (!validatePath(folderPath, appPath)) continue
      const appBuffer = fs.readFileSync(appPath)
      const appFile = new File([appBuffer], appFilename, {
        type: 'application/octet-stream',
      })
      const app = await importApp(appFile)
      for (const asset of app.assets) {
        const file = asset.file
        const assetFilename = asset.url.slice(8)
        if (!assetFilename.match(/^[a-zA-Z0-9_.\/-]+$/)) continue
        const assetPath = path.join(assetsDir, assetFilename)
        if (!validatePath(assetsDir, assetPath)) continue
        const exists = await fs.exists(assetPath)
        if (exists) continue
        const arrayBuffer = await file.arrayBuffer()
        await fs.writeFile(assetPath, Buffer.from(arrayBuffer))
      }
      blueprints.push(app.blueprint)
    }
    collections.push({
      id: folderName,
      name: manifest.name,
      blueprints,
    })
  }
  return collections
}
