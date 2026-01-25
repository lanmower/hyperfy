import { spawn, ChildProcess } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const port = process.env.PORT || '3000'

const proc: ChildProcess = spawn('node', [path.join(rootDir, 'src/server/index.js')], {
  cwd: rootDir,
  env: { ...process.env, PORT: port.toString() },
  stdio: 'inherit',
})

process.on('SIGINT', () => {
  proc.kill('SIGTERM')
  process.exit(0)
})

proc.on('exit', code => {
  process.exit(code || 0)
})
