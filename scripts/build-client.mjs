#!/usr/bin/env node
import * as esbuild from 'esbuild-wasm'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs-extra'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.dirname(__dirname)

async function build() {
  console.log('[Build] Initializing esbuild...')

  try {
    await esbuild.initialize({})
    console.log('[Build] Building client bundle...')

    const outfile = path.join(rootDir, 'src/client/public/dist/client.js')
    fs.ensureDirSync(path.dirname(outfile))

    const result = await esbuild.build({
      entryPoints: [path.join(rootDir, 'src/client/index.js')],
      bundle: true,
      format: 'esm',
      target: 'es2020',
      outfile,
      external: [
        'three', 'three/examples/jsm/*',
        'fs', 'path', 'url', 'child_process', 'os', 'zlib', 'util', 'assert', 'constants', 'stream', 'buffer',
        'graceful-fs', 'fs-extra',
        './loaders/ServerAssetHandlers.js', 'src/core/systems/loaders/ServerAssetHandlers.js',
        './storage-node.js', 'src/core/storage-node.js'
      ],
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx'
      },
      define: {
        'process.env.NODE_ENV': '"development"',
      },
      logLevel: 'info',
      minify: false,
      sourcemap: true,
    })

    console.log('[Build] ✅ Client bundle created successfully')
  } catch (err) {
    console.error('[Build] ❌ Build failed:', err.message)
    if (err.errors) {
      err.errors.forEach(e => console.error('  -', e.text))
    }
    process.exit(1)
  }
}

build()
