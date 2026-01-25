import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.dirname(__dirname)

try {
  execSync('npx esbuild scripts/build.ts --loader:.ts=tsx --outfile=scripts/build.js', {
    cwd: rootDir,
    stdio: 'inherit',
  })

  execSync('node scripts/build.js', {
    cwd: rootDir,
    stdio: 'inherit',
  })
} catch (err) {
  process.exit(1)
}
