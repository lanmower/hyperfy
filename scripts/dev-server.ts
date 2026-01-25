import { spawn, ChildProcess } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'
import net from 'net'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const port = parseInt(process.env.PORT || '3000')

console.log(`[dev-server] Starting development server on port ${port}...`)

async function isPortAvailable(checkPort: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close()
      resolve(true)
    })
    server.listen(checkPort, 'localhost')
  })
}

async function findAvailablePort(startPort: number): Promise<number> {
  let currentPort = startPort
  const maxAttempts = 10
  for (let i = 0; i < maxAttempts; i++) {
    if (await isPortAvailable(currentPort)) {
      return currentPort
    }
    currentPort++
  }
  throw new Error(`Could not find available port starting from ${startPort}`)
}

function watchServerFiles(callback: () => void): () => void {
  const watchPaths = [
    path.join(rootDir, 'src/server'),
    path.join(rootDir, 'src/core')
  ]

  let debounceTimer: NodeJS.Timeout | null = null
  let ready = false

  setTimeout(() => { ready = true }, 2000)

  const watchers = watchPaths.map(dirPath => {
    return fs.watch(dirPath, { recursive: true }, (eventType: string, filename: string | null) => {
      if (!ready) return
      if (!filename || (!filename.endsWith('.js') && !filename.endsWith('.mjs'))) return

      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        console.log(`[dev-server] File changed: ${filename}`)
        callback()
      }, 300)
    })
  })

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    watchers.forEach(w => w.close())
  }
}

async function main(): Promise<void> {
  try {
    const availablePort = await findAvailablePort(port)
    if (availablePort !== port) {
      console.log(`[dev-server] Port ${port} unavailable, using ${availablePort}`)
    }

    let proc: ChildProcess | null = null
    let isRestarting = false

    function startServer(): void {
      if (isRestarting) return

      proc = spawn('node', [path.join(rootDir, 'src/server/index.js')], {
        cwd: rootDir,
        env: { ...process.env, PORT: availablePort.toString() },
        stdio: 'inherit',
      })

      proc.on('exit', code => {
        if (!isRestarting) {
          process.exit(code || 0)
        }
      })
    }

    function restartServer(): void {
      if (isRestarting) return
      isRestarting = true
      console.log('[dev-server] Restarting server...')

      if (proc) {
        proc.removeAllListeners('exit')
        proc.once('exit', () => {
          isRestarting = false
          startServer()
        })
        proc.kill('SIGTERM')
      } else {
        isRestarting = false
        startServer()
      }
    }

    startServer()
    const closeWatcher = watchServerFiles(restartServer)

    process.on('SIGINT', () => {
      console.log('[dev-server] Shutting down...')
      closeWatcher()
      if (proc) {
        proc.kill('SIGTERM')
      }
      process.exit(0)
    })
  } catch (err) {
    console.error('[dev-server] Error:', (err as Error).message)
    process.exit(1)
  }
}

await main()
