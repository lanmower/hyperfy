import esbuild from 'esbuild'
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

async function buildClient() {
  console.log('[build] Starting client bundle...')
  try {
    await esbuild.build({
      entryPoints: [path.join(rootDir, 'src/client/index.js')],
      outfile: path.join(buildDir, 'public/client.js'),
      bundle: true,
      format: 'iife',
      platform: 'browser',
      sourcemap: !isProduction,
      minify: isProduction,
      jsx: 'transform',
      jsxImportSource: 'react',
      external: [
        'fs',
        'fs-extra',
        'path',
        'util',
        'assert',
        'stream',
        'constants',
        'crypto',
        'url',
        'child_process',
        'worker_threads',
      ],
      loader: {
        '.glb': 'file',
        '.hdr': 'file',
        '.mp4': 'file',
        '.woff2': 'file',
        '.wasm': 'file',
        '.png': 'file',
        '.js': 'jsx',
      },
      logLevel: 'info',
    })
    console.log('[build] Client bundle complete')
  } catch (err) {
    console.error('[build] Client bundle failed:', err.message)
    throw err
  }
}

async function main() {
  try {
    await fs.ensureDir(buildDir)
    await fs.ensureDir(path.join(buildDir, 'public'))

    await Promise.all([buildServer(), buildClient()])

    console.log('[build] Build succeeded')
    process.exit(0)
  } catch (err) {
    console.error('[build] Build failed')
    process.exit(1)
  }
}

await main()
