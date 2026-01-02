#!/usr/bin/env node
import 'dotenv-flow/config'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import { watch } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.dirname(__dirname)
const srcDir = path.join(rootDir, 'src')
const serverDir = path.join(srcDir, 'server')
const clientDir = path.join(srcDir, 'client')
const publicDir = path.join(clientDir, 'public')

let serverProcess = null
let clientBuildProcess = null
let watchTimeout = null
let rebuildTimeout = null

console.log('\n🚀 Starting Hyperfy with hot reload...')
console.log('📦 Building client bundle and watching for changes')
console.log('🔥 Hot reload enabled\n')

async function buildClient() {
  return new Promise((resolve, reject) => {
    console.log('🔨 Building client bundle...')
    clientBuildProcess = spawn('node', [path.join(__dirname, 'build-client.mjs')], {
      cwd: rootDir,
      stdio: ['inherit', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    clientBuildProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim()
      if (msg) {
        console.log(msg)
        stdout += msg + '\n'
      }
    })

    clientBuildProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim()
      if (msg) {
        console.error(msg)
        stderr += msg + '\n'
      }
    })

    clientBuildProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Client bundle built successfully')
        resolve()
      } else {
        console.error('❌ Client build failed with code', code)
        reject(new Error(`Build failed: ${stderr || stdout}`))
      }
      clientBuildProcess = null
    })

    clientBuildProcess.on('error', (err) => {
      console.error('❌ Client build error:', err.message)
      clientBuildProcess = null
      reject(err)
    })
  })
}

async function startServer() {
  if (serverProcess) {
    serverProcess.kill()
  }

  console.log('⏳ Starting server...')
  serverProcess = spawn('node', ['src/server/index.js'], {
    cwd: rootDir,
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: process.env.PORT || 3000,
    },
  })

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Server exited with code ${code}`)
    }
  })

  serverProcess.on('error', (err) => {
    console.error('Server error:', err.message)
  })
}

function debounceServerRestart(delay = 500) {
  if (watchTimeout) clearTimeout(watchTimeout)
  watchTimeout = setTimeout(() => {
    console.log('\n📦 Server files changed - restarting server...')
    startServer()
  }, delay)
}

function debounceClientRebuild(delay = 500) {
  if (rebuildTimeout) clearTimeout(rebuildTimeout)
  rebuildTimeout = setTimeout(async () => {
    console.log('\n📦 Client files changed - rebuilding bundle...')
    try {
      await buildClient()
      if (serverProcess) {
        try {
          serverProcess.send({ type: 'hotReload', file: 'client' })
        } catch (e) {
          // Process might not have IPC channel
        }
      }
    } catch (err) {
      console.error('Build error:', err.message)
    }
  }, delay)
}

async function setupWatchers() {
  // Watch server files
  watch(serverDir, { recursive: true }, (eventType, filename) => {
    if (!filename || filename.includes('.git') || filename.includes('node_modules') || filename.includes('dist')) return
    if (filename.endsWith('.js') || filename.endsWith('.mjs')) {
      console.log(`  📝 server: ${filename} changed`)
      debounceServerRestart()
    }
  })

  // Watch client files - rebuild bundle on changes
  watch(clientDir, { recursive: true }, (eventType, filename) => {
    if (!filename || filename.includes('.git') || filename.includes('node_modules') || filename.includes('dist')) return
    if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      console.log(`  📝 client: ${filename} changed`)
      debounceClientRebuild()
    }
  })

  console.log('👀 Watching for file changes...')
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...')
  if (serverProcess) {
    serverProcess.kill()
  }
  if (clientBuildProcess) {
    clientBuildProcess.kill()
  }
  process.exit(0)
})

// Start everything
async function main() {
  try {
    await buildClient()
    await setupWatchers()
    await startServer()
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
}

main()
