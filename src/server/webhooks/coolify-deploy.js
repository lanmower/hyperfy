import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { LoggerFactory } from '../../core/utils/logging/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(dirname, '../../../')
const logger = LoggerFactory.get('CoolifyDeploy')

const deploymentStates = new Map()

export async function registerCoolifyWebhook(fastify) {
  fastify.post('/api/webhook/coolify-deploy', async (request, reply) => {
    try {
      const payload = request.body

      if (!isValidPayload(payload)) {
        return reply.code(400).send({ error: 'Invalid payload' })
      }

      const deploymentId = `${payload.commit}-${Date.now()}`
      deploymentStates.set(deploymentId, {
        status: 'pending',
        started: Date.now(),
        event: payload.event,
        environment: payload.environment,
        commit: payload.commit,
        branch: payload.branch,
      })

      reply.code(202).send({
        deploymentId,
        status: 'accepted',
        message: 'Deployment queued',
      })

      handleDeployment(payload, deploymentId).catch(error => {
        logger.error('Deployment failed', error)
        const state = deploymentStates.get(deploymentId)
        if (state) {
          state.status = 'failed'
          state.error = error.message
        }
      })
    } catch (error) {
      logger.error('Webhook error', error)
      return reply.code(500).send({ error: 'Internal server error' })
    }
  })

  fastify.get('/api/webhook/coolify-deploy/:deploymentId', async (request, reply) => {
    const { deploymentId } = request.params
    const state = deploymentStates.get(deploymentId)

    if (!state) {
      return reply.code(404).send({ error: 'Deployment not found' })
    }

    return reply.send({
      deploymentId,
      ...state,
      duration: state.status === 'completed' ? state.completed - state.started : Date.now() - state.started,
    })
  })
}

function isValidPayload(payload) {
  return (
    payload &&
    typeof payload === 'object' &&
    payload.event &&
    ['deployment', 'manual_deployment'].includes(payload.event) &&
    payload.commit &&
    payload.branch
  )
}

async function handleDeployment(payload, deploymentId) {
  const state = deploymentStates.get(deploymentId)

  try {
    state.status = 'in_progress'
    state.step = 'pulling_code'

    await pullLatestCode(payload.commit)
    state.step = 'installing_dependencies'

    await installDependencies()
    state.step = 'building'

    await buildProject(payload.environment)
    state.step = 'verifying'

    await verifyBuild()
    state.step = 'health_check'

    const healthCheckPassed = await runHealthCheck()
    if (!healthCheckPassed) {
      throw new Error('Health check failed')
    }

    state.status = 'completed'
    state.completed = Date.now()

    logger.info('Deployment completed successfully', { deploymentId })
  } catch (error) {
    state.status = 'failed'
    state.error = error.message
    state.completed = Date.now()

    logger.error('Deployment failed', { deploymentId, error })

    if (state.step === 'health_check') {
      logger.info('Attempting automatic rollback...')
      await attemptRollback()
    }

    throw error
  }
}

async function pullLatestCode(commit) {
  try {
    execSync(`git fetch origin`, { cwd: rootDir, stdio: 'inherit' })
    execSync(`git checkout ${commit}`, { cwd: rootDir, stdio: 'inherit' })
    logger.info('Checked out commit', { commit })
  } catch (error) {
    throw new Error(`Failed to pull code: ${error.message}`)
  }
}

async function installDependencies() {
  try {
    execSync('npm ci', { cwd: rootDir, stdio: 'inherit' })
    logger.info('Dependencies installed')
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${error.message}`)
  }
}

async function buildProject(environment) {
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

async function verifyBuild() {
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

async function runHealthCheck() {
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

async function attemptRollback() {
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
      await installDependencies()
      await buildProject('production')
      logger.info('Rollback completed')
      return true
    }
  } catch (error) {
    logger.error('Rollback failed', { error: error.message })
  }

  return false
}

export function getDeploymentStatus(deploymentId) {
  return deploymentStates.get(deploymentId) || null
}

export function getAllDeployments() {
  return Array.from(deploymentStates.entries()).map(([id, state]) => ({
    deploymentId: id,
    ...state,
  }))
}
