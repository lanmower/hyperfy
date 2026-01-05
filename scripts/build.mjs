import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs-extra'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const nodeEnv = process.env.NODE_ENV || 'production'

const isProduction = nodeEnv === 'production'
const buildDir = path.join(rootDir, 'build')

console.log(`[build] NODE_ENV=${nodeEnv} isProduction=${isProduction}`)

async function buildServer() {
  console.log('[build] Copying server files...')
  try {
    await fs.ensureDir(buildDir)
    await fs.copy(path.join(rootDir, 'src'), path.join(buildDir, 'src'))
    await fs.copy(path.join(rootDir, 'src/server/index.js'), path.join(buildDir, 'index.js'))
    console.log('[build] Server files copied')
  } catch (err) {
    console.error('[build] Server preparation failed:', err.message)
    throw err
  }
}

async function main() {
  try {
    await fs.ensureDir(buildDir)
    await fs.ensureDir(path.join(buildDir, 'public'))

    await buildServer()

    console.log('[build] Build succeeded (client uses hot reloading ES modules, not bundled)')
    process.exit(0)
  } catch (err) {
    console.error('[build] Build failed')
    process.exit(1)
  }
}

await main()
