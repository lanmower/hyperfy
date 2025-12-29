import 'dotenv-flow/config'
import fs from 'fs-extra'
import path from 'path'
import * as esbuild from 'esbuild'
import { fileURLToPath } from 'url'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'

const dev = process.argv.includes('--dev')
const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(dirname, '../')
const buildDir = path.join(rootDir, 'build')

await fs.emptyDir(buildDir)

/**
 * Build Client
 */

const buildDirectory = path.join(rootDir, 'build')

{
  const clientCtx = await esbuild.context({
    entryPoints: ['src/client/world-client.js'],
    outfile: 'build/world-client.js',
    platform: 'browser',
    format: 'esm',
    bundle: true,
    treeShaking: true,
    minify: !dev,
    sourcemap: dev ? 'inline' : false,
    metafile: true,
    jsx: 'automatic',
    jsxImportSource: '@firebolt-dev/jsx',
    splitting: false,
    loader: {
      '.js': 'jsx',
    },
    external: ['three', 'react', 'react-dom', 'ses'],
    plugins: [polyfillNode({})],
  })
  if (dev) {
    await clientCtx.watch()
  } else {
    const result = await clientCtx.rebuild()
    await fs.writeJson(path.join(buildDir, 'meta.json'), result.metafile, { spaces: 2 })
    console.log('Build complete. Metafile saved to build/meta.json')
    process.exit(0)
  }
}
