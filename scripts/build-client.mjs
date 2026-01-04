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
const watch = process.argv.includes('--watch')

console.log(`[build-client] NODE_ENV=${nodeEnv} watch=${watch}`)

async function build() {
  try {
    await fs.ensureDir(path.join(buildDir, 'public'))

    const config = {
      entryPoints: [path.join(rootDir, 'src/client/index.js')],
      outfile: path.join(buildDir, 'public/client.js'),
      bundle: true,
      format: 'iife',
      platform: 'browser',
      sourcemap: !isProduction,
      minify: isProduction,
      loader: {
        '.js': 'jsx',
        '.glb': 'file',
        '.hdr': 'file',
        '.mp4': 'file',
        '.woff2': 'file',
        '.wasm': 'file',
        '.png': 'file',
      },
      external: ['path', 'fs', 'fs-extra', 'stream', 'constants', 'node:worker_threads', 'worker_threads'],
      logLevel: 'info',
    }

    if (watch) {
      console.log('[build-client] Starting watch mode...')
      const ctx = await esbuild.context(config)
      await ctx.watch()
      console.log('[build-client] Watching for changes...')
    } else {
      await esbuild.build(config)
      console.log('[build-client] Build complete')
    }
  } catch (err) {
    console.error('[build-client] Build failed:', err.message)
    process.exit(1)
  }
}

await build()
