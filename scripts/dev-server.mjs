import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'
import net from 'net'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const port = parseInt(process.env.PORT || '3000')

console.log(`[dev-server] Starting development server on port ${port}...`)

async function isPortAvailable(checkPort) {
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

async function findAvailablePort(startPort) {
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

async function main() {
  try {
    const availablePort = await findAvailablePort(port)
    if (availablePort !== port) {
      console.log(`[dev-server] Port ${port} unavailable, using ${availablePort}`)
    }

    const proc = spawn('node', [path.join(rootDir, 'src/server/index.js')], {
      cwd: rootDir,
      env: { ...process.env, PORT: availablePort.toString() },
      stdio: 'inherit',
    })

    process.on('SIGINT', () => {
      console.log('[dev-server] Shutting down...')
      proc.kill('SIGTERM')
      process.exit(0)
    })

    proc.on('exit', code => {
      process.exit(code || 0)
    })
  } catch (err) {
    console.error('[dev-server] Error:', err.message)
    process.exit(1)
  }
}

await main()
