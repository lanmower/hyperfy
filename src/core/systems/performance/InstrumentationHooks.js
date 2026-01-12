export function instrumentPhysicsSystem(world) {
  const physics = world.physics
  const monitor = world.performanceMonitor

  if (!physics || !monitor) return

  const originalStep = physics.step?.bind?.(physics)
  if (originalStep) {
    physics.step = function(deltaTime) {
      const start = performance.now()
      const result = originalStep(deltaTime)
      const duration = performance.now() - start
      monitor.recordPhysicsSimulation(duration)
      return result
    }
  }
}

export function instrumentEntitySystem(world) {
  const entities = world.entities
  const monitor = world.performanceMonitor

  if (!entities || !monitor) return

  const originalCreate = entities.create?.bind?.(entities)
  if (originalCreate) {
    entities.create = function(...args) {
      const start = performance.now()
      const result = originalCreate(...args)
      const duration = performance.now() - start
      monitor.recordEntitySpawn(duration)
      return result
    }
  }

  const originalDestroy = entities.destroy?.bind?.(entities)
  if (originalDestroy) {
    entities.destroy = function(...args) {
      const start = performance.now()
      const result = originalDestroy(...args)
      const duration = performance.now() - start
      monitor.recordEntityDespawn(duration)
      return result
    }
  }
}

export function instrumentNetworkSystem(world) {
  const network = world.network
  const monitor = world.performanceMonitor

  if (!network || !monitor) return

  const originalSend = network.send?.bind?.(network)
  if (originalSend) {
    network.send = function(type, data) {
      const size = JSON.stringify(data || {}).length
      monitor.recordNetworkMessage(type, size)
      return originalSend(type, data)
    }
  }
}

export function instrumentRaycastSystem(world) {
  const stage = world.stage
  const monitor = world.performanceMonitor

  if (!stage || !monitor) return

  const originalRaycast = stage.raycast?.bind?.(stage)
  if (originalRaycast) {
    stage.raycast = function(...args) {
      const start = performance.now()
      const result = originalRaycast(...args)
      const duration = performance.now() - start
      monitor.recordRaycast(duration)
      return result
    }
  }
}

export function instrumentScriptSystem(world) {
  const scripts = world.scripts
  const monitor = world.performanceMonitor

  if (!scripts || !monitor) return

  const originalExecute = scripts.executeScript?.bind?.(scripts)
  if (originalExecute) {
    scripts.executeScript = function(script, blueprint, ...args) {
      const start = performance.now()
      const result = originalExecute(script, blueprint, ...args)
      const duration = performance.now() - start
      const scriptName = blueprint?.name || 'unknown'
      monitor.recordScriptExecution(scriptName, duration)
      return result
    }
  }
}

export function instrumentRenderingSystem(world) {
  const stage = world.stage
  const monitor = world.performanceMonitor

  if (!stage || !monitor) return

  const originalRender = world.render?.bind?.(world)
  if (originalRender) {
    world.render = function(...args) {
      const start = performance.now()
      const result = originalRender(...args)
      const duration = performance.now() - start

      const stats = {
        drawCalls: stage.renderer?.info?.render?.calls || 0,
        triangles: stage.renderer?.info?.render?.triangles || 0,
        textures: stage.renderer?.info?.memory?.textures || 0,
      }

      monitor.recordRenderingUpdate(duration, stats)
      return result
    }
  }
}

export function setupAllInstruments(world) {
  instrumentPhysicsSystem(world)
  instrumentEntitySystem(world)
  instrumentNetworkSystem(world)
  instrumentRaycastSystem(world)
  instrumentScriptSystem(world)
  instrumentRenderingSystem(world)
}
