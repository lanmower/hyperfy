import { HealthCheck } from './HealthCheck.js'

export class NetworkHealthCheck {
  static create(world) {
    const check = new HealthCheck('network')

    check.addCheck(
      'connection',
      async () => {
        if (!world.network) throw new Error('Network system not initialized')
        if (!world.network.connected && world.network.isClient) {
          throw new Error('Client not connected to server')
        }
      },
      true
    )

    check.addCheck('packet-handlers', async () => {
      if (!world.network.packetHandlers) {
        throw new Error('Packet handlers not initialized')
      }
      const handlerCount = Object.keys(world.network.packetHandlers).length
      if (handlerCount === 0) {
        throw new Error('No packet handlers registered')
      }
    })

    check.addCheck('message-queue', async () => {
      if (world.network.messageQueue && world.network.messageQueue.length > 1000) {
        throw new Error(`Message queue too large: ${world.network.messageQueue.length}`)
      }
    })

    return check
  }
}

export class DatabaseHealthCheck {
  static create(world) {
    const check = new HealthCheck('database')

    check.addCheck(
      'connection',
      async () => {
        if (!world.db) throw new Error('Database not initialized')
        // Try a simple query
        const result = world.db.query('SELECT 1')
        if (!result) throw new Error('Database query failed')
      },
      true
    )

    check.addCheck('tables', async () => {
      if (!world.db) throw new Error('Database not initialized')
      const tables = world.db.getTables?.() || []
      if (tables.length === 0) throw new Error('No tables found in database')
    })

    return check
  }
}

export class StorageHealthCheck {
  static create(world) {
    const check = new HealthCheck('storage')

    check.addCheck(
      'access',
      async () => {
        if (!world.storage) throw new Error('Storage not initialized')
      },
      true
    )

    check.addCheck('disk-space', async () => {
      if (!world.storage?.getUsage) return
      const usage = await world.storage.getUsage()
      if (usage && usage.percentUsed > 95) {
        throw new Error(`Storage almost full: ${usage.percentUsed}%`)
      }
    })

    return check
  }
}

export class LoaderHealthCheck {
  static create(world) {
    const check = new HealthCheck('loader')

    check.addCheck(
      'initialization',
      async () => {
        if (!world.loader) throw new Error('Loader not initialized')
      },
      true
    )

    check.addCheck('cache', async () => {
      if (!world.loader?.cache) return
      const size = world.loader.cache.size || 0
      if (size > 1000) {
        throw new Error(`Loader cache too large: ${size} items`)
      }
    })

    check.addCheck('pending-loads', async () => {
      if (!world.loader?.pendingLoads) return
      const pending = world.loader.pendingLoads.size || 0
      if (pending > 100) {
        throw new Error(`Too many pending loads: ${pending}`)
      }
    })

    return check
  }
}

export class EntityHealthCheck {
  static create(world) {
    const check = new HealthCheck('entities')

    check.addCheck('system-initialized', async () => {
      if (!world.entities) throw new Error('Entities system not initialized')
    })

    check.addCheck('entity-count', async () => {
      const count = world.entities?.items?.size || 0
      if (count > 10000) {
        throw new Error(`Too many entities: ${count}`)
      }
    })

    check.addCheck('hot-entities', async () => {
      const hotCount = world.hot?.size || 0
      if (hotCount > 500) {
        throw new Error(`Too many hot entities: ${hotCount}`)
      }
    })

    return check
  }
}

export class PhysicsHealthCheck {
  static create(world) {
    const check = new HealthCheck('physics')

    check.addCheck('system-initialized', async () => {
      if (!world.physics) throw new Error('Physics system not initialized')
    })

    check.addCheck('active-bodies', async () => {
      if (!world.physics?.getActiveBodyCount) return
      const count = world.physics.getActiveBodyCount()
      if (count > 5000) {
        throw new Error(`Too many active physics bodies: ${count}`)
      }
    })

    return check
  }
}

export class GraphicsHealthCheck {
  static create(world) {
    const check = new HealthCheck('graphics')

    check.addCheck('renderer', async () => {
      if (!world.graphics?.renderer) throw new Error('Graphics renderer not initialized')
    })

    check.addCheck('scene', async () => {
      if (!world.stage?.scene) throw new Error('Three.js scene not initialized')
    })

    check.addCheck('fps', async () => {
      if (!world.graphics?.lastFps) return
      if (world.graphics.lastFps < 15 && world.graphics.lastFps > 0) {
        throw new Error(`Low FPS: ${world.graphics.lastFps.toFixed(1)}`)
      }
    })

    return check
  }
}

export class MemoryHealthCheck {
  static create(world) {
    const check = new HealthCheck('memory')

    check.addCheck('heap-usage', async () => {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage()
        const heapPercent = (usage.heapUsed / usage.heapTotal) * 100
        if (heapPercent > 90) {
          throw new Error(`High heap usage: ${heapPercent.toFixed(1)}%`)
        }
      }
    })

    return check
  }
}

export class PluginHealthCheck {
  static create(world) {
    const check = new HealthCheck('plugins')

    check.addCheck('registry', async () => {
      if (!world.pluginRegistry) throw new Error('Plugin registry not initialized')
    })

    check.addCheck('loaded-plugins', async () => {
      const plugins = world.pluginRegistry?.getAllPlugins() || []
      if (plugins.length === 0) return // No plugins is OK

      for (const plugin of plugins) {
        if (!plugin.name) throw new Error('Invalid plugin: missing name')
      }
    })

    return check
  }
}

export class PerformanceHealthCheck {
  static create(world) {
    const check = new HealthCheck('performance')

    check.addCheck('monitor', async () => {
      if (!world.performanceMonitor) throw new Error('Performance monitor not initialized')
    })

    check.addCheck('violations', async () => {
      const violations = world.performanceMonitor?.getViolationSummary() || []
      if (violations.length > 50) {
        throw new Error(`Too many performance violations: ${violations.length}`)
      }
    })

    return check
  }
}
