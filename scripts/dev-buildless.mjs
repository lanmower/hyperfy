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
let watchTimeout = null

console.log('\n🚀 Starting Hyperfy in buildless mode...')
console.log('📦 No build step - serving ES modules directly')
console.log('🔥 Hot reload enabled\n')

async function startServer() {
  if (serverProcess) {
    serverProcess.kill()
  }

  console.log('⏳ Starting server...')
  serverProcess = spawn('node', ['src/server/index.js'], {
    cwd: rootDir,
    stdio: 'inherit',
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

function debounceRestart(delay = 500) {
  if (watchTimeout) clearTimeout(watchTimeout)
  watchTimeout = setTimeout(() => {
    console.log('\n📦 Files changed - restarting server...')
    startServer()
  }, delay)
}

async function setupWatchers() {
  // Watch server files
  watch(serverDir, { recursive: true }, (eventType, filename) => {
    if (!filename || filename.includes('.git') || filename.includes('node_modules')) return
    if (filename.endsWith('.js') || filename.endsWith('.mjs')) {
      console.log(`  📝 ${filename} changed`)
      debounceRestart()
    }
  })

  // Watch client entry points - these will be served directly
  watch(clientDir, { recursive: true }, (eventType, filename) => {
    if (!filename || filename.includes('.git') || filename.includes('node_modules')) return
    if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      console.log(`  📝 ${filename} changed`)
      if (serverProcess) {
        // Notify server of HMR - send via process message
        try {
          serverProcess.send({ type: 'hotReload', file: filename })
        } catch (e) {
          // Process might not have IPC channel, that's ok
        }
      }
    }
  })

  console.log('👀 Watching for file changes...')
}

async function generateHTML() {
  // Generate index.html from template
  const templatePath = path.join(publicDir, 'index.html')
  const htmlContent = fs.readFileSync(templatePath, 'utf-8')
    .replace('{jsPath}', '/src/client/index.js?t=' + Date.now())
    .replace('{particlesPath}', '/src/client/particles.js?t=' + Date.now())
    .replace('{buildId}', Date.now().toString())

  // Also generate env.js for environment variables
  const wsUrl = process.env.WS_URL || `ws://localhost:${process.env.PORT || 3000}`
  const envJs = `window.ENV = { WS_URL: '${wsUrl}' };`

  // Write env.js to public for serving
  fs.writeFileSync(path.join(publicDir, 'env.js'), envJs)

  return htmlContent
}

// Setup routes to serve files directly
async function setupClientRoutes() {
  // This will be handled by the server's static asset handling
  // Just ensure public assets are available
  console.log('✓ Client routes ready for direct ES module serving')
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...')
  if (serverProcess) {
    serverProcess.kill()
  }
  process.exit(0)
})

// Start everything
async function main() {
  try {
    await generateHTML()
    console.log('✓ Generated HTML template')

    await setupClientRoutes()
    await setupWatchers()

    await startServer()
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
}

main()
