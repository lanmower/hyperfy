import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { StructuredLogger } from '../core/utils/logging/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(dirname, '../../..')
const buildDir = path.join(rootDir, 'build')
const srcDir = path.join(rootDir, 'src')
const logger = new StructuredLogger('VerifyDeploy')

const checks = {
  passed: [],
  failed: [],
  warnings: [],
}

async function log(type, message) {
  const prefix = {
    pass: '✓',
    fail: '✗',
    warn: '⚠',
    info: 'ℹ',
  }[type]
  if (type === 'pass') logger.info(`${prefix} ${message}`)
  else if (type === 'fail') logger.error(`${prefix} ${message}`)
  else if (type === 'warn') logger.warn(`${prefix} ${message}`)
  else logger.info(`${prefix} ${message}`)
}

async function checkBuildDirectory() {
  try {
    const exists = await fs.pathExists(buildDir)
    if (!exists) {
      checks.failed.push('Build directory does not exist')
      await log('fail', 'Build directory does not exist')
      return false
    }

    const files = await fs.readdir(buildDir)
    if (!files.length) {
      checks.failed.push('Build directory is empty')
      await log('fail', 'Build directory is empty')
      return false
    }

    checks.passed.push('Build directory exists and contains files')
    await log('pass', 'Build directory exists and contains files')
    return true
  } catch (error) {
    checks.failed.push(`Failed to check build directory: ${error.message}`)
    await log('fail', `Failed to check build directory: ${error.message}`)
    return false
  }
}

async function checkBuildArtifacts() {
  try {
    const publicDir = path.join(buildDir, 'public')
    const indexExists = await fs.pathExists(path.join(publicDir, 'index.html'))

    if (!indexExists) {
      checks.failed.push('index.html not found in build/public')
      await log('fail', 'index.html not found in build/public')
      return false
    }

    const clientBundle = await fs.readdir(publicDir).then(files =>
      files.some(f => f.startsWith('index-') && f.endsWith('.js'))
    )

    if (!clientBundle) {
      checks.failed.push('Client bundle not found in build/public')
      await log('fail', 'Client bundle not found in build/public')
      return false
    }

    const serverBundle = await fs.pathExists(path.join(buildDir, 'index.js'))
    if (!serverBundle) {
      checks.failed.push('Server bundle not found in build/index.js')
      await log('fail', 'Server bundle not found in build/index.js')
      return false
    }

    checks.passed.push('All required build artifacts present')
    await log('pass', 'All required build artifacts present')
    return true
  } catch (error) {
    checks.failed.push(`Failed to check build artifacts: ${error.message}`)
    await log('fail', `Failed to check build artifacts: ${error.message}`)
    return false
  }
}

async function checkBundleSize() {
  try {
    const publicDir = path.join(buildDir, 'public')
    const files = await fs.readdir(publicDir)

    let totalSize = 0
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        const stat = await fs.stat(path.join(publicDir, file))
        totalSize += stat.size
      }
    }

    const maxWarn = 1024 * 400
    const maxError = 1024 * 600

    if (totalSize > maxError) {
      checks.failed.push(
        `Bundle size (${(totalSize / 1024).toFixed(2)} KB) exceeds error threshold (${(maxError / 1024).toFixed(2)} KB)`
      )
      await log('fail', `Bundle size (${(totalSize / 1024).toFixed(2)} KB) exceeds error threshold`)
      return false
    }

    if (totalSize > maxWarn) {
      checks.warnings.push(
        `Bundle size (${(totalSize / 1024).toFixed(2)} KB) exceeds warn threshold (${(maxWarn / 1024).toFixed(2)} KB)`
      )
      await log('warn', `Bundle size (${(totalSize / 1024).toFixed(2)} KB) exceeds warn threshold`)
    } else {
      checks.passed.push(`Bundle size acceptable: ${(totalSize / 1024).toFixed(2)} KB`)
      await log('pass', `Bundle size acceptable: ${(totalSize / 1024).toFixed(2)} KB`)
    }

    return true
  } catch (error) {
    checks.warnings.push(`Failed to check bundle size: ${error.message}`)
    await log('warn', `Failed to check bundle size: ${error.message}`)
    return true
  }
}

