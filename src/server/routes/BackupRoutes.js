import { APIMethodWrapper } from '../utils/api/APIMethodWrapper.js'

const checkAdminCode = (request) => {
  const adminCode = request.headers['x-admin-code']
  if (!adminCode || adminCode !== process.env.ADMIN_CODE) {
    throw new Error('Unauthorized')
  }
}

export function registerBackupRoutes(fastify, backupManager) {
  fastify.get('/api/admin/backups', async (request, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        checkAdminCode(request)
        const backups = await backupManager.listBackups()
        return reply.send({
          success: true,
          backups,
          total: backups.length,
          stats: {
            isBackingUp: backupManager.isBackingUp,
            lastBackup: backupManager.lastBackup,
            config: {
              maxBackups: backupManager.maxBackups,
              retentionDays: backupManager.retentionDays,
            },
          },
        })
      },
      reply,
      { logger: fastify.logger, defaultStatusCode: 401, defaultMessage: 'Unauthorized' }
    )
  })

  fastify.post('/api/admin/backups/create', async (request, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        checkAdminCode(request)
        const { label } = request.body || {}
        const result = await backupManager.createBackup(label)

        if (result.success) {
          fastify.logger.info('Backup created', { backupId: result.backup.id })
          return reply.send(result)
        } else {
          return reply.code(500).send(result)
        }
      },
      reply,
      { logger: fastify.logger, defaultStatusCode: 401, defaultMessage: 'Unauthorized' }
    )
  })

  fastify.post('/api/admin/backups/:backupId/restore', async (request, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        checkAdminCode(request)
        const { backupId } = request.params
        const result = await backupManager.restoreBackup(backupId)

        if (result.success) {
          fastify.logger.warn('Backup restored', { backupId })
          return reply.send(result)
        } else {
          return reply.code(400).send(result)
        }
      },
      reply,
      { logger: fastify.logger, defaultStatusCode: 401, defaultMessage: 'Unauthorized' }
    )
  })

  fastify.delete('/api/admin/backups/:backupId', async (request, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        checkAdminCode(request)
        const { backupId } = request.params
        const result = await backupManager.deleteBackup(backupId)

        if (result.success) {
          fastify.logger.info('Backup deleted', { backupId })
          return reply.send(result)
        } else {
          return reply.code(400).send(result)
        }
      },
      reply,
      { logger: fastify.logger, defaultStatusCode: 401, defaultMessage: 'Unauthorized' }
    )
  })

  fastify.post('/api/admin/backups/:backupId/verify', async (request, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        checkAdminCode(request)
        const { backupId } = request.params
        const result = await backupManager.verifyBackup(backupId)
        return reply.send(result)
      },
      reply,
      { logger: fastify.logger, defaultStatusCode: 401, defaultMessage: 'Unauthorized' }
    )
  })

  fastify.post('/api/admin/backups/schedule/:interval', async (request, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        checkAdminCode(request)
        const { interval } = request.params
        const intervalMinutes = parseInt(interval)

        if (isNaN(intervalMinutes) || intervalMinutes < 1) {
          throw new Error('Invalid interval (must be >= 1 minute)')
        }

        backupManager.scheduleBackups(intervalMinutes)
        fastify.logger.info('Backup schedule updated', { intervalMinutes })

        return reply.send({
          success: true,
          message: `Backups scheduled every ${intervalMinutes} minutes`,
        })
      },
      reply,
      { logger: fastify.logger, defaultStatusCode: 401, defaultMessage: 'Unauthorized' }
    )
  })

  fastify.post('/api/admin/backups/schedule/stop', async (request, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        checkAdminCode(request)
        backupManager.stopScheduling()
        fastify.logger.info('Backup scheduling stopped')

        return reply.send({
          success: true,
          message: 'Scheduled backups stopped',
        })
      },
      reply,
      { logger: fastify.logger, defaultStatusCode: 401, defaultMessage: 'Unauthorized' }
    )
  })
}
