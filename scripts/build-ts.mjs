import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.dirname(__dirname)

try {
  console.log('[build] Building with Node.js directly...')

  const buildDir = path.join(rootDir, 'build')
  const srcDir = path.join(rootDir, 'src')

  // Remove old build
  if (fs.existsSync(buildDir)) {
    console.log('[build] Removing old build directory...')
    execSync(`rmdir /s /q "${buildDir}"`, { shell: 'cmd.exe', stdio: 'pipe' })
    console.log('[build] Build directory removed')
  }

  // Create new build structure
  console.log('[build] Creating build directory structure...')
  fs.mkdirSync(buildDir, { recursive: true })
  fs.mkdirSync(path.join(buildDir, 'src'), { recursive: true })
  fs.mkdirSync(path.join(buildDir, 'public'), { recursive: true })

  // Copy src directory
  console.log('[build] Copying source files...')
  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true })
    fs.readdirSync(src).forEach(file => {
      const srcFile = path.join(src, file)
      const destFile = path.join(dest, file)
      if (fs.statSync(srcFile).isDirectory()) {
        copyDir(srcFile, destFile)
      } else {
        fs.copyFileSync(srcFile, destFile)
      }
    })
  }

  copyDir(srcDir, path.join(buildDir, 'src'))

  // Copy entry point
  const entryPoint = path.join(srcDir, 'server', 'index.js')
  if (fs.existsSync(entryPoint)) {
    fs.copyFileSync(entryPoint, path.join(buildDir, 'index.js'))
  }

  console.log('[build] Build succeeded (client uses hot reloading ES modules, not bundled)')
  process.exit(0)
} catch (err) {
  console.error('[build] Build failed:', err.message)
  process.exit(1)
}
