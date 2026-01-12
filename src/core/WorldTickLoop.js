import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('WorldTickLoop')

export class WorldTickLoop {
  constructor(world) {
    this.world = world
    this.systems = []
  }

  registerSystem(system) {
    this.systems.push(system)
  }

  tick = time => {
    this.preTick()
    time /= 1000
    let delta = time - this.world.time
    if (delta < 0) delta = 0
    if (delta > this.world.maxDeltaTime) {
      delta = this.world.maxDeltaTime
    }
    this.world.frame++
    this.world.time = time
    this.world.accumulator += delta
    const willFixedStep = this.world.accumulator >= this.world.fixedDeltaTime
    this.preFixedUpdate(willFixedStep)
    while (this.world.accumulator >= this.world.fixedDeltaTime) {
      this.fixedUpdate(this.world.fixedDeltaTime)
      this.postFixedUpdate(this.world.fixedDeltaTime)
      this.world.accumulator -= this.world.fixedDeltaTime
    }
    const alpha = this.world.accumulator / this.world.fixedDeltaTime
    this.preUpdate(alpha)
    this.update(delta)
    this.postUpdate(delta)
    this.lateUpdate(delta)
    this.postLateUpdate(delta)
    this.commit()
    this.postTick()
  }

  invokeSystemLifecycle(method, ...args) {
    for (const system of this.systems) {
      system?.[method]?.(...args)
    }
  }

  invokeHotLifecycle(method, ...args) {
    for (const item of this.world.hot) {
      item[method]?.(...args)
    }
  }

  preTick() {
    this.invokeSystemLifecycle('preTick')
  }

  preFixedUpdate(willFixedStep) {
    this.invokeSystemLifecycle('preFixedUpdate', willFixedStep)
  }

  fixedUpdate(delta) {
    this.invokeHotLifecycle('fixedUpdate', delta)
    this.invokeSystemLifecycle('fixedUpdate', delta)
  }

  postFixedUpdate(delta) {
    this.invokeSystemLifecycle('postFixedUpdate', delta)
  }

  preUpdate(alpha) {
    this.invokeSystemLifecycle('preUpdate', alpha)
  }

  update(delta) {
    this.invokeHotLifecycle('update', delta)
    this.world.pluginHooks.execute('world:update', delta).catch(err => {
      logger.error('Plugin hook error', { error: err.message, hook: 'world:update' })
    })

    const updateStart = performance.now()
    this.invokeSystemLifecycle('update', delta)
    const updateDuration = performance.now() - updateStart

    if (this.world.frame % 30 === 0) {
      this.world.performanceMonitor.recordFramePhase('update', updateDuration)
    }
  }

  postUpdate(delta) {
    this.invokeSystemLifecycle('postUpdate', delta)
  }

  lateUpdate(delta) {
    this.invokeHotLifecycle('lateUpdate', delta)

    const lateUpdateStart = performance.now()
    this.invokeSystemLifecycle('lateUpdate', delta)
    const lateUpdateDuration = performance.now() - lateUpdateStart

    if (this.world.frame % 30 === 0) {
      this.world.performanceMonitor.recordFramePhase('lateUpdate', lateUpdateDuration)
      this.world.performanceMonitor.recordEntityOperation('hot.lateUpdate', lateUpdateDuration, this.world.hot.size)
    }
  }

  postLateUpdate(delta) {
    this.invokeHotLifecycle('postLateUpdate', delta)
    this.invokeSystemLifecycle('postLateUpdate', delta)
  }

  commit() {
    this.invokeSystemLifecycle('commit')
  }

  postTick() {
    this.invokeSystemLifecycle('postTick')
  }
}