async function checkSecretsAndApiKeys() {
  try {
    const patterns = [
      /api[_-]?key/gi,
      /secret[_-]?key/gi,
      /password/gi,
      /token/gi,
      /auth/gi,
    ]

    const buildFiles = []
    async function walkDir(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await walkDir(path.join(dir, entry.name))
          }
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          buildFiles.push(path.join(dir, entry.name))
        }
      }
    }

    await walkDir(buildDir)

    let foundSecrets = false
    for (const file of buildFiles.slice(0, 10)) {
      const content = await fs.readFile(file, 'utf8')
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            if (
              !line.includes('http') &&
              !line.includes('endpoint') &&
              !line.includes('scheme') &&
              !line.includes('const ')
            ) {
              foundSecrets = true
              checks.warnings.push(
                `Potential secret key found in ${path.basename(file)}:${i + 1}`
              )
              await log('warn', `Potential secret key in ${path.basename(file)}:${i + 1}`)
            }
          }
        }
      }
    }

    if (!foundSecrets) {
      checks.passed.push('No obvious secrets found in build')
      await log('pass', 'No obvious secrets found in build')
    }

    return true
  } catch (error) {
    checks.warnings.push(`Secret check failed: ${error.message}`)
    await log('warn', `Secret check failed: ${error.message}`)
    return true
  }
}

async function checkConsoleStatements() {
  try {
    const jsFiles = []
    async function findJsFiles(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await findJsFiles(path.join(dir, entry.name))
          }
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          jsFiles.push(path.join(dir, entry.name))
        }
      }
    }

    await findJsFiles(buildDir)

    let consoleCount = 0
    for (const file of jsFiles.slice(0, 5)) {
      const content = await fs.readFile(file, 'utf8')
      const matches = content.match(/console\.(log|debug|trace)/g)
      if (matches) {
        consoleCount += matches.length
      }
    }

    if (consoleCount > 0) {
      checks.warnings.push(`Found ${consoleCount} console.log/debug/trace statements in build`)
      await log('warn', `Found ${consoleCount} console statements in build`)
    } else {
      checks.passed.push('No debug console statements in build')
      await log('pass', 'No debug console statements in build')
    }

    return true
  } catch (error) {
    checks.warnings.push(`Console check failed: ${error.message}`)
    await log('warn', `Console check failed: ${error.message}`)
    return true
  }
}

async function checkPackageJson() {
  try {
    const pkgPath = path.join(rootDir, 'package.json')
    const pkg = await fs.readJson(pkgPath)

    if (!pkg.version) {
      checks.failed.push('package.json missing version field')
      await log('fail', 'package.json missing version field')
      return false
    }

    if (!pkg.name) {
      checks.failed.push('package.json missing name field')
      await log('fail', 'package.json missing name field')
      return false
    }

    checks.passed.push(`Package version: ${pkg.version}`)
    await log('pass', `Package version: ${pkg.version}`)
    return true
  } catch (error) {
    checks.failed.push(`Failed to check package.json: ${error.message}`)
    await log('fail', `Failed to check package.json: ${error.message}`)
    return false
  }
}

async function checkSourceMaps() {
  try {
    const publicDir = path.join(buildDir, 'public')
    const files = await fs.readdir(publicDir)
    const jsFiles = files.filter(f => f.endsWith('.js'))
    const mapFiles = files.filter(f => f.endsWith('.js.map'))

    if (!jsFiles.length) {
      checks.failed.push('No JavaScript files found in build')
      await log('fail', 'No JavaScript files found in build')
      return false
    }

    if (mapFiles.length > 0) {
      checks.passed.push(`Source maps present: ${mapFiles.length} files`)
      await log('pass', `Source maps present: ${mapFiles.length} files`)
    } else {
      checks.warnings.push('No source maps found (may be production build)')
      await log('warn', 'No source maps found (production build)')
    }

    return true
  } catch (error) {
    checks.failed.push(`Failed to check source maps: ${error.message}`)
    await log('fail', `Failed to check source maps: ${error.message}`)
    return false
  }
}

async function runVerification() {
  logger.info('\n========== Pre-Deployment Verification ==========\n')

  const results = await Promise.all([
    checkPackageJson(),
    checkBuildDirectory(),
    checkBuildArtifacts(),
    checkBundleSize(),
    checkSecretsAndApiKeys(),
    checkConsoleStatements(),
    checkSourceMaps(),
  ])

  logger.info('\n========== Verification Summary ==========\n')
  logger.info(`Passed checks: ${checks.passed.length}`)
  logger.info(`Warnings: ${checks.warnings.length}`)
  logger.info(`Failed checks: ${checks.failed.length}`)

  if (checks.warnings.length > 0) {
    logger.info('\nWarnings:')
    checks.warnings.forEach(w => logger.warn(`  - ${w}`))
  }

  if (checks.failed.length > 0) {
    logger.info('\nFailed checks:')
    checks.failed.forEach(f => logger.error(`  - ${f}`))
    process.exit(1)
  }

  logger.info('\n✓ All checks passed!\n')
  process.exit(0)
}

runVerification().catch(error => {
  logger.error('Verification failed', error)
  process.exit(1)
})
