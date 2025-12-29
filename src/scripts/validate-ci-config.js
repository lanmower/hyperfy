import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(dirname, '../../..')

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
  console.log(`${prefix} ${message}`)
}

async function validateWorkflows() {
  try {
    const workflowDir = path.join(rootDir, '.github/workflows')

    if (!fs.existsSync(workflowDir)) {
      checks.failed.push('Workflows directory does not exist: .github/workflows')
      await log('fail', 'Workflows directory missing')
      return false
    }

    const requiredWorkflows = ['deploy.yml', 'test.yml', 'manual-deploy.yml']
    const existingFiles = await fs.readdir(workflowDir)

    for (const workflow of requiredWorkflows) {
      if (!existingFiles.includes(workflow)) {
        checks.failed.push(`Required workflow missing: ${workflow}`)
        await log('fail', `Missing workflow: ${workflow}`)
        return false
      }

      const workflowPath = path.join(workflowDir, workflow)
      const content = await fs.readFile(workflowPath, 'utf8')

      if (!content.includes('name:') || !content.includes('on:')) {
        checks.failed.push(`Invalid workflow format in ${workflow}`)
        await log('fail', `Invalid workflow format in ${workflow}`)
        return false
      }

      checks.passed.push(`Valid workflow: ${workflow}`)
      await log('pass', `Valid workflow: ${workflow}`)
    }

    return true
  } catch (error) {
    checks.failed.push(`Failed to validate workflows: ${error.message}`)
    await log('fail', `Workflow validation error: ${error.message}`)
    return false
  }
}

async function validateDeploymentConfig() {
  try {
    const configPath = path.join(rootDir, 'deployment.config.js')

    if (!fs.existsSync(configPath)) {
      checks.failed.push('deployment.config.js not found')
      await log('fail', 'deployment.config.js missing')
      return false
    }

    const config = (await import(configPath)).default

    const requiredEnvs = ['development', 'staging', 'production']
    for (const env of requiredEnvs) {
      if (!config.environments[env]) {
        checks.failed.push(`Missing environment config: ${env}`)
        await log('fail', `Missing environment: ${env}`)
        return false
      }

      const envConfig = config.environments[env]
      if (!envConfig.name || !envConfig.apiUrl) {
        checks.failed.push(`Invalid config for ${env}`)
        await log('fail', `Invalid config for ${env}`)
        return false
      }
    }

    checks.passed.push('deployment.config.js valid')
    await log('pass', 'deployment.config.js is valid')
    return true
  } catch (error) {
    checks.failed.push(`Failed to validate config: ${error.message}`)
    await log('fail', `Config validation error: ${error.message}`)
    return false
  }
}

async function validateScripts() {
  try {
    const requiredScripts = [
      'src/scripts/verify-deploy.js',
      'src/scripts/rollback.js',
      'src/scripts/validate-ci-config.js',
    ]

    for (const scriptPath of requiredScripts) {
      const fullPath = path.join(rootDir, scriptPath)

      if (!fs.existsSync(fullPath)) {
        checks.failed.push(`Required script missing: ${scriptPath}`)
        await log('fail', `Missing script: ${scriptPath}`)
        return false
      }

      const content = await fs.readFile(fullPath, 'utf8')
      if (!content.includes('export') && !content.includes('async function')) {
        checks.warnings.push(`Script may not be valid: ${scriptPath}`)
        await log('warn', `Script format may be invalid: ${scriptPath}`)
      } else {
        checks.passed.push(`Script valid: ${scriptPath}`)
        await log('pass', `Script valid: ${scriptPath}`)
      }
    }

    return true
  } catch (error) {
    checks.failed.push(`Failed to validate scripts: ${error.message}`)
    await log('fail', `Script validation error: ${error.message}`)
    return false
  }
}

async function validatePackageJson() {
  try {
    const pkgPath = path.join(rootDir, 'package.json')
    const pkg = await fs.readJson(pkgPath)

    const requiredScripts = ['build', 'lint', 'verify', 'rollback']

    for (const script of requiredScripts) {
      if (!pkg.scripts[script]) {
        checks.failed.push(`Missing npm script: ${script}`)
        await log('fail', `Missing script in package.json: ${script}`)
        return false
      }
    }

    checks.passed.push('package.json scripts configured')
    await log('pass', 'package.json scripts configured correctly')
    return true
  } catch (error) {
    checks.failed.push(`Failed to validate package.json: ${error.message}`)
    await log('fail', `package.json validation error: ${error.message}`)
    return false
  }
}

async function validateEnvironmentFile() {
  try {
    const examplePath = path.join(rootDir, '.env.ci.example')

    if (!fs.existsSync(examplePath)) {
      checks.failed.push('.env.ci.example not found')
      await log('fail', '.env.ci.example missing')
      return false
    }

    const content = await fs.readFile(examplePath, 'utf8')
    const requiredVars = [
      'COOLIFY_WEBHOOK',
      'DEPLOYMENT_TOKEN',
      'STAGING_API_URL',
      'PROD_API_URL',
    ]

    for (const variable of requiredVars) {
      if (!content.includes(variable)) {
        checks.warnings.push(`Variable missing in .env.ci.example: ${variable}`)
        await log('warn', `Variable missing: ${variable}`)
      }
    }

    checks.passed.push('.env.ci.example present')
    await log('pass', '.env.ci.example configured')
    return true
  } catch (error) {
    checks.failed.push(`Failed to validate environment file: ${error.message}`)
    await log('fail', `Environment file validation error: ${error.message}`)
    return false
  }
}

async function validateGitConfig() {
  try {
    const gitignorePath = path.join(rootDir, '.gitignore')

    if (!fs.existsSync(gitignorePath)) {
      checks.failed.push('.gitignore not found')
      await log('fail', '.gitignore missing')
      return false
    }

    const content = await fs.readFile(gitignorePath, 'utf8')

    const requiredIgnores = ['/build', '/node_modules', '.env', '.env.local']

    let allIgnored = true
    for (const ignore of requiredIgnores) {
      if (!content.includes(ignore)) {
        checks.warnings.push(`${ignore} not in .gitignore`)
        await log('warn', `${ignore} not in .gitignore`)
        allIgnored = false
      }
    }

    if (allIgnored) {
      checks.passed.push('Git configuration valid')
      await log('pass', 'Git configuration is valid')
    }

    return true
  } catch (error) {
    checks.failed.push(`Failed to validate git config: ${error.message}`)
    await log('fail', `Git config validation error: ${error.message}`)
    return false
  }
}

async function validateCI() {
  console.log('\n========== CI/CD Configuration Validation ==========\n')

  const results = await Promise.all([
    validatePackageJson(),
    validateWorkflows(),
    validateDeploymentConfig(),
    validateScripts(),
    validateEnvironmentFile(),
    validateGitConfig(),
  ])

  console.log('\n========== Validation Summary ==========\n')
  console.log(`Passed checks: ${checks.passed.length}`)
  console.log(`Warnings: ${checks.warnings.length}`)
  console.log(`Failed checks: ${checks.failed.length}`)

  if (checks.warnings.length > 0) {
    console.log('\nWarnings:')
    checks.warnings.forEach(w => console.log(`  - ${w}`))
  }

  if (checks.failed.length > 0) {
    console.log('\nFailed checks:')
    checks.failed.forEach(f => console.log(`  - ${f}`))
    process.exit(1)
  }

  console.log('\n✓ CI/CD configuration is valid!\n')
  process.exit(0)
}

validateCI().catch(error => {
  console.error('Validation failed:', error)
  process.exit(1)
})
