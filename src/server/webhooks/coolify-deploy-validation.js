import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import { LoggerFactory } from '../../core/utils/logging/index.js'

const logger = LoggerFactory.get('CoolifyDeployValidation')

export class CoolifyDeployValidation {
  static isValidPayload(payload) {
    return (
      payload &&
      typeof payload === 'object' &&
      payload.event &&
      ['deployment', 'manual_deployment'].includes(payload.event) &&
      payload.commit &&
      payload.branch
    )
  }

  static async verifyBuild(rootDir) {
    try {
      const buildDir = path.join(rootDir, 'build')
      const publicDir = path.join(buildDir, 'public')

      if (!fs.existsSync(buildDir)) {
        throw new Error('Build directory not found')
      }

      if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
        throw new Error('index.html not found in build')
      }

      if (!fs.existsSync(path.join(buildDir, 'index.js'))) {
        throw new Error('Server bundle not found')
      }

      logger.info('Build verification passed')
    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`)
    }
  }

  static async runHealthCheck() {
    try {
      const healthUrl = process.env.HEALTH_CHECK_URL || 'http://localhost:3000/health'
      const timeout = 30000
      const startTime = Date.now()

      while (Date.now() - startTime < timeout) {
        try {
          const response = await fetch(healthUrl, {
            method: 'GET',
            timeout: 5000,
          })

          if (response.ok) {
            logger.info('Health check passed')
            return true
          }
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }
      }

      logger.info('Health check timeout')
      return false
    } catch (error) {
      logger.error('Health check error', error)
      return false
    }
  }

  static async pullLatestCode(rootDir, commit) {
    try {
      execSync(`git fetch origin`, { cwd: rootDir, stdio: 'inherit' })
      execSync(`git checkout ${commit}`, { cwd: rootDir, stdio: 'inherit' })
      logger.info('Checked out commit', { commit })
    } catch (error) {
      throw new Error(`Failed to pull code: ${error.message}`)
    }
  }

  static async installDependencies(rootDir) {
    try {
      execSync('npm ci', { cwd: rootDir, stdio: 'inherit' })
      logger.info('Dependencies installed')
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error.message}`)
    }
  }

  static async buildProject(rootDir, environment) {
    try {
      if (environment === 'staging') {
        execSync('npm run build:staging', { cwd: rootDir, stdio: 'inherit' })
      } else {
        execSync('npm run build', { cwd: rootDir, stdio: 'inherit' })
      }
      logger.info('Build completed')
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`)
    }
  }

  static async attemptRollback(rootDir) {
    try {
      execSync('git log --oneline -n 5', { cwd: rootDir, encoding: 'utf8' })

      const previousTag = execSync('git tag --list "v*" --sort=-version:refname | head -1', {
        cwd: rootDir,
        encoding: 'utf8',
      })
        .trim()

      if (previousTag) {
        logger.info('Rolling back to previous tag', { tag: previousTag })
        execSync(`git checkout ${previousTag}`, { cwd: rootDir, stdio: 'inherit' })
        await this.installDependencies(rootDir)
        await this.buildProject(rootDir, 'production')
        logger.info('Rollback completed')
        return true
      }
    } catch (error) {
      logger.error('Rollback failed', { error: error.message })
    }

    return false
  }
}
