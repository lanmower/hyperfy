import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('AsyncInitializer')

export class AsyncInitializer {
  constructor(name) {
    this.name = name
    this.state = 'idle'
    this.phases = []
    this.currentPhase = -1
    this.startTime = null
    this.endTime = null
    this.error = null
    this.results = {}
  }

  addPhase(name, fn, parallel = false) {
    this.phases.push({
      name,
      fn,
      parallel,
      startTime: null,
      endTime: null,
      duration: 0,
      result: null,
      error: null,
    })
    return this
  }

  async init() {
    if (this.state !== 'idle') {
      logger.error(`Cannot initialize ${this.name} - already ${this.state}`)
      return false
    }

    this.state = 'initializing'
    this.startTime = performance.now()

    try {
      for (let i = 0; i < this.phases.length; i++) {
        this.currentPhase = i
        const phase = this.phases[i]

        phase.startTime = performance.now()
        logger.info(`Initializing ${this.name}`, { phase: phase.name })

        try {
          if (phase.parallel) {
            phase.result = await Promise.all(
              Array.isArray(phase.fn) ? phase.fn.map(f => Promise.resolve(f())) : [Promise.resolve(phase.fn())]
            )
          } else {
            phase.result = await Promise.resolve(phase.fn())
          }

          phase.endTime = performance.now()
          phase.duration = phase.endTime - phase.startTime

          this.results[phase.name] = phase.result

          logger.info(`Phase completed: ${phase.name}`, {
            initializer: this.name,
            duration: `${phase.duration.toFixed(2)}ms`,
          })
        } catch (error) {
          phase.error = error
          phase.endTime = performance.now()
          phase.duration = phase.endTime - phase.startTime

          logger.error(`Phase failed: ${phase.name}`, {
            initializer: this.name,
            error: error.message,
            duration: `${phase.duration.toFixed(2)}ms`,
          })

          throw error
        }
      }

      this.state = 'initialized'
      this.endTime = performance.now()

      const totalDuration = this.endTime - this.startTime
      logger.info(`Initialization complete: ${this.name}`, {
        duration: `${totalDuration.toFixed(2)}ms`,
        phases: this.phases.length,
      })

      return true
    } catch (error) {
      this.state = 'failed'
      this.error = error
      this.endTime = performance.now()

      logger.error(`Initialization failed: ${this.name}`, {
        error: error.message,
        phase: this.phases[this.currentPhase]?.name,
        duration: `${(this.endTime - this.startTime).toFixed(2)}ms`,
      })

      return false
    }
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      currentPhase: this.currentPhase >= 0 ? this.phases[this.currentPhase]?.name : null,
      totalDuration: this.endTime && this.startTime ? this.endTime - this.startTime : null,
      phases: this.phases.map(p => ({
        name: p.name,
        duration: p.duration,
        error: p.error?.message || null,
      })),
      error: this.error?.message || null,
    }
  }

  getPhaseResult(phaseName) {
    return this.results[phaseName] || null
  }

  isReady() {
    return this.state === 'initialized'
  }

  isFailed() {
    return this.state === 'failed'
  }

  reset() {
    this.state = 'idle'
    this.currentPhase = -1
    this.startTime = null
    this.endTime = null
    this.error = null
    this.results = {}
    this.phases.forEach(p => {
      p.startTime = null
      p.endTime = null
      p.duration = 0
      p.result = null
      p.error = null
    })
  }
}

export class AsyncInitializationStrategy {
  static Sequential(phases) {
    const init = new AsyncInitializer('Sequential')
    for (const [name, fn] of Object.entries(phases)) {
      init.addPhase(name, fn, false)
    }
    return init
  }

  static Parallel(phases) {
    const init = new AsyncInitializer('Parallel')
    const fns = Object.values(phases)
    init.addPhase('all', () => Promise.all(fns), true)
    return init
  }

  static Waterfall(phases) {
    const init = new AsyncInitializer('Waterfall')
    const phaseArray = Object.entries(phases)

    for (let i = 0; i < phaseArray.length; i++) {
      const [name, fn] = phaseArray[i]
      const prevResults = phaseArray.slice(0, i).map(p => p[0])

      init.addPhase(name, async () => {
        const deps = prevResults.map(n => init.getPhaseResult(n))
        return fn(...deps)
      })
    }

    return init
  }

  static Batched(phases, batchSize = 2) {
    const init = new AsyncInitializer('Batched')
    const phaseArray = Object.entries(phases)

    for (let i = 0; i < phaseArray.length; i += batchSize) {
      const batch = phaseArray.slice(i, i + batchSize)
      const batchName = `batch_${i / batchSize}`

      init.addPhase(batchName, async () => {
        return Promise.all(batch.map(([_, fn]) => Promise.resolve(fn())))
      })
    }

    return init
  }
}
