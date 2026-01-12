import path from 'path'
import { fileURLToPath } from 'url'
import { LoggerFactory } from '../../core/utils/logging/index.js'
import { CoolifyDeployValidation } from './coolify-deploy-validation.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(dirname, '../../../')
const logger = LoggerFactory.get('CoolifyDeploy')

const deploymentStates = new Map()

export async function registerCoolifyWebhook(fastify) {
  fastify.post('/api/webhook/coolify-deploy', async (request, reply) => {
    try {
      const payload = request.body

      if (!CoolifyDeployValidation.isValidPayload(payload)) {
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

async function handleDeployment(payload, deploymentId) {
  const state = deploymentStates.get(deploymentId)

  try {
    state.status = 'in_progress'
    state.step = 'pulling_code'

    await CoolifyDeployValidation.pullLatestCode(rootDir, payload.commit)
    state.step = 'installing_dependencies'

    await CoolifyDeployValidation.installDependencies(rootDir)
    state.step = 'building'

    await CoolifyDeployValidation.buildProject(rootDir, payload.environment)
    state.step = 'verifying'

    await CoolifyDeployValidation.verifyBuild(rootDir)
    state.step = 'health_check'

    const healthCheckPassed = await CoolifyDeployValidation.runHealthCheck()
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
      await CoolifyDeployValidation.attemptRollback(rootDir)
    }

    throw error
  }
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
