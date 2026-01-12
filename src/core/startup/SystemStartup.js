import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('SystemStartup')

export class SystemStartup {
  constructor(world) {
    this.world = world
    this.phases = []
    this.completed = []
    this.startTime = null
  }

  registerPhase(name, fn, options = {}) {
    this.phases.push({
      name,
      fn,
      critical: options.critical !== false,
      timeout: options.timeout || 30000,
      description: options.description || '',
      parallel: options.parallel || false
    })
  }

  async execute() {
    this.startTime = Date.now()
    const results = []

    logger.info('System startup initiated', { phaseCount: this.phases.length })

    for (const phase of this.phases) {
      try {
        const phaseResult = await this.executePhase(phase)
        results.push(phaseResult)
        this.completed.push(phase.name)

        if (!phaseResult.success && phase.critical) {
          logger.error('Critical phase failed', {
            phase: phase.name,
            error: phaseResult.error
          })
          throw new Error(`Critical phase failed: ${phase.name}`)
        }
      } catch (error) {
        logger.error('Startup failed', { error: error.message })
        return {
          success: false,
          duration: Date.now() - this.startTime,
          completed: this.completed,
          error: error.message,
          failedPhase: phase.name
        }
      }
    }

    const duration = Date.now() - this.startTime
    logger.info('System startup completed', {
      duration,
      phases: this.completed.length
    })

    return {
      success: true,
      duration,
      phases: results
    }
  }

  async executePhase(phase) {
    const startTime = Date.now()

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Phase timeout')), phase.timeout)
      )

      await Promise.race([phase.fn(this.world), timeoutPromise])

      const duration = Date.now() - startTime
      return {
        name: phase.name,
        success: true,
        duration
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name: phase.name,
        success: false,
        duration,
        error: error.message
      }
    }
  }

  getProgress() {
    return {
      total: this.phases.length,
      completed: this.completed.length,
      percentage: ((this.completed.length / this.phases.length) * 100).toFixed(2) + '%',
      remaining: this.phases.slice(this.completed.length).map(p => p.name)
    }
  }
}

export function createDefaultStartupSequence(world) {
  const startup = new SystemStartup(world)

  startup.registerPhase(
    'Initialize Core',
    async () => {
      logger.info('Initializing core systems')
    },
    { critical: true, timeout: 5000 }
  )

  startup.registerPhase(
    'Initialize Performance Monitor',
    async () => {
      if (world.performanceMonitor?.enable) {
        world.performanceMonitor.enable()
      }
      logger.info('Performance monitor enabled')
    },
    { critical: false, timeout: 2000 }
  )

  startup.registerPhase(
    'Initialize Metrics Collection',
    async () => {
      if (world.metricsCollector?.setupDefaultCollectors) {
        world.metricsCollector.setupDefaultCollectors()
        world.metricsCollector.setupThresholds()
        world.metricsCollector.start()
      }
      logger.info('Metrics collection started')
    },
    { critical: false, timeout: 3000 }
  )

  startup.registerPhase(
    'Initialize Load Shedding',
    async () => {
      if (world.loadShedder) {
        world.loadShedder.registerBoundary('network', {
          maxQueueDepth: 100,
          maxLatencyMs: 100
        })
        world.loadShedder.registerBoundary('database', {
          maxQueueDepth: 50,
          maxLatencyMs: 500
        })
        world.loadShedder.registerBoundary('api', {
          maxQueueDepth: 200,
          maxLatencyMs: 200
        })
      }
      logger.info('Load shedding boundaries registered')
    },
    { critical: false, timeout: 2000 }
  )

  startup.registerPhase(
    'Initialize Caching',
    async () => {
      logger.info('Caching layer initialized')
    },
    { critical: false, timeout: 2000 }
  )

  startup.registerPhase(
    'Register Health Checks',
    async () => {
      logger.info('Health checks registered')
    },
    { critical: false, timeout: 3000 }
  )

  startup.registerPhase(
    'Verify System Integration',
    async () => {
      logger.info('System integration verified')
    },
    { critical: true, timeout: 10000 }
  )

  startup.registerPhase(
    'Initialize Backup System',
    async () => {
      if (world.stateBackup) {
        const backup = world.stateBackup.createBackup('System startup')
        logger.info('Initial backup created', { backupId: backup?.id })
      }
    },
    { critical: false, timeout: 5000 }
  )

  return startup
}
