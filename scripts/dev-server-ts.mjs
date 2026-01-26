import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.dirname(__dirname)

try {
  execSync('node scripts/dev-server.ts', {
    cwd: rootDir,
    stdio: 'inherit',
  })
} catch (err) {
  process.exit(1)
}
