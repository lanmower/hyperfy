import fs from 'fs-extra'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(dirname, '../../..')

async function log(type, message) {
  const prefix = {
    pass: '✓',
    fail: '✗',
    warn: '⚠',
    info: 'ℹ',
  }[type]
  console.log(`${prefix} ${message}`)
}

async function getReleaseHistory() {
  try {
    const tags = execSync('git tag --list "v*" --sort=-version:refname', {
      cwd: rootDir,
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean)
      .slice(0, 20)

    return tags
  } catch (error) {
    await log('fail', 'Failed to get release history')
    return []
  }
}

async function getCurrentVersion() {
  try {
    const tag = execSync('git describe --tags --abbrev=0', {
      cwd: rootDir,
      encoding: 'utf8',
    })
      .trim()

    return tag
  } catch (error) {
    return null
  }
}

async function verifyVersion(tag) {
  try {
    execSync(`git rev-parse ${tag}`, {
      cwd: rootDir,
      encoding: 'utf8',
    })
    return true
  } catch (error) {
    return false
  }
}

async function checkoutVersion(tag) {
  try {
    await log('info', `Checking out version ${tag}...`)
    execSync(`git checkout ${tag}`, {
      cwd: rootDir,
      stdio: 'inherit',
    })
    await log('pass', `Successfully checked out ${tag}`)
    return true
  } catch (error) {
    await log('fail', `Failed to checkout ${tag}: ${error.message}`)
    return false
  }
}

async function buildVersion() {
  try {
    await log('info', 'Installing dependencies...')
    execSync('npm ci', {
      cwd: rootDir,
      stdio: 'inherit',
    })

    await log('info', 'Building project...')
    execSync('npm run build', {
      cwd: rootDir,
      stdio: 'inherit',
    })

    await log('pass', 'Build completed successfully')
    return true
  } catch (error) {
    await log('fail', `Build failed: ${error.message}`)
    return false
  }
}

async function runHealthCheck() {
  try {
    const healthUrl = process.env.HEALTH_CHECK_URL || 'http://localhost:3000/health'
    const response = await fetch(healthUrl, { timeout: 5000 })

    if (response.ok) {
      await log('pass', 'Health check passed')
      return true
    } else {
      await log('warn', `Health check returned status ${response.status}`)
      return false
    }
  } catch (error) {
    await log('warn', `Health check failed: ${error.message}`)
    return false
  }
}

async function recordRollback(fromTag, toTag) {
  try {
    const rollbackLog = path.join(rootDir, '.rollback-history.json')
    let history = []

    if (await fs.pathExists(rollbackLog)) {
      history = await fs.readJson(rollbackLog)
    }

    history.push({
      timestamp: new Date().toISOString(),
      from: fromTag,
      to: toTag,
      actor: process.env.USER || 'automated',
    })

    await fs.writeJson(rollbackLog, history, { spaces: 2 })
    await log('pass', 'Rollback recorded in history')
  } catch (error) {
    await log('warn', `Failed to record rollback: ${error.message}`)
  }
}

async function promptForVersion(versions) {
  if (!versions.length) {
    await log('fail', 'No previous versions found')
    return null
  }

  console.log('\nAvailable versions to rollback to:')
  versions.forEach((version, index) => {
    console.log(`  ${index + 1}. ${version}`)
  })

  const index = parseInt(process.argv[2], 10) - 1
  if (isNaN(index) || index < 0 || index >= versions.length) {
    await log('fail', 'Invalid version selection')
    return null
  }

  return versions[index]
}

async function rollback() {
  console.log('\n========== Rollback Procedure ==========\n')

  const currentVersion = await getCurrentVersion()
  if (currentVersion) {
    await log('info', `Current version: ${currentVersion}`)
  } else {
    await log('warn', 'No current version tag found')
  }

  const versions = await getReleaseHistory()
  if (!versions.length) {
    await log('fail', 'No release history available')
    process.exit(1)
  }

  const targetVersion = await promptForVersion(versions)
  if (!targetVersion) {
    process.exit(1)
  }

  await log('info', `Rolling back to ${targetVersion}...`)

  const versionExists = await verifyVersion(targetVersion)
  if (!versionExists) {
    await log('fail', `Version ${targetVersion} does not exist`)
    process.exit(1)
  }

  const checkoutSuccess = await checkoutVersion(targetVersion)
  if (!checkoutSuccess) {
    process.exit(1)
  }

  const buildSuccess = await buildVersion()
  if (!buildSuccess) {
    process.exit(1)
  }

  await log('info', 'Running health check...')
  const healthCheckSuccess = await runHealthCheck()

  if (healthCheckSuccess) {
    if (currentVersion) {
      await recordRollback(currentVersion, targetVersion)
    }

    console.log('\n========== Rollback Complete ==========\n')
    await log('pass', `Successfully rolled back to ${targetVersion}`)
    console.log('\nNext steps:')
    console.log('1. Verify application functionality')
    console.log('2. Monitor system metrics')
    console.log('3. Investigate root cause of deployment failure')
    console.log('4. Deploy fix on top of current stable version\n')
  } else {
    await log('fail', 'Health check failed after rollback')
    console.log('\nPlease verify application state manually\n')
    process.exit(1)
  }
}

rollback().catch(error => {
  console.error('Rollback failed:', error)
  process.exit(1)
})
