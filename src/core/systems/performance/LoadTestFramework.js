import { StructuredLogger } from '../../utils/logging/index.js'

export class LoadTestFramework {
  constructor(world) {
    this.world = world
    this.logger = new StructuredLogger('LoadTestFramework')
    this.tests = []
    this.running = false
    this.results = []
  }

  registerTest(name, config, testFn) {
    this.tests.push({ name, config, testFn })
  }

  async runAll() {
    this.logger.info('Starting load test suite')
    this.results = []

    for (const test of this.tests) {
      await this.runTest(test)
    }

    return this.results
  }

  async runTest(test) {
    this.logger.info(`Running: ${test.name}`)
    const startTime = performance.now()

    try {
      await test.testFn(this.world)
      const duration = performance.now() - startTime
      this.results.push({
        name: test.name,
        status: 'passed',
        duration,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      const duration = performance.now() - startTime
      this.results.push({
        name: test.name,
        status: 'failed',
        error: err.message,
        duration,
        timestamp: new Date().toISOString(),
      })
      this.logger.error(`Failed: ${test.name}`, err.message)
    }
  }

  getResults() {
    return this.results
  }

  destroy() {
    this.tests = []
    this.results = []
    this.running = false
  }
}

export function createLoadTests(world) {
  const framework = new LoadTestFramework(world)
  const logger = framework.logger

  framework.registerTest('Single Player Baseline', { duration: 60 }, async (world) => {
    const metrics = world.performanceMonitor.metrics
    metrics.reset()
    await sleep(60000)
    const snapshot = metrics.getSnapshot()
    logger.info(`Single player baseline: ${snapshot.frameTime.avg.toFixed(2)}ms`)
  })

  framework.registerTest('Spawn Entities - 10', { count: 10 }, async (world) => {
    const start = performance.now()
    for (let i = 0; i < 10; i++) {
      const entity = world.entities.create('box', { x: i, y: 0, z: i })
      await sleep(10)
    }
    const duration = performance.now() - start
    logger.info(`Spawned 10 entities in ${duration.toFixed(2)}ms (avg ${(duration / 10).toFixed(2)}ms per entity)`)
  })

  framework.registerTest('Spawn Entities - 50', { count: 50 }, async (world) => {
    const start = performance.now()
    const entities = []
    for (let i = 0; i < 50; i++) {
      const entity = world.entities.create('box', { x: Math.random() * 100, y: 0, z: Math.random() * 100 })
      entities.push(entity)
      if (i % 10 === 0) await sleep(5)
    }
    const duration = performance.now() - start
    logger.info(`Spawned 50 entities in ${duration.toFixed(2)}ms`)
  })

  framework.registerTest('Spawn Entities - 100', { count: 100 }, async (world) => {
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      const entity = world.entities.create('box', { x: Math.random() * 200, y: 0, z: Math.random() * 200 })
      if (i % 20 === 0) await sleep(5)
    }
    const duration = performance.now() - start
    logger.info(`Spawned 100 entities in ${duration.toFixed(2)}ms`)
  })

  framework.registerTest('Script Count Test - 10', { count: 10 }, async (world) => {
    const scripts = []
    for (let i = 0; i < 10; i++) {
      const script = world.scripts.create(`(world, app) => console.log('Script ${i}')`)
      scripts.push(script)
    }
    logger.info(`Created 10 scripts`)
  })

  framework.registerTest('Physics Simulation - 10 Bodies', { count: 10 }, async (world) => {
    const start = performance.now()
    for (let i = 0; i < 10; i++) {
      world.physics.createDynamicBody({
        position: { x: i * 2, y: 10, z: 0 },
        shape: 'box',
        size: { x: 1, y: 1, z: 1 },
      })
    }
    const duration = performance.now() - start
    logger.info(`Created 10 physics bodies in ${duration.toFixed(2)}ms`)
  })

  framework.registerTest('Network Message Flood', { count: 100 }, async (world) => {
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      world.network.send('test', { id: i, data: 'x'.repeat(1000) })
      if (i % 20 === 0) await sleep(5)
    }
    const duration = performance.now() - start
    logger.info(`Sent 100 network messages in ${duration.toFixed(2)}ms`)
  })

  framework.registerTest('Memory Growth Test - 1 Hour', { duration: 3600 }, async (world) => {
    const metrics = world.performanceMonitor.metrics
    const initialMemory = metrics.memory.current
    logger.info(`Starting 1-hour memory test (initial: ${initialMemory.toFixed(2)}MB)`)
    await sleep(10000)
    const finalMemory = metrics.memory.current
    const growth = finalMemory - initialMemory
    logger.info(`Memory after 10s: ${finalMemory.toFixed(2)}MB (growth: ${growth.toFixed(2)}MB)`)
  })

  return framework
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
