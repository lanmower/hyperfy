import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('LifecycleCoordinator')

export class LifecycleCoordinator {
  constructor() {
    this.resources = new Map()
    this.layers = []
    this.disposed = false
    this.disposalOrder = []
  }

  register(name, resource, layer = 0) {
    if (this.resources.has(name)) {
      logger.warn('Resource already registered', { name })
      return
    }

    this.resources.set(name, { resource, layer })

    if (!this.layers[layer]) {
      this.layers[layer] = []
    }
    this.layers[layer].push(name)

    return resource
  }

  unregister(name) {
    if (this.resources.has(name)) {
      const { layer } = this.resources.get(name)
      this.resources.delete(name)

      if (this.layers[layer]) {
        const index = this.layers[layer].indexOf(name)
        if (index >= 0) {
          this.layers[layer].splice(index, 1)
        }
      }
    }
  }

  get(name) {
    const entry = this.resources.get(name)
    return entry?.resource || null
  }

  has(name) {
    return this.resources.has(name)
  }

  dispose() {
    if (this.disposed) {
      logger.warn('LifecycleCoordinator already disposed')
      return
    }

    this.disposalOrder = []

    for (let layer = this.layers.length - 1; layer >= 0; layer--) {
      const layerResources = this.layers[layer]
      if (!layerResources) continue

      for (const name of layerResources) {
        const entry = this.resources.get(name)
        if (!entry) continue

        try {
          const { resource } = entry
          if (resource && typeof resource.dispose === 'function') {
            resource.dispose()
          }
          this.disposalOrder.push(name)
        } catch (err) {
          logger.error('Failed to dispose resource', {
            name,
            layer,
            error: err.message
          })
        }
      }
    }

    this.resources.clear()
    this.layers = []
    this.disposed = true

    logger.info('LifecycleCoordinator disposed', {
      resourceCount: this.disposalOrder.length
    })
  }

  getStats() {
    const byLayer = {}
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i]) {
        byLayer[i] = this.layers[i].length
      }
    }

    return {
      totalResources: this.resources.size,
      layers: byLayer,
      disposed: this.disposed,
      disposalOrder: this.disposalOrder
    }
  }

  isDisposed() {
    return this.disposed
  }
}

export const lifecycleCoordinator = new LifecycleCoordinator()
