// hot reload dev server for hyperfy

import 'dotenv-flow/config'
import fs from 'fs-extra'
import path from 'path'
import { fork } from 'child_process'
import * as esbuild from 'esbuild'
import { fileURLToPath } from 'url'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(dirname, '../')
const buildDir = path.join(rootDir, 'build')

await fs.emptyDir(path.join(buildDir, 'public'))

let serverSpawn = null
let clientBuildId = Date.now()
let isFirstBuild = true
let buildStartTime = Date.now()

function log(type, msg, data) {
  const types = { info: 'ⓘ', warn: '⚠', error: '✕', success: '✓' }
  const time = new Date().toISOString().split('T')[1].split('.')[0]
  console.log(`${time} ${types[type] || '·'} ${msg}${data ? ' ' + JSON.stringify(data) : ''}`)
}

function notifyHotReload() {
  if (serverSpawn && serverSpawn.connected) {
    serverSpawn.send({ type: 'hotReload' })
    log('success', 'HMR broadcast sent to clients')
  }
}

const clientPublicDir = path.join(rootDir, 'src/client/public')
const clientBuildDir = path.join(rootDir, 'build/public')
const clientHtmlSrc = path.join(rootDir, 'src/client/public/index.html')
const clientHtmlDest = path.join(rootDir, 'build/public/index.html')

async function buildClient() {
  const clientCtx = await esbuild.context({
    entryPoints: ['src/client/index.js', 'src/client/particles.js'],
    entryNames: '/[name]-[hash]',
    outdir: clientBuildDir,
    platform: 'browser',
    format: 'esm',
    bundle: true,
    treeShaking: true,
    minify: false,
    sourcemap: true,
    metafile: true,
    jsx: 'automatic',
    jsxImportSource: '@firebolt-dev/jsx',
    external: ['fs', 'fs-extra', 'path', 'url', 'crypto', 'util', 'stream', 'assert', 'constants', 'module', 'jsonwebtoken', 'jws', 'jwa'],
    define: {
      'process.env.NODE_ENV': '"development"',
      'process.env.CLIENT': 'true',
    },
    loader: {
      '.js': 'jsx',
    },
    alias: {
      react: 'react',
    },
    plugins: [
      {
        name: 'exclude-server-modules',
        setup(build) {
          build.onResolve({ filter: /ServerAssetHandlers\.js$/ }, () => ({
            path: 'excluded',
            external: true,
          }))
        },
      },
      {
        name: 'client-hot-reload',
        setup(build) {
          build.onEnd(async result => {
            if (result.errors.length > 0) {
              log('error', 'Client build failed', { errors: result.errors.length })
              return
            }
            const buildTime = Date.now() - buildStartTime
            try {
              await fs.copy(clientPublicDir, clientBuildDir, { overwrite: true, errorOnExist: false })
              const physxWasmSrc = path.join(rootDir, 'src/core/physx-js-webidl.wasm')
              const physxWasmDest = path.join(rootDir, 'build/public/physx-js-webidl.wasm')
              await fs.copy(physxWasmSrc, physxWasmDest, { overwrite: true, errorOnExist: false })
              const metafile = result.metafile
              const outputFiles = Object.keys(metafile.outputs)
              const jsFile = outputFiles.find(file => file.includes('/index-') && file.endsWith('.js'))
              const particlesFile = outputFiles.find(file => file.includes('/particles-') && file.endsWith('.js'))

              if (!jsFile || !particlesFile) {
                throw new Error(`Missing build output: jsFile=${jsFile}, particlesFile=${particlesFile}`)
              }

              const jsPath = jsFile.split('build/public')[1]
              const particlesPath = particlesFile.split('build/public')[1]
              clientBuildId = Date.now()
              let htmlContent = await fs.readFile(clientHtmlSrc, 'utf-8')
              htmlContent = htmlContent.replace('{jsPath}', jsPath)
              htmlContent = htmlContent.replace('{particlesPath}', particlesPath)
              htmlContent = htmlContent.replaceAll('{buildId}', clientBuildId)
              await fs.writeFile(clientHtmlDest, htmlContent)

              const wsUrl = process.env.PUBLIC_WS_URL || 'ws://localhost:3000/ws'
              const envContent = `window.env = { PUBLIC_WS_URL: '${wsUrl}' }`
              await fs.writeFile(path.join(clientBuildDir, 'env.js'), envContent)

              log('success', 'Client built', { ms: buildTime })
              if (!isFirstBuild) {
                notifyHotReload()
              }
            } catch (err) {
              log('error', 'Client build error', { error: err.message })
            }
          })
        },
      },
    ],
  })
  await clientCtx.watch()
  await clientCtx.rebuild()
  fs.writeFileSync(path.join(buildDir, 'meta.json'), JSON.stringify({}, null, 2))
  return clientCtx
}

async function buildServer() {
  const serverCtx = await esbuild.context({
    entryPoints: ['src/server/index.js'],
    outfile: 'build/index.js',
    platform: 'node',
    format: 'esm',
    bundle: true,
    treeShaking: true,
    minify: false,
    sourcemap: true,
    packages: 'external',
    external: ['dotenv-flow'],
    define: {
      'process.env.CLIENT': 'false',
      'process.env.SERVER': 'true',
    },
    plugins: [
      {
        name: 'server-hot-reload',
        setup(build) {
          build.onEnd(async result => {
            if (result.errors.length > 0) {
              log('error', 'Server build failed', { errors: result.errors.length })
              return
            }
            const buildTime = Date.now() - buildStartTime
            try {
              const physxIdlSrc = path.join(rootDir, 'src/core/physx-js-webidl.js')
              const physxIdlDest = path.join(rootDir, 'build/physx-js-webidl.js')
              await fs.copy(physxIdlSrc, physxIdlDest)
              const physxWasmSrc = path.join(rootDir, 'src/core/physx-js-webidl.wasm')
              const physxWasmDest = path.join(rootDir, 'build/physx-js-webidl.wasm')
              await fs.copy(physxWasmSrc, physxWasmDest)
              if (serverSpawn) {
                log('info', 'Server restarting...')
                await new Promise(resolve => {
                  serverSpawn.once('exit', () => {
                    setTimeout(resolve, 3000)
                  })
                  serverSpawn.kill('SIGKILL')
                  setTimeout(resolve, 5000)
                })
              }
              serverSpawn = fork(path.join(rootDir, 'build/index.js'), [], { env: process.env })
              serverSpawn.on('error', err => log('error', 'Server process error', { error: err.message }))
              serverSpawn.on('exit', code => {
                if (code && code !== 0) log('warn', 'Server exited', { code })
              })
              log('success', 'Server started', { ms: buildTime })
              isFirstBuild = false
            } catch (err) {
              log('error', 'Server build error', { error: err.message })
            }
          })
        },
      },
    ],
  })
  await serverCtx.watch()
  return serverCtx
}

async function main() {
  log('info', 'Dev server starting with hot reload...')
  try {
    buildStartTime = Date.now()
    await buildClient()
    await buildServer()
    log('success', 'Dev server ready', { ms: Date.now() - buildStartTime })
  } catch (err) {
    log('error', 'Dev server initialization failed', { error: err.message })
    process.exit(1)
  }
}

async function gracefulShutdown() {
  log('info', 'Shutting down dev server...')
  if (serverSpawn) {
    await new Promise(resolve => {
      serverSpawn.once('exit', resolve)
      serverSpawn.kill('SIGTERM')
      setTimeout(resolve, 5000)
    })
  }
  process.exit(0)
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

main().catch(err => {
  log('error', 'Fatal error', { error: err.message })
  process.exit(1)
})
